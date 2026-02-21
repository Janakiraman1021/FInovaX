const Invoice = require('../models/Invoice');
const LenderSubmission = require('../models/LenderSubmission');
const AppError = require('../utils/AppError');
const { verifyInvoiceOnChain, markInvoiceFinancedOnChain, registerReceivableOnChain, verifyReceivableOnChain, markReceivableFinancedOnChain } = require('../services/blockchain.service');
const { createAuditLog } = require('../services/audit.service');
const { sendResponse } = require('../utils/response');

/**
 * GET /lender/invoices
 * List all invoices submitted to this lender.
 * 
 * ACTION 5 Implementation:
 * - Shows invoices where lender has a submission record
 * - Includes blockchain status check to show accurate financing state
 */
const getAllInvoices = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get all submissions for this lender
        const submissionFilter = { lenderId: req.user.id };
        if (status) submissionFilter.status = status.toUpperCase();

        const submissions = await LenderSubmission.find(submissionFilter)
            .sort({ submittedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await LenderSubmission.countDocuments(submissionFilter);

        // Get invoices for these submissions
        const invoiceIds = submissions.map(s => s.invoiceId);
        const invoices = await Invoice.find({ invoiceId: { $in: invoiceIds } })
            .populate('uploadedBy', 'name organization')
            .lean();

        // Create a map for quick lookup
        const invoiceMap = new Map(invoices.map(inv => [inv.invoiceId, inv]));

        // Merge submission data with invoice data and check blockchain status
        const enrichedInvoices = await Promise.all(submissions.map(async (sub) => {
            const invoice = invoiceMap.get(sub.invoiceId);
            if (!invoice) return null;

            // Check on-chain receivable status for ACTION 5
            let isReceivableFinanced = false;
            try {
                const bcStatus = await verifyReceivableOnChain(invoice.receivableFingerprint);
                isReceivableFinanced = bcStatus?.financed || false;
            } catch (err) {
                console.warn('Blockchain check failed:', err.message);
            }

            // Determine actual status based on blockchain truth
            const actualStatus = isReceivableFinanced ? 'FINANCED' : sub.status;

            return {
                ...invoice,
                submissionStatus: actualStatus,
                submittedAt: sub.submittedAt,
                isReceivableFinanced,
                canFinance: !isReceivableFinanced && actualStatus === 'SUBMITTED',
            };
        }));

        const validInvoices = enrichedInvoices.filter(Boolean);

        return sendResponse(res, 200, {
            invoices: validInvoices,
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
 * GET /api/lender/verify/:invoiceId
 * Verify invoice status — check both DB and blockchain.
 */
const verifyInvoice = async (req, res, next) => {
    try {
        const identifier = req.params.invoiceId;

        // Find invoice — allow lookup by invoiceId OR invoiceHash
        const invoice = await Invoice.findOne({
            $or: [
                { invoiceId: identifier },
                { invoiceHash: identifier }
            ]
        })
            .populate('uploadedBy', 'name email organization')
            .populate('financedBy', 'name email organization');

        if (!invoice) {
            return next(new AppError('Invoice not found or access denied', 404));
        }

        // RBAC: lender can only verify invoices submitted to them
        if (invoice.submittedTo && !invoice.submittedTo.includes(req.user.id)) {
            return next(new AppError('This invoice was not submitted to you. Access denied.', 403));
        }

        // Fetch on-chain status
        const [bcFile, bcReceivable] = await Promise.all([
            verifyInvoiceOnChain(invoice.invoiceHash),
            verifyReceivableOnChain(invoice.receivableFingerprint),
        ]);

        const registeredOnChain = bcFile?.registered || false;
        const docFinanced = bcFile?.financed || false;
        const recFinanced = bcReceivable?.financed || false;
        const isDuplicate = docFinanced || recFinanced || invoice.status === 'FINANCED';
        const canFinance = !isDuplicate && invoice.status === 'UPLOADED' && registeredOnChain;

        // Audit log for invoice verification
        await createAuditLog({
            action: 'invoice_verified',
            performedBy: req.user.id,
            invoiceId: invoice._id,
            receivableFingerprint: invoice.receivableFingerprint,
            details: {
                invoiceId: invoice.invoiceId,
                receivableFingerprint: invoice.receivableFingerprint,
                registeredOnChain,
                isDuplicate,
                canFinance,
                verificationResult: {
                    docFinanced,
                    recFinanced,
                    status: invoice.status
                }
            },
            ipAddress: req.ip,
            requestId: req.requestId,
        });

        // Log receivable verification
        await createAuditLog({
            action: 'RECEIVABLE_VERIFIED',
            performedBy: req.user.id,
            invoiceId: invoice._id,
            receivableFingerprint: invoice.receivableFingerprint,
            details: {
                receivableFingerprint: invoice.receivableFingerprint,
                isFinanced: recFinanced,
                canFinance
            },
            ipAddress: req.ip,
            requestId: req.requestId,
        });

        return sendResponse(res, 200, {
            invoice: {
                id: invoice._id,
                invoiceId: invoice.invoiceId,
                amount: invoice.amount,
                currency: invoice.currency || 'INR',
                status: invoice.status,
                invoiceHash: invoice.invoiceHash,
                blockchainTxHash: invoice.blockchainTxHash || null,
                financeTxHash: invoice.financeTxHash || null,
                uploadedBy: invoice.uploadedBy
                    ? { name: invoice.uploadedBy.name, email: invoice.uploadedBy.email, organization: invoice.uploadedBy.organization }
                    : null,
                financedBy: invoice.financedBy
                    ? { name: invoice.financedBy.name, email: invoice.financedBy.email, organization: invoice.financedBy.organization }
                    : null,
                financedAt: invoice.financedAt || null,
            },
            verification: {
                valid: !!invoice,
                duplicate: isDuplicate,
                financed: invoice.status === 'FINANCED',
                registeredOnChain: registeredOnChain,
            },
            canFinance,
        }, 'Verification result retrieved successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/lender/finance/:invoiceId
 * Finance an invoice — marks receivable on-chain, blocks duplicates.
 * 
 * ACTION 4 & 6 Implementation:
 * - Calls blockchain financeReceivable(receivableFingerprint)
 * - Blockchain enforces single-lender rule
 * - Updates all submissions with same receivableFingerprint to FINANCED
 * - ACTION 6: Catches blockchain revert and returns RECEIVABLE_ALREADY_FINANCED
 */
const financeInvoice = async (req, res, next) => {
    try {
        const { invoiceId } = req.params;

        // 1. Validate invoice exists and is submitted to this lender
        const invoice = await Invoice.findOne({ invoiceId });

        if (!invoice) {
            return next(new AppError('Invoice not found', 404));
        }

        // Verify lender has a submission for this receivable
        const lenderSubmission = await LenderSubmission.findOne({
            receivableFingerprint: invoice.receivableFingerprint,
            lenderId: req.user.id
        });

        if (!lenderSubmission) {
            return next(new AppError('This invoice was not submitted to you', 403));
        }

        // 2. Check if already financed in local DB
        if (invoice.status === 'FINANCED') {
            return next(new AppError('Invoice is already marked as financed', 400, 'INVOICE_ALREADY_FINANCED'));
        }
        if (invoice.status === 'BLOCKED') {
            return next(new AppError('This invoice is BLOCKED due to duplicate obligation financing', 409, 'RECEIVABLE_ALREADY_FINANCED'));
        }

        // 3. Check blockchain status before attempting
        let onChainReceivableStatus;
        try {
            onChainReceivableStatus = await verifyReceivableOnChain(invoice.receivableFingerprint);
            if (onChainReceivableStatus?.financed) {
                // Update local records to match blockchain truth
                await Promise.all([
                    Invoice.updateMany(
                        { receivableFingerprint: invoice.receivableFingerprint },
                        { $set: { status: 'BLOCKED' } }
                    ),
                    LenderSubmission.updateMany(
                        { receivableFingerprint: invoice.receivableFingerprint },
                        { $set: { status: 'FINANCED' } }
                    )
                ]);

                // Log the duplicate attempt for audit (ACTION 6)
                const { updateTrustScore } = require('../services/trust.service');
                await updateTrustScore(invoice.uploadedBy, 'INVOICE_BLOCKED', {
                    reason: 'receivable_already_financed_on_chain',
                    fingerprint: invoice.receivableFingerprint
                });

                await createAuditLog({
                    action: 'finance_blocked_duplicate',
                    performedBy: req.user.id,
                    invoiceId: invoice._id,
                    receivableFingerprint: invoice.receivableFingerprint,
                    details: {
                        invoiceId: invoice.invoiceId,
                        receivableFingerprint: invoice.receivableFingerprint,
                        reason: 'Receivable already financed on blockchain'
                    },
                    ipAddress: req.ip,
                    requestId: req.requestId,
                });

                // Log receivable blocked event
                await createAuditLog({
                    action: 'RECEIVABLE_BLOCKED',
                    performedBy: req.user.id,
                    invoiceId: invoice._id,
                    receivableFingerprint: invoice.receivableFingerprint,
                    details: {
                        receivableFingerprint: invoice.receivableFingerprint,
                        reason: 'Already financed on blockchain',
                        attemptedBy: req.user.id
                    },
                    ipAddress: req.ip,
                    requestId: req.requestId,
                });

                return next(new AppError(
                    'The business obligation for this invoice has already been financed',
                    409,
                    'RECEIVABLE_ALREADY_FINANCED'
                ));
            }
        } catch (checkError) {
            console.warn('Blockchain status check failed, proceeding with caution:', checkError.message);
        }

        // 4. ACTION 4: Attempt to finance on blockchain
        let receivableBlockchainResult = null;
        try {
            receivableBlockchainResult = await markReceivableFinancedOnChain(invoice.receivableFingerprint);
        } catch (bcError) {
            console.error('Blockchain finance marking failed:', bcError.message);

            // ACTION 6: Catch specific revert for already financed
            if (bcError.message.includes('already financed') ||
                bcError.message.includes('AlreadyFinanced') ||
                bcError.message.includes('ALREADY_FINANCED')) {

                // Log the attempt for auditor visibility
                await createAuditLog({
                    action: 'finance_blocked_duplicate',
                    performedBy: req.user.id,
                    invoiceId: invoice._id,
                    receivableFingerprint: invoice.receivableFingerprint,
                    details: {
                        invoiceId: invoice.invoiceId,
                        receivableFingerprint: invoice.receivableFingerprint,
                        blockchainError: bcError.message
                    },
                    ipAddress: req.ip,
                    requestId: req.requestId,
                });

                // Log receivable blocked event
                await createAuditLog({
                    action: 'RECEIVABLE_BLOCKED',
                    performedBy: req.user.id,
                    invoiceId: invoice._id,
                    receivableFingerprint: invoice.receivableFingerprint,
                    details: {
                        receivableFingerprint: invoice.receivableFingerprint,
                        reason: 'Blockchain revert - already financed',
                        blockchainError: bcError.message,
                        attemptedBy: req.user.id
                    },
                    ipAddress: req.ip,
                    requestId: req.requestId,
                });

                // Update local records
                const { updateTrustScore } = require('../services/trust.service');
                await updateTrustScore(invoice.uploadedBy, 'DUPLICATE_ATTEMPT', {
                    reason: 'blockchain_revert_already_financed',
                    fingerprint: invoice.receivableFingerprint
                });

                await Promise.all([
                    Invoice.updateMany(
                        { receivableFingerprint: invoice.receivableFingerprint },
                        { $set: { status: 'BLOCKED' } }
                    ),
                    LenderSubmission.updateMany(
                        { receivableFingerprint: invoice.receivableFingerprint },
                        { $set: { status: 'FINANCED' } }
                    )
                ]);

                return next(new AppError(
                    'The business obligation for this invoice has already been financed by another lender',
                    409,
                    'RECEIVABLE_ALREADY_FINANCED'
                ));
            }

            // Other blockchain errors
            return next(new AppError(`Blockchain transaction failed: ${bcError.message}`, 500, 'BLOCKCHAIN_TX_FAILED'));
        }

        // 5. Update local database - mark this invoice and all associated records
        try {
            const financedAt = new Date();

            // Update the specific invoice
            invoice.status = 'FINANCED';
            invoice.financedBy = req.user.id;
            invoice.financedAt = financedAt;
            invoice.financeTxHash = receivableBlockchainResult?.txHash || null;
            await invoice.save();

            // Update ALL invoices with same receivableFingerprint to FINANCED
            await Invoice.updateMany(
                {
                    receivableFingerprint: invoice.receivableFingerprint,
                    _id: { $ne: invoice._id }
                },
                {
                    $set: {
                        status: 'FINANCED',
                        financedBy: req.user.id,
                        financedAt,
                        financeTxHash: receivableBlockchainResult?.txHash || null
                    }
                }
            );

            // Update ALL lender submissions with same receivableFingerprint
            await LenderSubmission.updateMany(
                { receivableFingerprint: invoice.receivableFingerprint },
                {
                    $set: {
                        status: 'FINANCED',
                        financedAt,
                        financedBy: req.user.id
                    }
                }
            );

            // Update Trust Score
            const { updateTrustScore } = require('../services/trust.service');
            await updateTrustScore(invoice.uploadedBy, 'FINANCE_SUCCESS', { invoiceId: invoice.invoiceId });

        } catch (dbError) {
            console.error(`[CRITICAL INCONSISTENCY] Blockchain success (${receivableBlockchainResult?.txHash}), but DB update failed:`, dbError.message);
            return next(new AppError('Blockchain transaction completed, but local database update failed. Please contact support.', 500, 'DATABASE_SYNC_ERROR'));
        }

        // 6. Audit logs
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
            txHash: receivableBlockchainResult?.txHash || null,
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
                receivableFingerprint: invoice.receivableFingerprint,
            },
        }, 'Invoice financed successfully. Receivable locked on blockchain.');
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/lender/invoices/:invoiceId/status
 * Update invoice status — propagates to all invoices and submissions with same receivableFingerprint
 */
const updateInvoiceStatus = async (req, res, next) => {
    try {
        const { invoiceId } = req.params;
        const { status } = req.body;

        const allowedStatuses = ['UPLOADED', 'FINANCED', 'BLOCKED'];
        if (!status || !allowedStatuses.includes(status.toUpperCase())) {
            return next(new AppError(`Invalid status. Allowed: ${allowedStatuses.join(', ')}`, 400));
        }
        const newStatus = status.toUpperCase();

        // 1. Find invoice and verify lender has access via submission
        const invoice = await Invoice.findOne({ invoiceId });
        if (!invoice) {
            return next(new AppError('Invoice not found', 404));
        }

        const lenderSubmission = await LenderSubmission.findOne({
            receivableFingerprint: invoice.receivableFingerprint,
            lenderId: req.user.id
        });

        if (!lenderSubmission) {
            return next(new AppError('This invoice was not submitted to you', 403));
        }

        const oldStatus = invoice.status;
        if (oldStatus === newStatus) {
            return sendResponse(res, 200, { invoiceId, status: newStatus, updated: 0 }, 'Status unchanged');
        }

        // 2. Update all invoices with same receivableFingerprint
        const updateFields = { status: newStatus };
        if (newStatus === 'FINANCED') {
            updateFields.financedBy = req.user.id;
            updateFields.financedAt = new Date();
        }

        const invoiceUpdateResult = await Invoice.updateMany(
            { receivableFingerprint: invoice.receivableFingerprint },
            { $set: updateFields }
        );

        // 3. Update all lender submissions with same receivableFingerprint
        const submissionUpdateFields = { status: newStatus };
        if (newStatus === 'FINANCED') {
            submissionUpdateFields.financedBy = req.user.id;
            submissionUpdateFields.financedAt = new Date();
        }

        const submissionUpdateResult = await LenderSubmission.updateMany(
            { receivableFingerprint: invoice.receivableFingerprint },
            { $set: submissionUpdateFields }
        );

        // 4. Audit log
        await createAuditLog({
            action: 'invoice_status_updated',
            performedBy: req.user.id,
            invoiceId: invoice._id,
            receivableFingerprint: invoice.receivableFingerprint,
            details: {
                invoiceId: invoice.invoiceId,
                receivableFingerprint: invoice.receivableFingerprint,
                oldStatus,
                newStatus,
                invoicesUpdated: invoiceUpdateResult.modifiedCount || 0,
                submissionsUpdated: submissionUpdateResult.modifiedCount || 0,
            },
            ipAddress: req.ip,
            requestId: req.requestId,
        });

        return sendResponse(res, 200, {
            invoiceId: invoice.invoiceId,
            receivableFingerprint: invoice.receivableFingerprint,
            status: newStatus,
            invoicesUpdated: invoiceUpdateResult.modifiedCount || 0,
            submissionsUpdated: submissionUpdateResult.modifiedCount || 0,
        }, `Status updated to ${newStatus} for all related invoices and submissions.`);
    } catch (error) {
        next(error);
    }
};

module.exports = { getAllInvoices, verifyInvoice, financeInvoice, updateInvoiceStatus };
