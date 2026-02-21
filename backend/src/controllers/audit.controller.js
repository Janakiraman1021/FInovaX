const AuditLog = require('../models/AuditLog');
const AppError = require('../utils/AppError');

/**
 * GET /api/audit/logs
 * Get all audit logs (paginated). Auditor only.
 */
const getAuditLogs = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, action, userId } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const filter = {};
        if (action) filter.action = action;
        if (userId) filter.performedBy = userId;

        const [logs, total] = await Promise.all([
            AuditLog.find(filter)
                .populate('performedBy', 'name email role')
                .populate('invoiceId', 'invoiceNumber amount status')
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
        const logs = await AuditLog.find({ invoiceId: req.params.invoiceId })
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

module.exports = { getAuditLogs, getInvoiceAuditLogs };
