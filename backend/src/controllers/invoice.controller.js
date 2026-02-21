const multer = require('multer');
const crypto = require('crypto');
const Invoice = require('../models/Invoice');
const AppError = require('../utils/AppError');
const { hashBuffer } = require('../utils/hash');
const { uploadToIPFS } = require('../services/ipfs.service');
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
 * POST /api/invoices/upload
 * Upload an invoice PDF (MSME only).
 */
const createInvoice = async (req, res, next) => {
    try {
        if (!req.file) {
            return next(new AppError('Invoice PDF file is required', 400));
        }

        const { amount, currency, description } = req.body;
        const fileBuffer = req.file.buffer;

        // Generate unique invoiceId
        const invoiceId = `INV-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        // 1. Generate SHA-256 hash
        const invoiceHash = hashBuffer(fileBuffer);

        // 2. Check for duplicate hash in DB
        const existingByHash = await Invoice.findOne({ invoiceHash });
        if (existingByHash) {
            return next(new AppError('An invoice with this exact file already exists (duplicate hash)', 409));
        }

        // 3. Upload to IPFS
        const ipfsResult = await uploadToIPFS(fileBuffer, req.file.originalname);

        // 4. Save invoice metadata to MongoDB (DO NOT WRITE TO BLOCKCHAIN YET)
        const invoice = await Invoice.create({
            invoiceId,
            uploadedBy: req.user.id,
            amount: parseFloat(amount || 0),
            currency: currency || 'INR',
            description,
            invoiceHash,
            ipfsCID: ipfsResult.cid,
            originalFileName: req.file.originalname,
            status: 'UPLOADED',
        });

        // 5. Audit log
        await createAuditLog({
            action: 'invoice_uploaded',
            performedBy: req.user.id,
            invoiceId: invoice._id,
            details: { invoiceId, invoiceHash, ipfsCID: ipfsResult.cid },
            ipAddress: req.ip,
        });

        res.status(201).json({
            success: true,
            message: 'Invoice uploaded securely. Pending blockchain verification by lender.',
            data: {
                invoice: {
                    invoiceId: invoice.invoiceId,
                    invoiceHash: invoice.invoiceHash,
                    ipfsCID: invoice.ipfsCID,
                    uploadedBy: invoice.uploadedBy,
                    status: invoice.status,
                    amount: invoice.amount,
                    currency: invoice.currency,
                    createdAt: invoice.createdAt,
                },
            },
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return next(new AppError(Object.values(error.errors).map(val => val.message).join(', '), 400));
        }
        next(error);
    }
};

/**
 * GET /api/invoices/my
 * List MSME's invoices.
 */
const getMyInvoices = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const filter = { uploadedBy: req.user.id };

        if (status) {
            filter.status = status.toUpperCase();
        }

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

module.exports = { upload, createInvoice, getMyInvoices };
