const multer = require('multer');
const crypto = require('crypto');
const Invoice = require('../models/Invoice');
const User = require('../models/User'); // Added missing User import
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

        // Verify lender exists if submittedTo is provided
        if (submittedTo) {
            const lender = await User.findOne({ _id: submittedTo, role: 'lender' });
            if (!lender) return next(new AppError('Invalid lender selected for submission', 400));
        }
        const submissionArray = submittedTo ? [submittedTo] : [];

        // Validate and parse dates
        const parsedInvoiceDate = invoiceDate ? new Date(invoiceDate) : new Date();
        const parsedDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        // Generate unique invoiceId
        const invoiceId = `INV-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        // 1. Generate SHA-256 hash
        const invoiceHash = hashBuffer(fileBuffer);

        // 2. Check for duplicate hash in DB
        // Hash check removed to allow multiple uploads of the same document

        // 3. Generate Receivable Fingerprint
        const receivableFingerprint = generateReceivableFingerprint({
            sellerGSTIN,
            buyerGSTIN,
            invoiceAmount: amount,
            poReference,
            invoiceDate: parsedInvoiceDate
        });

<<<<<<< HEAD
        // 4. Upload to IPFS
=======
        // 4. Check if this specific receivable obligation is already financed
        const financedReceivable = await Invoice.findOne({
            receivableFingerprint,
            status: 'FINANCED'
        });
        if (financedReceivable) {
            // Penalize for attempting to upload already financed receivable
            const { updateTrustScore } = require('../services/trust.service');
            await updateTrustScore(req.user.id, 'DUPLICATE_ATTEMPT', { fingerprint: receivableFingerprint });

            return next(new AppError('This business obligation has already been financed', 409, 'RECEIVABLE_ALREADY_FINANCED'));
        }

        // 5. Upload to IPFS
>>>>>>> 04099a4829086fa97dd693d813c7268012847278
        const ipfsResult = await uploadToIPFS(fileBuffer, req.file.originalname);

        // 5. Anchor to Blockchain (Informational Registration)
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
            submittedTo: submissionArray,
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

/**
 * POST /api/v1/invoices/:invoiceId/submit
 * Submit an existing invoice to additional lenders.
 */
const submitInvoice = async (req, res, next) => {
    try {
        const { invoiceId } = req.params;
        const { lenderId } = req.body;

        if (!lenderId) {
            return next(new AppError('Lender ID is required for submission', 400));
        }

        // 1. Verify lender exists
        const lender = await User.findOne({ _id: lenderId, role: 'lender' });
        if (!lender) {
            return next(new AppError('Target lender not found or invalid role', 404));
        }

        // 2. Find invoice and verify ownership
        const invoice = await Invoice.findOne({ invoiceId, uploadedBy: req.user.id });
        if (!invoice) {
            return next(new AppError('Invoice not found or access denied', 404));
        }

        // 3. CORE RULE: Block submission if receivable is already financed
        if (invoice.status === 'FINANCED') {
            return next(new AppError('This invoice has already been financed and cannot be submitted again', 400, 'RECEIVABLE_ALREADY_FINANCED'));
        }

        // Double check fingerprint across system
        const existingFinanced = await Invoice.findOne({
            receivableFingerprint: invoice.receivableFingerprint,
            status: 'FINANCED'
        });
        if (existingFinanced) {
            return next(new AppError('This business obligation has already been financed elsewhere', 409, 'RECEIVABLE_ALREADY_FINANCED'));
        }

        // 4. Add to submittedTo (if not already there)
        const updatedInvoice = await Invoice.findByIdAndUpdate(
            invoice._id,
            { $addToSet: { submittedTo: lenderId } },
            { new: true }
        ).populate('submittedTo', 'name organization');

        await createAuditLog({
            action: 'invoice_submitted',
            performedBy: req.user.id,
            invoiceId: invoice._id,
            receivableFingerprint: invoice.receivableFingerprint,
            details: {
                invoiceId: invoice.invoiceId,
                lenderId,
                lenderOrganization: lender.organization
            },
            ipAddress: req.ip,
            requestId: req.requestId,
        });

        return sendResponse(res, 200, {
            invoiceId: updatedInvoice.invoiceId,
            submittedTo: updatedInvoice.submittedTo
        }, `Invoice successfully submitted to ${lender.organization}`);
    } catch (error) {
        next(error);
    }
};

module.exports = { upload, createInvoice, getMyInvoices, submitInvoice };
