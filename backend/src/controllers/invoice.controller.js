const multer = require('multer');
const Invoice = require('../models/Invoice');
const AppError = require('../utils/AppError');
const { hashBuffer } = require('../utils/hash');
const { uploadToIPFS } = require('../services/ipfs.service');
const { registerInvoiceOnChain } = require('../services/blockchain.service');
const { createAuditLog } = require('../services/audit.service');

// Multer config — store in memory for hashing / IPFS upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new AppError('Only PDF files are allowed', 400), false);
        }
    },
});

/**
 * POST /api/invoices
 * Upload an invoice PDF (MSME only).
 */
const createInvoice = async (req, res, next) => {
    try {
        if (!req.file) {
            return next(new AppError('Invoice PDF file is required', 400));
        }

        const { invoiceNumber, amount, currency, description } = req.body;
        const fileBuffer = req.file.buffer;

        // 1. Generate SHA-256 hash
        const fileHash = hashBuffer(fileBuffer);

        // 2. Check for duplicate hash in DB
        const existingByHash = await Invoice.findOne({ fileHash });
        if (existingByHash) {
            return next(new AppError('An invoice with this exact file already exists (duplicate hash)', 409));
        }

        // 3. Upload to IPFS
        const ipfsResult = await uploadToIPFS(fileBuffer, req.file.originalname);

        // 4. Register hash on blockchain
        let blockchainResult = null;
        try {
            blockchainResult = await registerInvoiceOnChain(fileHash, invoiceNumber);
        } catch (bcError) {
            console.warn('Blockchain registration failed, proceeding without:', bcError.message);
        }

        // 5. Save invoice to MongoDB
        const invoice = await Invoice.create({
            invoiceNumber,
            msmeId: req.user.id,
            amount: parseFloat(amount),
            currency: currency || 'INR',
            description,
            fileHash,
            ipfsCid: ipfsResult.cid,
            originalFileName: req.file.originalname,
            status: blockchainResult ? 'registered' : 'uploaded',
            blockchainTxHash: blockchainResult?.txHash || null,
        });

        // 6. Audit log
        await createAuditLog({
            action: 'invoice_uploaded',
            performedBy: req.user.id,
            invoiceId: invoice._id,
            details: { invoiceNumber, fileHash, ipfsCid: ipfsResult.cid },
            ipAddress: req.ip,
        });

        if (blockchainResult) {
            await createAuditLog({
                action: 'invoice_registered_on_chain',
                performedBy: req.user.id,
                invoiceId: invoice._id,
                txHash: blockchainResult.txHash,
                details: { fileHash },
                ipAddress: req.ip,
            });
        }

        res.status(201).json({
            success: true,
            message: 'Invoice uploaded successfully',
            data: {
                invoice: {
                    id: invoice._id,
                    invoiceNumber: invoice.invoiceNumber,
                    amount: invoice.amount,
                    currency: invoice.currency,
                    fileHash: invoice.fileHash,
                    ipfsCid: invoice.ipfsCid,
                    status: invoice.status,
                    blockchainTxHash: invoice.blockchainTxHash,
                    createdAt: invoice.createdAt,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/invoices
 * List invoices. MSME sees own; Lender/Auditor sees all.
 */
const getInvoices = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const filter = {};

        // MSME only sees their own invoices
        if (req.user.role === 'msme') {
            filter.msmeId = req.user.id;
        }

        if (status) {
            filter.status = status;
        }

        const [invoices, total] = await Promise.all([
            Invoice.find(filter)
                .populate('msmeId', 'name email organization')
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
 * GET /api/invoices/:id
 * Get single invoice by ID.
 */
const getInvoiceById = async (req, res, next) => {
    try {
        const filter = { _id: req.params.id };

        // MSME can only view own invoices
        if (req.user.role === 'msme') {
            filter.msmeId = req.user.id;
        }

        const invoice = await Invoice.findOne(filter)
            .populate('msmeId', 'name email organization')
            .populate('financedBy', 'name email organization');

        if (!invoice) {
            return next(new AppError('Invoice not found', 404));
        }

        res.json({
            success: true,
            data: { invoice },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { upload, createInvoice, getInvoices, getInvoiceById };
