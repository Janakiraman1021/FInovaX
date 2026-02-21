const Invoice = require('../models/Invoice');
const AppError = require('../utils/AppError');
const { verifyInvoiceOnChain, markInvoiceFinancedOnChain, registerReceivableOnChain, verifyReceivableOnChain } = require('../services/blockchain.service');
const { createAuditLog } = require('../services/audit.service');
const { sendResponse } = require('../utils/response');

/**
 * GET /api/lender/verify/:invoiceId
 * Verify invoice status — check both DB and blockchain.
 */
const verifyInvoice = async (req, res, next) => {
    try {
        const { invoiceId } = req.params;

        // Find by invoiceId or invoiceHash (since it could be either)
        const invoice = await Invoice.findOne({
            $or: [{ invoiceId }, { invoiceHash: invoiceId }]
        });

        if (!invoice) {
            return res.status(404).json({
                success: false,
                data: {
                    verification: {
                        status: 'NOT_FOUND',
                        valid: false
                    }
                }
            });
        }

        // Check if receivable obligation is already financed by ANY document
        const financedAny = await Invoice.findOne({
            receivableFingerprint: invoice.receivableFingerprint,
            status: 'FINANCED'
        });

        // On-chain verification
        let onChainStatus = null;
        let onChainReceivableStatus = null;
        try {
            [onChainStatus, onChainReceivableStatus] = await Promise.all([
                verifyInvoiceOnChain(invoice.invoiceHash),
                verifyReceivableOnChain(invoice.receivableFingerprint)
            ]);
        } catch (bcError) {
            console.warn('On-chain verification unavailable:', bcError.message);
        }

        const isFinanced =
            invoice.status === 'FINANCED' ||
            (financedAny && financedAny.status === 'FINANCED') ||
            (onChainStatus && onChainStatus.financed) ||
            (onChainReceivableStatus && onChainReceivableStatus.financed) ||
            false;

        let verificationLabel = 'VALID';
        if (isFinanced) {
            verificationLabel = 'RECEIVABLE_ALREADY_FINANCED';
        }

        const canFinance =
            !isFinanced &&
            (onChainStatus && onChainStatus.registered) &&
            invoice.status !== 'BLOCKED';

        await createAuditLog({
            action: 'invoice_verified',
            performedBy: req.user.id,
            invoiceId: invoice._id,
            receivableFingerprint: invoice.receivableFingerprint,
            details: {
                status: verificationLabel,
                valid: !isFinanced,
                duplicate: isFinanced,
                onChainStatus
            },
            ipAddress: req.ip,
            requestId: req.requestId,
        });

        return sendResponse(res, 200, {
            invoice: {
                invoiceId: invoice.invoiceId,
                amount: invoice.amount,
                currency: invoice.currency,
                status: invoice.status,
                invoiceHash: invoice.invoiceHash,
                financedAt: invoice.financedAt,
            },
            verification: {
                status: verificationLabel,
                valid: !isFinanced,
                duplicate: isFinanced,
                financed: isFinanced,
                registeredOnChain: onChainStatus ? onChainStatus.registered : false
            },
            canFinance,
        });
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
        const invoice = await Invoice.findOne({
            $or: [{ invoiceId }, { invoiceHash: invoiceId }]
        });

        if (!invoice) {
            return next(new AppError('Invoice not found', 404));
        }

        // Block duplicate financing (Document level)
        if (invoice.status === 'FINANCED') {
            return next(new AppError('This invoice document has already been financed', 409, 'INVOICE_ALREADY_FINANCED'));
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
                registerReceivableOnChain(invoice.receivableFingerprint)
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

module.exports = { verifyInvoice, financeInvoice };
