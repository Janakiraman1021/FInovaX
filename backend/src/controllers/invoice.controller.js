const multer = require('multer');
const crypto = require('crypto');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const LenderSubmission = require('../models/LenderSubmission');
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

        // 1. Generate SHA-256 hash (fileHash - for document integrity)
        const invoiceHash = hashBuffer(fileBuffer);

        // 2. Generate Receivable Fingerprint (business obligation identity)
        const receivableFingerprint = generateReceivableFingerprint({
            sellerGSTIN,
            buyerGSTIN,
            invoiceAmount: amount,
            poReference,
            invoiceDate: parsedInvoiceDate
        });

        // 🔍 OneFlow Data Integrity & Discovery Rules
        // ---------------------------------------------------------
        // File hash enforces data integrity. (Rule 1)
        // Receivable fingerprint enforces financing uniqueness. (Rule 2)
        // ---------------------------------------------------------

        let invoice = null;
        let isExistingInvoice = false;

        // 🛡️ RULE 1: SAME FILE + DIFFERENT RECEIVABLE FIELDS (BLOCK)
        // Enforcement must be global to ensure document truth.
        const globalExistingFile = await Invoice.findOne({ invoiceHash });
        if (globalExistingFile) {
            if (globalExistingFile.receivableFingerprint !== receivableFingerprint) {
                return next(new AppError(
                    "Invoice file does not match declared receivable details",
                    400,
                    "INCONSISTENT_INVOICE_DATA"
                ));
            }
        }

        // Logic for handling upload/submission based on context
        if (!submittedTo) {
            // Initial Upload (Action 1): Check if THIS USER uploaded this file before
            if (globalExistingFile && globalExistingFile.uploadedBy.toString() === req.user.id) {
                return next(new AppError(
                    'You have already uploaded this file. To submit it to a lender, use the "Submit to Lender" option from your invoice list.',
                    409,
                    'DUPLICATE_FILE_HASH'
                ));
            }
        } else {
            // Upload + Submit (Action 4): Allow parallel discovery (Rule 2)
            // Check if this user already has an invoice with this receivableFingerprint
            const existingInvoice = await Invoice.findOne({
                receivableFingerprint,
                uploadedBy: req.user.id
            });

            if (existingInvoice) {
                // Found existing invoice - check if submitting to same lender
                const existingSubmission = await LenderSubmission.findOne({
                    receivableFingerprint,
                    lenderId: submittedTo
                });

                if (existingSubmission) {
                    const { updateTrustScore } = require('../services/trust.service');
                    await updateTrustScore(req.user.id, 'DUPLICATE_ATTEMPT', {
                        reason: 'same_lender_duplicate_upload',
                        lenderId: submittedTo
                    });
                    return next(new AppError(
                        'You have already submitted this receivable to this lender. Please choose a different lender or upload a different invoice.',
                        409,
                        'DUPLICATE_LENDER_SUBMISSION'
                    ));
                }

                // Different lender - reuse existing invoice if file is the same, 
                // OR create new one if file is different (Rule 2)
                if (existingInvoice.invoiceHash === invoiceHash) {
                    invoice = existingInvoice;
                    isExistingInvoice = true;

                    // Add lender to submittedTo array
                    if (!invoice.submittedTo.includes(submittedTo)) {
                        invoice.submittedTo.push(submittedTo);
                        await invoice.save();
                    }
                } else {
                    // DIFFERENT FILE + SAME RECEIVABLE FIELDS -> ALLOW (Rule 2)
                    // We will create a new invoice record for this specific document
                    isExistingInvoice = false;
                }
            } else {
                // No existing invoice for this user - will create new one
                // Still check if they already submitted this obligation via a different upload (race condition)
                const duplicateSubmission = await LenderSubmission.findOne({
                    receivableFingerprint,
                    lenderId: submittedTo
                });

                if (duplicateSubmission) {
                    return next(new AppError(
                        'You have already submitted this receivable to this lender. Please choose a different lender or upload a different invoice.',
                        409,
                        'DUPLICATE_LENDER_SUBMISSION'
                    ));
                }
            }
        }

        // 3. Upload to IPFS (only if new invoice)
        let ipfsResult = null;
        if (!isExistingInvoice) {
            ipfsResult = await uploadToIPFS(fileBuffer, req.file.originalname);
        }

        // 5. Anchor to Blockchain (only if new invoice)
        let blockchainResult = null;
        if (!isExistingInvoice) {
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
        }

        // 6. Save invoice metadata to MongoDB (only if new invoice)
        if (!isExistingInvoice) {
            invoice = await Invoice.create({
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
        }

        // 7. Create LenderSubmission record if lender was selected
        if (submittedTo) {
            try {
                await LenderSubmission.create({
                    receivableFingerprint,
                    invoiceId: invoice.invoiceId,
                    msmeId: req.user.id,
                    lenderId: submittedTo,
                    status: 'SUBMITTED',
                    submittedAt: new Date(),
                });
            } catch (submissionError) {
                // Handle duplicate key error gracefully (race condition)
                if (submissionError.code === 11000) {
                    console.warn('Duplicate lender submission detected (race condition)');
                } else {
                    throw submissionError;
                }
            }
        }

        // 8. Audit logs
        const auditAction = isExistingInvoice
            ? (submittedTo ? 'invoice_submitted_to_additional_lender' : 'invoice_uploaded')
            : 'invoice_uploaded';

        // OneFlow Interoperability: ERP Adapter (Upgrade 3)
        const { validateInvoiceInERP } = require('../adapters/erp.adapter');
        const erpResult = await validateInvoiceInERP(receivableFingerprint, req.user.id);

        // ✅ 7. Create audit logs
        await createAuditLog({
            action: isExistingInvoice ? 'invoice_submitted_to_additional_lender' : 'invoice_uploaded',
            performedBy: req.user.id,
            invoiceId: invoice._id,
            receivableFingerprint,
            severity: 'INFO',
            details: {
                invoiceId: invoice.invoiceId,
                amount: invoice.amount,
                submittedTo: submittedTo || null,
                erpValidation: erpResult.status
            },
            ipAddress: req.ip,
            requestId: req.requestId,
        });

        if (submittedTo && !isExistingInvoice) {
            await createAuditLog({
                action: 'invoice_submitted',
                performedBy: req.user.id,
                invoiceId: invoice._id,
                receivableFingerprint,
                severity: 'INFO',
                details: {
                    lenderId: submittedTo,
                },
                ipAddress: req.ip,
                requestId: req.requestId,
            });
        }

        // 9. Log receivable registration (internal audit) - only for new invoices
        if (!isExistingInvoice) {
            await createAuditLog({
                action: 'RECEIVABLE_REGISTERED',
                performedBy: req.user.id,
                invoiceId: invoice._id,
                receivableFingerprint: invoice.receivableFingerprint,
                severity: 'INFO',
                details: { receivableFingerprint },
                ipAddress: req.ip,
                requestId: req.requestId,
            });
        }

        const responseMessage = isExistingInvoice
            ? `Invoice submitted to additional lender successfully.`
            : 'Invoice uploaded securely. Pending blockchain verification by lender.';

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
        }, responseMessage);
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
 * 
 * ACTION 2 & 3 Implementation:
 * - Checks (receivableFingerprint + lenderId) to prevent duplicate submission to SAME lender
 * - Allows submission to DIFFERENT lenders (parallel lender discovery)
 * - Does NOT check financing status (MSMEs can approach multiple lenders before financing)
 */
