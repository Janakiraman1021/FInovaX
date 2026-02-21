const Invoice = require('../models/Invoice');
const AppError = require('../utils/AppError');
const { verifyInvoiceOnChain, markInvoiceFinancedOnChain } = require('../services/blockchain.service');
const { createAuditLog } = require('../services/audit.service');

/**
 * GET /lender/invoices
 * List all invoices — lender can filter by status.
 */
const getAllInvoices = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, status } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const filter = {};
        if (status) filter.status = status.toUpperCase();

        const [invoices, total] = await Promise.all([
            Invoice.find(filter)
                .populate('uploadedBy', 'name email organization')
                .populate('financedBy', 'name email organization')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Invoice.countDocuments(filter),
        ]);

        res.json({
            success: true,
            data: {
                invoices,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit)),
                },
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
const verifyInvoice = async (req, res) => {
    try {
        const { hash } = req.params;

        // Search by either invoiceHash (SHA-256) or ipfsHash (IPFS CID)
        const invoice = await Invoice.findOne({
            $or: [
                { invoiceHash: hash },
                { ipfsHash: hash }
            ]
        });

        if (!invoice) {
            throw new Error("Invoice not found in database");
        }

        // On-chain verification
        let onChainStatus = null;
        try {
            onChainStatus = await verifyInvoiceOnChain(invoice.invoiceHash);
        } catch (bcError) {
            console.warn('On-chain verification unavailable:', bcError.message);
        }

        const canFinance =
            invoice.status !== 'FINANCED' && (!onChainStatus || !onChainStatus.financed) && (onChainStatus && onChainStatus.registered);

        const isDuplicate = invoice.status === 'FINANCED' || (onChainStatus && onChainStatus.financed) || false;

        await createAuditLog({
            action: 'invoice_verified',
            performedBy: req.user.id,
            invoiceId: invoice._id,
            details: { valid: true, duplicate: isDuplicate, financed: isDuplicate, onChainStatus },
            ipAddress: req.ip,
        });

        res.json({
            success: true,
            data: {
                invoice: {
                    id: invoice._id,
                    invoiceId: invoice.invoiceId,
                    amount: invoice.amount,
                    currency: invoice.currency,
                    status: invoice.status,
                    invoiceHash: invoice.invoiceHash,
                    uploadedBy: invoice.uploadedBy,
                    financedBy: invoice.financedBy,
                    financedAt: invoice.financedAt,
                },
                verification: {
                    valid: true,
                    duplicate: isDuplicate,
                    financed: isDuplicate,
                    registeredOnChain: onChainStatus ? onChainStatus.registered : false
                },
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
        const { invoiceId } = req.params;
        const invoice = await Invoice.findOne({
            $or: [{ invoiceId }, { invoiceHash: invoiceId }]
        });

        if (!invoice) {
            return next(new AppError('Invoice not found', 404));
        }

        // Block duplicate financing
        if (invoice.status === 'FINANCED') {
            await createAuditLog({
                action: 'finance_blocked_duplicate',
                performedBy: req.user.id,
                invoiceId: invoice._id,
                details: { reason: 'Already financed', financedBy: invoice.financedBy },
                ipAddress: req.ip,
            });

            return next(new AppError('This invoice has already been financed', 409));
        }

        // Check on-chain status
        const onChainStatus = await verifyInvoiceOnChain(invoice.invoiceHash);
        if (!onChainStatus || !onChainStatus.registered) {
            return next(new AppError('Invoice must be registered on the blockchain before financing', 422));
        }
        if (onChainStatus.financed) {
            return next(new AppError('This invoice has already been marked as financed on the blockchain', 409));
        }

        // Mark on-chain
        let blockchainResult = null;
        try {
            blockchainResult = await markInvoiceFinancedOnChain(invoice.invoiceHash);
        } catch (bcError) {
            console.warn('Blockchain finance marking failed:', bcError.message);
            return next(new AppError(`Blockchain finance marking failed: ${bcError.message}`, 500));
        }

        // Update DB
        invoice.status = 'FINANCED';
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
                invoiceId: invoice.invoiceId,
                amount: invoice.amount,
                invoiceHash: invoice.invoiceHash,
            },
            ipAddress: req.ip,
        });

        res.json({
            success: true,
            message: 'Invoice financed successfully',
            data: {
                invoice: {
                    id: invoice._id,
                    invoiceId: invoice.invoiceId,
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

module.exports = { getAllInvoices, verifyInvoice, financeInvoice };
