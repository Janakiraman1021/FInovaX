const AuditLog = require('../models/AuditLog');
const AppError = require('../utils/AppError');
const Invoice  = require('../models/Invoice');

/**
 * GET /audit/invoices
 * Read-only list of all invoices. Auditor only.
 */
const getAllInvoices = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, status } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const filter = {};
        if (status) filter.status = status.toUpperCase();

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

/**
 * GET /api/audit/logs
 * Get all audit logs (paginated). Auditor only.
 */
const getAuditLogs = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, eventType, userId } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const filter = {};
        if (eventType) filter.eventType = eventType;
        if (userId) filter.performedBy = userId;

        const [logs, total] = await Promise.all([
            AuditLog.find(filter)
                .populate('performedBy', 'name email role')
                .populate('invoiceId', 'invoiceId amount status')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            AuditLog.countDocuments(filter),
        ]);

        res.json({
            success: true,
            data: {
                logs,
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
 * GET /api/audit/logs/:invoiceId
 * Get audit logs for a specific invoice. Auditor only.
 */
const getInvoiceAuditLogs = async (req, res, next) => {
    try {
        const invoiceId = req.params.invoiceId;
        const Invoice = require('../models/Invoice');

        // Find if this is an internal ObjectId or a custom invoiceId
        let filter = { invoiceId }; // Assume it's an ObjectId for the audit log

        // If it looks like 'INV-', let's find the matching ObjectId from the Invoices table
        if (invoiceId.startsWith('INV-')) {
            const invoice = await Invoice.findOne({ invoiceId });
            if (invoice) filter = { invoiceId: invoice._id };
        }

        const logs = await AuditLog.find(filter)
            .populate('performedBy', 'name email role')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: { logs },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getAllInvoices, getAuditLogs, getInvoiceAuditLogs };
