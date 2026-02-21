const Invoice = require('../models/Invoice');
const AppError = require('../utils/AppError');
const { verifyInvoiceOnChain, markInvoiceFinancedOnChain, registerReceivableOnChain, verifyReceivableOnChain, markReceivableFinancedOnChain } = require('../services/blockchain.service');
const { createAuditLog } = require('../services/audit.service');
const { sendResponse } = require('../utils/response');

/**
 * GET /lender/invoices
 * List all invoices — lender can filter by status.
 */
const getAllInvoices = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // STRICT RBAC: Only see invoices explicitly submitted to this lender
        const filter = { submittedTo: req.user.id };
        if (status) filter.status = status.toUpperCase();

        const [invoices, total] = await Promise.all([
            Invoice.find(filter)
                .populate('uploadedBy', 'name organization')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Invoice.countDocuments(filter),
        ]);

        return sendResponse(res, 200, {
            invoices,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/lender/verify/:invoiceId
 * Verify invoice status — check both DB and blockchain.
 */
const verifyInvoice = async (req, res, next) => {
    try {
        const identifier = req.params.invoiceId;

        // Find invoice — allow lookup by invoiceId OR invoiceHash
        const invoice = await Invoice.findOne({
            $or: [
                { invoiceId: identifier },
                { invoiceHash: identifier }
            ]
        })
            .populate('uploadedBy', 'name email organization')
            .populate('financedBy',  'name email organization');

        if (!invoice) {
            return next(new AppError('Invoice not found or access denied', 404));
        }

        // RBAC: lender can only verify invoices submitted to them
        if (invoice.submittedTo && invoice.submittedTo.toString() !== req.user.id.toString()) {
            return next(new AppError('This invoice was submitted to another lender. Access denied.', 403));
        }

        // Fetch on-chain status
        const [bcFile, bcReceivable] = await Promise.all([
            verifyInvoiceOnChain(invoice.invoiceHash),
            verifyReceivableOnChain(invoice.receivableFingerprint),
        ]);

        const registeredOnChain = bcFile?.registered  || false;
        const docFinanced       = bcFile?.financed     || false;
        const recFinanced       = bcReceivable?.financed || false;
        const isDuplicate       = docFinanced || recFinanced || invoice.status === 'FINANCED';
        const canFinance        = !isDuplicate && invoice.status === 'UPLOADED' && registeredOnChain;

        return sendResponse(res, 200, {
            invoice: {
                id:                invoice._id,
                invoiceId:         invoice.invoiceId,
                amount:            invoice.amount,
                currency:          invoice.currency || 'INR',
                status:            invoice.status,
                invoiceHash:       invoice.invoiceHash,
                blockchainTxHash:  invoice.blockchainTxHash  || null,
                financeTxHash:     invoice.financeTxHash     || null,
                uploadedBy:  invoice.uploadedBy
                    ? { name: invoice.uploadedBy.name, email: invoice.uploadedBy.email, organization: invoice.uploadedBy.organization }
                    : null,
                financedBy: invoice.financedBy
                    ? { name: invoice.financedBy.name, email: invoice.financedBy.email, organization: invoice.financedBy.organization }
                    : null,
                financedAt: invoice.financedAt || null,
            },
            verification: {
                valid:             !!invoice,
                duplicate:         isDuplicate,
                financed:          invoice.status === 'FINANCED',
                registeredOnChain: registeredOnChain,
            },
            canFinance,
        }, 'Verification result retrieved successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/lender/finance/:invoiceId
 * Finance an invoice — marks on-chain + DB, blocks duplicates.
 */
const financeInvoice = async (req, res, next) => {
    try {
        const { invoiceId } = req.params;

        // 1. Validate invoice exists and is assigned to this lender
        const invoice = await Invoice.findOne({
            invoiceId: invoiceId,
            submittedTo: req.user.id
        });

        if (!invoice) {
            return next(new AppError('Invoice not found or not submitted to you', 404));
        }

        if (invoice.status === 'FINANCED') {
            return next(new AppError('Invoice is already marked as financed', 400, 'INVOICE_ALREADY_FINANCED'));
        }
        if (invoice.status === 'BLOCKED') {
            return next(new AppError('This invoice is BLOCKED due to duplicate obligation financing', 409, 'RECEIVABLE_ALREADY_FINANCED'));
        }

        // Block duplicate financing (Receivable level)
        const existingFinanced = await Invoice.findOne({
            receivableFingerprint: invoice.receivableFingerprint,
            status: 'FINANCED'
        });
        if (existingFinanced) {
            return next(new AppError('The business obligation for this invoice has already been financed', 409, 'RECEIVABLE_ALREADY_FINANCED'));
        }

        // Check on-chain status
        const [onChainStatus, onChainReceivableStatus] = await Promise.all([
            verifyInvoiceOnChain(invoice.invoiceHash),
            verifyReceivableOnChain(invoice.receivableFingerprint)
        ]);

        if (!onChainStatus || !onChainStatus.registered) {
            return next(new AppError('Invoice must be registered on the blockchain before financing', 422, 'UNREGISTERED_INVOICE'));
        }
        if (onChainStatus.financed || (onChainReceivableStatus && onChainReceivableStatus.financed)) {
            return next(new AppError('This obligation is already marked as financed on the blockchain', 409, 'RECEIVABLE_ALREADY_FINANCED'));
        }

        // Mark on-chain
        let docBlockchainResult = null;
        let receivableBlockchainResult = null;
        try {
            // Anchor both document AND receivable fingerprint
            [docBlockchainResult, receivableBlockchainResult] = await Promise.all([
                markInvoiceFinancedOnChain(invoice.invoiceHash),
                markReceivableFinancedOnChain(invoice.receivableFingerprint)
            ]);
        } catch (bcError) {
            console.error('Blockchain finance marking failed:', bcError.message);
            return next(new AppError(`Blockchain transaction failed: ${bcError.message}`, 500, 'BLOCKCHAIN_TX_FAILED'));
        }

        try {
            invoice.status = 'FINANCED';
            invoice.financedBy = req.user.id;
            invoice.financedAt = new Date();
            invoice.financeTxHash = docBlockchainResult?.txHash || null;
            await invoice.save();

            // Mark ALL OTHER invoices with same receivableFingerprint as BLOCKED
            await Invoice.updateMany(
                {
                    receivableFingerprint: invoice.receivableFingerprint,
                    _id: { $ne: invoice._id }
                },
                {
                    $set: {
                        status: 'BLOCKED',
                        financeTxHash: receivableBlockchainResult?.txHash || null
                    }
                }
            );
        } catch (dbError) {
            console.error(`[CRITICAL INCONSISTENCY] Blockchain success (${docBlockchainResult?.txHash}), but DB update failed:`, dbError.message);
            // In a real bank app, this would trigger an alert or a compensation logic
            return next(new AppError('Blockchain transaction completed, but local database update failed. Please contact support.', 500, 'DATABASE_SYNC_ERROR'));
        }

        await createAuditLog({
            action: 'RECEIVABLE_FINANCED',
            performedBy: req.user.id,
            invoiceId: invoice._id,
            receivableFingerprint: invoice.receivableFingerprint,
            txHash: receivableBlockchainResult?.txHash || null,
            details: {
                invoiceId: invoice.invoiceId,
                receivableFingerprint: invoice.receivableFingerprint,
            },
            ipAddress: req.ip,
            requestId: req.requestId,
        });

        await createAuditLog({
            action: 'invoice_financed',
            performedBy: req.user.id,
            invoiceId: invoice._id,
            receivableFingerprint: invoice.receivableFingerprint,
            txHash: docBlockchainResult?.txHash || null,
            details: {
                invoiceId: invoice.invoiceId,
                amount: invoice.amount,
                invoiceHash: invoice.invoiceHash,
            },
            ipAddress: req.ip,
            requestId: req.requestId,
        });

        return sendResponse(res, 200, {
            invoice: {
                invoiceId: invoice.invoiceId,
                amount: invoice.amount,
                status: invoice.status,
                financedBy: req.user.id,
                financedAt: invoice.financedAt,
                financeTxHash: invoice.financeTxHash,
            },
        }, 'Invoice financed successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = { getAllInvoices, verifyInvoice, financeInvoice };
