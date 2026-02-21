const Invoice = require('../models/Invoice');
const AppError = require('../utils/AppError');
const { verifyInvoiceOnChain, markInvoiceFinancedOnChain } = require('../services/blockchain.service');
const { createAuditLog } = require('../services/audit.service');

/**
 * GET /api/lender/verify/:invoiceId
 * Verify invoice status — check both DB and blockchain.
 */
const verifyInvoice = async (req, res, next) => {
    try {
        const invoice = await Invoice.findById(req.params.invoiceId)
            .populate('msmeId', 'name email organization')
            .populate('financedBy', 'name email organization');

        if (!invoice) {
            return next(new AppError('Invoice not found', 404));
        }

        // On-chain verification
        let onChainStatus = null;
        try {
            onChainStatus = await verifyInvoiceOnChain(invoice.fileHash);
        } catch (bcError) {
            console.warn('On-chain verification unavailable:', bcError.message);
        }

        const canFinance =
            invoice.status !== 'financed' && (!onChainStatus || !onChainStatus.financed);

        await createAuditLog({
            action: 'invoice_verified',
            performedBy: req.user.id,
            invoiceId: invoice._id,
            details: { canFinance, onChainStatus },
            ipAddress: req.ip,
        });

        res.json({
            success: true,
            data: {
                invoice: {
                    id: invoice._id,
                    invoiceNumber: invoice.invoiceNumber,
                    amount: invoice.amount,
                    currency: invoice.currency,
                    status: invoice.status,
                    fileHash: invoice.fileHash,
                    msme: invoice.msmeId,
                    financedBy: invoice.financedBy,
                    financedAt: invoice.financedAt,
                },
                blockchain: onChainStatus,
                canFinance,
            },
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
        const invoice = await Invoice.findById(req.params.invoiceId);

        if (!invoice) {
            return next(new AppError('Invoice not found', 404));
        }

        // Block duplicate financing
        if (invoice.status === 'financed') {
            await createAuditLog({
                action: 'finance_blocked_duplicate',
                performedBy: req.user.id,
                invoiceId: invoice._id,
                details: { reason: 'Already financed', financedBy: invoice.financedBy },
                ipAddress: req.ip,
            });

            return next(new AppError('This invoice has already been financed', 409));
        }

        // Mark on-chain
        let blockchainResult = null;
        try {
            blockchainResult = await markInvoiceFinancedOnChain(invoice.fileHash);
        } catch (bcError) {
            console.warn('Blockchain finance marking failed, proceeding off-chain:', bcError.message);
        }

        // Update DB
        invoice.status = 'financed';
        invoice.financedBy = req.user.id;
        invoice.financedAt = new Date();
        invoice.financeTxHash = blockchainResult?.txHash || null;
        await invoice.save();

        await createAuditLog({
            action: 'invoice_financed',
            performedBy: req.user.id,
            invoiceId: invoice._id,
            txHash: blockchainResult?.txHash || null,
            details: {
                invoiceNumber: invoice.invoiceNumber,
                amount: invoice.amount,
                fileHash: invoice.fileHash,
            },
            ipAddress: req.ip,
        });

        res.json({
            success: true,
            message: 'Invoice financed successfully',
            data: {
                invoice: {
                    id: invoice._id,
                    invoiceNumber: invoice.invoiceNumber,
                    amount: invoice.amount,
                    status: invoice.status,
                    financedBy: req.user.id,
                    financedAt: invoice.financedAt,
                    financeTxHash: invoice.financeTxHash,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { verifyInvoice, financeInvoice };
