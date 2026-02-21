const AssuranceReport = require('../models/AssuranceReport');
const Invoice = require('../models/Invoice');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/response');
const { updateTrustScore } = require('../services/trust.service');
const { createAuditLog } = require('../services/audit.service');

/**
 * POST /api/v1/assurance/submit
 * MSME submits a usage report for a financed invoice.
 */
const submitReport = async (req, res, next) => {
    try {
        const { invoiceId, usageCategory, description, attachments } = req.body;

        // 1. Find invoice and verify ownership + state
        const invoice = await Invoice.findOne({ invoiceId: invoiceId, uploadedBy: req.user.id });
        if (!invoice) return next(new AppError('Invoice not found or access denied', 404));

        if (invoice.status !== 'FINANCED') {
            return next(new AppError('Assurance reports can only be submitted for FINANCED invoices', 400));
        }

        // 2. Create the report
        const report = await AssuranceReport.create({
            invoiceId: invoice._id,
            msmeId: req.user.id,
            lenderId: invoice.financedBy,
            receivableFingerprint: invoice.receivableFingerprint,
            usageCategory,
            description,
            attachments: attachments || [],
            status: 'SUBMITTED'
        });

        // 3. Update Trust Score
        await updateTrustScore(req.user.id, 'REPORT_SUBMITTED', { invoiceId: invoice.invoiceId });

        await createAuditLog({
            action: 'ASSURANCE_REPORT_SUBMITTED',
            performedBy: req.user.id,
            invoiceId: invoice._id,
            receivableFingerprint: invoice.receivableFingerprint,
            details: {
                reportId: report._id,
                usageCategory
            },
            ipAddress: req.ip,
            requestId: req.requestId,
        });

        return sendResponse(res, 201, { report }, 'Assurance report submitted successfully. Trust signals updated.');
    } catch (error) {
        if (error.code === 11000) {
            return next(new AppError('A report for this invoice already exists', 409));
        }
        next(error);
    }
};

/**
 * POST /api/v1/assurance/acknowledge
 * Lender acknowledges an MSME assurance report.
 */
const acknowledgeReport = async (req, res, next) => {
    try {
        const { reportId } = req.body;

        const report = await AssuranceReport.findById(reportId).populate('msmeId');
        if (!report) return next(new AppError('Report not found', 404));

        // Only the financing lender can acknowledge
        if (report.lenderId.toString() !== req.user.id.toString()) {
            return next(new AppError('Only the financing lender can acknowledge this report', 403));
        }

        if (report.status === 'ACKNOWLEDGED') {
            return next(new AppError('Report is already acknowledged', 400));
        }

        report.status = 'ACKNOWLEDGED';
        report.acknowledgedAt = new Date();
        await report.save();

        // Bonus for MSME
        await updateTrustScore(report.msmeId._id, 'REPORT_ACKNOWLEDGED', { reportId: report._id });

        await createAuditLog({
            action: 'ASSURANCE_REPORT_ACKNOWLEDGED',
            performedBy: req.user.id,
            invoiceId: report.invoiceId,
            receivableFingerprint: report.receivableFingerprint,
            details: { reportId: report._id },
            ipAddress: req.ip,
            requestId: req.requestId,
        });

        return sendResponse(res, 200, { report }, 'Assurance report acknowledged. MSME trust score reinforced.');
    } catch (error) {
        next(error);
    }
};

const getReportByInvoice = async (req, res, next) => {
    try {
        const { invoiceId } = req.params;
        
        // First find the invoice to get its MongoDB _id
        const invoice = await Invoice.findOne({ invoiceId });
        if (!invoice) {
            return sendResponse(res, 200, { report: null });
        }

        const filter = { invoiceId: invoice._id };

        // Role-based visibility
        if (req.user.role === 'msme') filter.msmeId = req.user.id;
        if (req.user.role === 'lender') filter.lenderId = req.user.id;

        const report = await AssuranceReport.findOne(filter);
        if (!report && req.user.role !== 'auditor') {
            return next(new AppError('Report not found or access denied', 404));
        }

        // Auditor can see all reports but not attachments
        const finalReport = report ? report.toObject() : null;
        if (req.user.role === 'auditor' && finalReport) {
            delete finalReport.attachments;
        }

        return sendResponse(res, 200, { report: finalReport });
    } catch (error) {
        next(error);
    }
};

module.exports = { submitReport, acknowledgeReport, getReportByInvoice };
