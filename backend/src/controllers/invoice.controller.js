const multer = require('multer');
const crypto = require('crypto');
const Invoice = require('../models/Invoice');
const AppError = require('../utils/AppError');
const { hashBuffer, generateReceivableFingerprint } = require('../utils/hash');
const { uploadToIPFS } = require('../services/ipfs.service');
const { registerInvoiceOnChain, registerReceivableOnChain } = require('../services/blockchain.service');
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
            dueDate,
            submittedTo
        } = req.body;
        const fileBuffer = req.file.buffer;

<<<<<<< HEAD
        // Verify lender exists if submittedTo is provided
        if (submittedTo) {
            const lender = await User.findOne({ _id: submittedTo, role: 'lender' });
            if (!lender) return next(new AppError('Invalid lender selected for submission', 400));
=======
        // Validate and parse dates
        let parsedInvoiceDate = invoiceDate ? new Date(invoiceDate) : new Date();
        let parsedDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        // Check for invalid dates
        if (isNaN(parsedInvoiceDate.getTime())) {
            parsedInvoiceDate = new Date();
        }
        if (isNaN(parsedDueDate.getTime())) {
            parsedDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
>>>>>>> 70844f984f2356280189e0f926f75331760efed3
        }

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

        // 6. Anchor to Blockchain (Informational Registration)
        let blockchainResult = null;
        try {
            // Register both the document hash and the business obligation fingerprint
            const [regInvoice, regReceivable] = await Promise.all([
                registerInvoiceOnChain(invoiceHash, invoiceId),
                registerReceivableOnChain(receivableFingerprint)
            ]);
            blockchainResult = {
                invoiceTx: regInvoice?.txHash,
                receivableTx: regReceivable?.txHash
            };
        } catch (bcError) {
            console.warn('Blockchain registration deferred or failed during upload:', bcError.message);
        }

        // 7. Save invoice metadata to MongoDB
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
            invoiceDate: parsedInvoiceDate,
            dueDate: parsedDueDate,
            ipfsCID: ipfsResult.cid,
            originalFileName: req.file.originalname,
            status: 'UPLOADED',
            submittedTo: submittedTo || null,
            blockchainTxHash: blockchainResult?.invoiceTx || null,
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
                .populate('uploadedBy', 'name organization')
                .populate('submittedTo', 'name organization') // Only basic lender info
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Invoice.countDocuments(filter),
        ]);

        // Mask internal lender IDs and sensitive financier details for MSME visibility
        const maskedInvoices = invoices.map(inv => {
            const invObj = inv.toObject();
            if (invObj.financedBy) {
                // If financed, we show it was financed, but keep lender details minimal as per banking workflow requirements
                invObj.financedBy = {
                    organization: inv.financedBy?.organization || 'Confidential Lender'
                };
            }
            return invObj;
        });

        return sendResponse(res, 200, {
            invoices: maskedInvoices,
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
