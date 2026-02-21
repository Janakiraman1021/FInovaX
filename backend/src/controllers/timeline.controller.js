const AuditLog = require('../models/AuditLog');
const AssuranceReport = require('../models/AssuranceReport');
const Invoice = require('../models/Invoice');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/response');

/**
 * GET /api/v1/timeline/invoice/:invoiceId
 * Aggregate all trust events for a specific invoice.
 */
const getInvoiceTimeline = async (req, res, next) => {
    try {
        const { invoiceId } = req.params;

        const invoice = await Invoice.findOne({
            $or: [{ _id: invoiceId }, { invoiceId }]
        });
        if (!invoice) return next(new AppError('Invoice not found', 404));

        // Visibility Rules
        if (req.user.role === 'msme' && invoice.uploadedBy.toString() !== req.user.id.toString()) {
            return next(new AppError('Access denied', 403));
        }
        if (req.user.role === 'lender' && !invoice.submittedTo.includes(req.user.id)) {
            return next(new AppError('Access denied', 403));
        }

        // Aggregate 1: Audit Logs (technical events)
        const logs = await AuditLog.find({ invoiceId: invoice._id })
            .select('action createdAt details')
            .sort({ createdAt: 1 });

        // Aggregate 2: Assurance Report (usage disclosure)
        const report = await AssuranceReport.findOne({ invoiceId: invoice._id })
            .select('status usageCategory createdAt acknowledgedAt');

        // Transform into unified timeline
        const timeline = logs.map(log => ({
            type: 'SYSTEM_EVENT',
            event: log.action,
            timestamp: log.createdAt,
            details: log.details
        }));

        if (report) {
            timeline.push({
                type: 'ASSURANCE_REPORT',
                event: 'REPORT_SUBMITTED',
                timestamp: report.createdAt,
                details: { category: report.usageCategory }
            });
            if (report.status === 'ACKNOWLEDGED') {
                timeline.push({
                    type: 'ASSURANCE_REPORT',
                    event: 'REPORT_ACKNOWLEDGED',
                    timestamp: report.acknowledgedAt,
                    details: {}
                });
            }
        }

        // Sort by time
        timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        return sendResponse(res, 200, {
            invoice: { invoiceId: invoice.invoiceId, status: invoice.status },
            timeline
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getInvoiceTimeline };
