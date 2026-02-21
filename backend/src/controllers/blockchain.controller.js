const Invoice = require('../models/Invoice');
const AppError = require('../utils/AppError');
const { registerInvoiceOnChain } = require('../services/blockchain.service');
const { createAuditLog } = require('../services/audit.service');

/**
 * POST /blockchain/register-invoice
 * Explicitly register an existing invoice hash onto the Sepolia testnet.
 */
const registerInvoice = async (req, res, next) => {
    try {
        const { invoiceId, invoiceHash } = req.body;

        if (!invoiceId && !invoiceHash) {
            return next(new AppError('Please provide either invoiceId or invoiceHash', 400));
        }

        // Find the invoice in DB
        const filter = invoiceId ? { invoiceId } : { invoiceHash };
        const invoice = await Invoice.findOne(filter);

        if (!invoice) {
            return next(new AppError('Invoice not found in database', 404));
        }

        // Only the MSME who uploaded it or a Lender can register it (depending on business logic)
        // RBAC middleware handles general role checking, but we can verify MSME ownership:
        if (req.user.role === 'msme' && invoice.uploadedBy.toString() !== req.user.id) {
            return next(new AppError('You can only register your own invoices', 403));
        }

        // Check if already registered on-chain
        if (invoice.blockchainTxHash) {
            return next(new AppError('Invoice is already registered on the blockchain', 409));
        }

        // Register on blockchain
        let blockchainResult = null;
        try {
            blockchainResult = await registerInvoiceOnChain(invoice.invoiceHash, invoice.invoiceId);
        } catch (bcError) {
            // Ethers.js often throws detailed contract errors
            console.error('Blockchain registration failed:', bcError.message);

            if (bcError.message.includes('Invoice hash already registered')) {
                return next(new AppError('Invoice hash already registered on-chain', 409));
            }
            return next(new AppError(`Blockchain transaction failed: ${bcError.message}`, 500));
        }

        // Update DB
        invoice.blockchainTxHash = blockchainResult.txHash;

        // We can keep status as UPLOADED or change to REGISTERED (I'll keep UPLOADED but TX Hash represents registration)
        await invoice.save();

        // Audit Log
        await createAuditLog({
            action: 'invoice_registered_on_chain',
            performedBy: req.user.id,
            invoiceId: invoice._id,
            txHash: blockchainResult.txHash,
            details: { invoiceId: invoice.invoiceId, invoiceHash: invoice.invoiceHash },
            ipAddress: req.ip,
        });

        res.json({
            success: true,
            message: 'Invoice successfully registered on blockchain',
            data: {
                invoiceId: invoice.invoiceId,
                invoiceHash: invoice.invoiceHash,
                blockchainTxHash: invoice.blockchainTxHash,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { registerInvoice };
