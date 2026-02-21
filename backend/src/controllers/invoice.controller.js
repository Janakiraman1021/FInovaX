const multer = require('multer');
const crypto = require('crypto');
const Invoice = require('../models/Invoice');
const AppError = require('../utils/AppError');
const { hashBuffer, generateReceivableFingerprint } = require('../utils/hash');
const { uploadToIPFS } = require('../services/ipfs.service');
const { createAuditLog } = require('../services/audit.service');
const { sendResponse } = require('../utils/response');

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

        const {
            amount,
            currency,
            description,
            sellerGSTIN,
            buyerGSTIN,
            poReference,
            invoiceDate,
            dueDate
        } = req.body;
        const fileBuffer = req.file.buffer;

        // Generate unique invoiceId
        const invoiceId = `INV-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        // 1. Generate SHA-256 hash
        const invoiceHash = hashBuffer(fileBuffer);

        // 2. Check for duplicate hash in DB
        const existingByHash = await Invoice.findOne({ invoiceHash });
        if (existingByHash) {
            return next(new AppError('An invoice with this exact file already exists', 409, 'DUPLICATE_FILE_HASH'));
        }

        // 3. Generate Receivable Fingerprint
        const receivableFingerprint = generateReceivableFingerprint({
            sellerGSTIN,
            buyerGSTIN,
            invoiceAmount: amount,
            poReference,
            invoiceDate
        });

        // 4. Check if this specific receivable obligation is already financed
        const financedReceivable = await Invoice.findOne({
            receivableFingerprint,
            status: 'FINANCED'
        });
        if (financedReceivable) {
            return next(new AppError('This business obligation has already been financed', 409, 'RECEIVABLE_ALREADY_FINANCED'));
        }

        // 5. Upload to IPFS
        const ipfsResult = await uploadToIPFS(fileBuffer, req.file.originalname);

        // 6. Save invoice metadata to MongoDB (DO NOT WRITE TO BLOCKCHAIN YET)
        const invoice = await Invoice.create({
            invoiceId,
            uploadedBy: req.user.id,
            amount: parseFloat(amount || 0),
            currency: currency || 'INR',
            description,
            invoiceHash,
            receivableFingerprint,
            sellerGSTIN,
            buyerGSTIN,
            poReference,
            invoiceDate,
            dueDate,
            ipfsCID: ipfsResult.cid,
            originalFileName: req.file.originalname,
            status: 'UPLOADED',
        });

        // 5. Audit log
        await createAuditLog({
            action: 'invoice_uploaded',
            performedBy: req.user.id,
            invoiceId: invoice._id,
            receivableFingerprint: invoice.receivableFingerprint,
            details: {
                invoiceId,
                invoiceHash,
                receivableFingerprint,
                ipfsCID: ipfsResult.cid
            },
            ipAddress: req.ip,
            requestId: req.requestId,
        });

        // 8. Log receivable registration (internal audit)
        await createAuditLog({
            action: 'RECEIVABLE_REGISTERED',
            performedBy: req.user.id,
            invoiceId: invoice._id,
            receivableFingerprint: invoice.receivableFingerprint,
            details: { receivableFingerprint },
            ipAddress: req.ip,
            requestId: req.requestId,
        });

        return sendResponse(res, 201, {
            invoice: {
                invoiceId: invoice.invoiceId,
                invoiceHash: invoice.invoiceHash,
                receivableFingerprint: invoice.receivableFingerprint,
                ipfsCID: invoice.ipfsCID,
                uploadedBy: invoice.uploadedBy,
                status: invoice.status,
                amount: invoice.amount,
                currency: invoice.currency,
                createdAt: invoice.createdAt,
            },
        }, 'Invoice uploaded securely. Pending blockchain verification by lender.');
    } catch (error) {
        if (error.name === 'ValidationError') {
            return next(new AppError(Object.values(error.errors).map(val => val.message).join(', '), 400));
        }
        if (error.code === 11000) {
            return next(new AppError('This business obligation metadata has already been uploaded', 409, 'DUPLICATE_RECEIVABLE'));
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

module.exports = { upload, createInvoice, getMyInvoices };
