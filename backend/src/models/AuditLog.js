const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
    {
        action: {
            type: String,
            required: [true, 'Action is required'],
            enum: [
                'user_registered',
                'user_login',
                'invoice_uploaded',
                'invoice_registered_on_chain',
                'invoice_financed',
                'invoice_verified',
                'finance_blocked_duplicate',
            ],
            index: true,
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        invoiceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Invoice',
            default: null,
            index: true,
        },
        txHash: {
            type: String,
            default: null,
        },
        details: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        ipAddress: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Index for chronological queries
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
