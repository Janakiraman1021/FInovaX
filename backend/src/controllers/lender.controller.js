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
        const filter = { submittedTo: { $in: [req.user.id] } };
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
            .populate('financedBy', 'name email organization');

        if (!invoice) {
            return next(new AppError('Invoice not found or access denied', 404));
        }

        // RBAC: lender can only verify invoices submitted to them
        if (invoice.submittedTo && !invoice.submittedTo.includes(req.user.id)) {
            return next(new AppError('This invoice was not submitted to you. Access denied.', 403));
        }

        // Fetch on-chain status
        const [bcFile, bcReceivable] = await Promise.all([
            verifyInvoiceOnChain(invoice.invoiceHash),
            verifyReceivableOnChain(invoice.receivableFingerprint),
        ]);

        const registeredOnChain = bcFile?.registered || false;
        const docFinanced = bcFile?.financed || false;
        const recFinanced = bcReceivable?.financed || false;
        const isDuplicate = docFinanced || recFinanced || invoice.status === 'FINANCED';
        const canFinance = !isDuplicate && invoice.status === 'UPLOADED' && registeredOnChain;

        return sendResponse(res, 200, {
            invoice: {
                id: invoice._id,
                invoiceId: invoice.invoiceId,
                amount: invoice.amount,
                currency: invoice.currency || 'INR',
                status: invoice.status,
                invoiceHash: invoice.invoiceHash,
                blockchainTxHash: invoice.blockchainTxHash || null,
                financeTxHash: invoice.financeTxHash || null,
                uploadedBy: invoice.uploadedBy
                    ? { name: invoice.uploadedBy.name, email: invoice.uploadedBy.email, organization: invoice.uploadedBy.organization }
                    : null,
                financedBy: invoice.financedBy
                    ? { name: invoice.financedBy.name, email: invoice.financedBy.email, organization: invoice.financedBy.organization }
                    : null,
                financedAt: invoice.financedAt || null,
            },
            verification: {
                valid: !!invoice,
                duplicate: isDuplicate,
                financed: invoice.status === 'FINANCED',
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
            submittedTo: { $in: [req.user.id] }
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
            // Penalize for attempting to finance an already financed receivable
            const { updateTrustScore } = require('../services/trust.service');
            await updateTrustScore(req.user.id, 'INVOICE_BLOCKED', {
                action: 'blocked_finance_attempt',
                fingerprint: invoice.receivableFingerprint
            });
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
            const financedAt = new Date();
            invoice.status = 'FINANCED';
            invoice.financedBy = req.user.id;
            invoice.financedAt = financedAt;
            invoice.financeTxHash = docBlockchainResult?.txHash || null;
            await invoice.save();

<<<<<<< HEAD
            // Step A: Propagate FINANCED to all uploads of the same file (same ipfsCID)
            if (invoice.ipfsCID) {
                await Invoice.updateMany(
                    {
                        ipfsCID: invoice.ipfsCID,
                        _id: { $ne: invoice._id }
                    },
                    {
                        $set: {
                            status: 'FINANCED',
                            financedBy: req.user.id,
                            financedAt,
                            financeTxHash: docBlockchainResult?.txHash || null
                        }
                    }
                );
            }

            // Step B: Block all other invoices sharing the same business obligation (receivableFingerprint)
            //         that are NOT already FINANCED (covers different-file but same-obligation fraud attempts)
=======
            // 1. Update Trust Score
            const { updateTrustScore } = require('../services/trust.service');
            await updateTrustScore(invoice.uploadedBy, 'FINANCE_SUCCESS', { invoiceId: invoice.invoiceId });

            // Mark ALL OTHER invoices with same receivableFingerprint as BLOCKED
>>>>>>> 04099a4829086fa97dd693d813c7268012847278
            await Invoice.updateMany(
                {
                    receivableFingerprint: invoice.receivableFingerprint,
                    status: { $ne: 'FINANCED' }
                },
                {
                    $set: {
                        status: 'BLOCKED',
                        financeTxHash: receivableBlockchainResult?.txHash || null
                    }
                }
            );

            // Step C: Propagate BLOCKED to ipfsCID siblings of any newly-blocked invoices
            //         (e.g. the same file was uploaded under a different fingerprint and got blocked)
            const blockedSiblings = await Invoice.find(
                {
                    receivableFingerprint: invoice.receivableFingerprint,
                    status: 'BLOCKED',
                    ipfsCID: { $nin: [null, invoice.ipfsCID] }
                },
                { ipfsCID: 1 }
            );
            const blockedCIDs = [...new Set(blockedSiblings.map(i => i.ipfsCID).filter(Boolean))];
            if (blockedCIDs.length > 0) {
                await Invoice.updateMany(
                    {
                        ipfsCID: { $in: blockedCIDs },
                        status: { $ne: 'FINANCED' }
                    },
                    {
                        $set: {
                            status: 'BLOCKED',
                            financeTxHash: receivableBlockchainResult?.txHash || null
                        }
                    }
                );
            }
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

/**
 * PATCH /api/lender/invoices/:invoiceId/status
 * Update invoice status — propagates to all invoices with same ipfsCID
 */
const updateInvoiceStatus = async (req, res, next) => {
    try {
        const { invoiceId } = req.params;
        const { status } = req.body;

        const allowedStatuses = ['UPLOADED', 'FINANCED', 'BLOCKED'];
        if (!status || !allowedStatuses.includes(status.toUpperCase())) {
            return next(new AppError(`Invalid status. Allowed: ${allowedStatuses.join(', ')}`, 400));
        }
        const newStatus = status.toUpperCase();

        // 1. Find invoice and verify lender has access
        const invoice = await Invoice.findOne({
            invoiceId,
            submittedTo: { $in: [req.user.id] }
        });

        if (!invoice) {
            return next(new AppError('Invoice not found or not submitted to you', 404));
        }

        const oldStatus = invoice.status;
        if (oldStatus === newStatus) {
            return sendResponse(res, 200, { invoiceId, status: newStatus, updated: 0 }, 'Status unchanged');
        }

        // 2. Update the target invoice
        invoice.status = newStatus;
        if (newStatus === 'FINANCED') {
            invoice.financedBy = req.user.id;
            invoice.financedAt = new Date();
        }
        await invoice.save();

        // 3. Propagate status to all invoices with the same ipfsCID
        let siblingCount = 0;
        if (invoice.ipfsCID) {
            const updateFields = { status: newStatus };
            if (newStatus === 'FINANCED') {
                updateFields.financedBy = req.user.id;
                updateFields.financedAt = new Date();
            }
            const result = await Invoice.updateMany(
                { ipfsCID: invoice.ipfsCID, _id: { $ne: invoice._id } },
                { $set: updateFields }
            );
            siblingCount = result.modifiedCount || 0;
        }

        // 4. Audit log
        await createAuditLog({
            action: 'invoice_status_updated',
            performedBy: req.user.id,
            invoiceId: invoice._id,
            receivableFingerprint: invoice.receivableFingerprint,
            details: {
                invoiceId: invoice.invoiceId,
                oldStatus,
                newStatus,
                siblingCount,
                ipfsCID: invoice.ipfsCID,
            },
            ipAddress: req.ip,
            requestId: req.requestId,
        });

        return sendResponse(res, 200, {
            invoiceId: invoice.invoiceId,
            status: newStatus,
            updated: 1 + siblingCount,
        }, `Status updated to ${newStatus}. ${siblingCount} sibling invoice(s) also updated.`);
    } catch (error) {
        next(error);
    }
};

module.exports = { getAllInvoices, verifyInvoice, financeInvoice, updateInvoiceStatus };
