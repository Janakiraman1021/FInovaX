const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
    {
        eventType: {
            type: String,
            required: [true, 'Event type is required'],
            enum: [
                // User events
                'user_registered',
                'user_login',
                // Invoice lifecycle events
                'invoice_uploaded',
                'invoice_submitted',
                'invoice_submitted_to_additional_lender',
                'invoice_registered_on_chain',
                'invoice_financed',
                'invoice_verified',
                'finance_blocked_duplicate',
                // On-chain event types
                'InvoiceRegistered',
                'InvoiceFinanced',
                'DuplicateFinancingAttempt',
                // Receivable-level events
                'RECEIVABLE_REGISTERED',
                'RECEIVABLE_FINANCED',
                'RECEIVABLE_BLOCKED',
                'RECEIVABLE_VERIFIED',
                'DUPLICATE_RECEIVABLE_FINANCING_ATTEMPT',
                // Duplicate attempt tracking
                'DUPLICATE_FINANCING_ATTEMPT',
                'DUPLICATE_ATTEMPT'
            ],
            index: true,
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null, // Optional because on-chain events don't have a Mongo User ID, just an address
            index: true,
        },
        actorAddress: {
            type: String, // Stored for on-chain events where we only know the hex address
            default: null,
            index: true,
        },
        receivableFingerprint: {
            type: String,
            default: null,
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
        requestId: {
            type: String,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for chronological queries
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