const submitInvoice = async (req, res, next) => {
    try {
        const { invoiceId } = req.params;
        const { lenderId } = req.body;

        if (!lenderId) {
            return next(new AppError('Lender ID is required for submission', 400));
        }

        // 1. Verify lender exists and has correct role
        const lender = await User.findOne({ _id: lenderId, role: 'lender' });
        if (!lender) {
            return next(new AppError('Target lender not found or invalid role', 404));
        }

        // 2. Find invoice and verify ownership
        const invoice = await Invoice.findOne({ invoiceId, uploadedBy: req.user.id });
        if (!invoice) {
            return next(new AppError('Invoice not found or access denied', 404));
        }

        // ✅ ACTION 2 CHECK: Block duplicate submission to SAME lender
        const existingSubmission = await LenderSubmission.findOne({
            receivableFingerprint: invoice.receivableFingerprint,
            lenderId: lenderId
        });

        if (existingSubmission) {
            const { updateTrustScore } = require('../services/trust.service');
            await updateTrustScore(req.user.id, 'DUPLICATE_ATTEMPT', {
                reason: 'same_lender_duplicate_submission',
                lenderId: lenderId
            });
            return next(new AppError(
                'You have already submitted this receivable to this lender. Please choose a different lender.',
                409,
                'DUPLICATE_LENDER_SUBMISSION'
            ));
        }

        // ❌ ACTION 3 RULE: Do NOT block based on financing status
        // MSMEs can approach multiple lenders before any lender finances the receivable
        // The financing check happens at the blockchain level when lender attempts to finance

        // 3. Create new LenderSubmission record
        try {
            await LenderSubmission.create({
                receivableFingerprint: invoice.receivableFingerprint,
                invoiceId: invoice.invoiceId,
                msmeId: req.user.id,
                lenderId: lenderId,
                status: 'SUBMITTED',
                submittedAt: new Date(),
            });
        } catch (submissionError) {
            // Handle duplicate key error (race condition)
            if (submissionError.code === 11000) {
                return next(new AppError(
                    'This receivable has already been submitted to this lender',
                    409,
                    'DUPLICATE_LENDER_SUBMISSION'
                ));
            }
            throw submissionError;
        }

        // 4. Update invoice submittedTo array (for backward compatibility)
        await Invoice.findByIdAndUpdate(
            invoice._id,
            { $addToSet: { submittedTo: lenderId } },
            { new: true }
        );

        // 5. Audit log
        await createAuditLog({
            action: 'invoice_submitted',
            performedBy: req.user.id,
            invoiceId: invoice._id,
            receivableFingerprint: invoice.receivableFingerprint,
            details: {
                invoiceId: invoice.invoiceId,
                receivableFingerprint: invoice.receivableFingerprint,
                lenderId,
                lenderOrganization: lender.organization
            },
            ipAddress: req.ip,
            requestId: req.requestId,
        });

        return sendResponse(res, 200, {
            invoiceId: invoice.invoiceId,
            receivableFingerprint: invoice.receivableFingerprint,
            lenderOrganization: lender.organization,
            submittedAt: new Date()
        }, `Invoice successfully submitted to ${lender.organization}`);
    } catch (error) {
        next(error);
    }
};

module.exports = { upload, createInvoice, getMyInvoices, submitInvoice };
