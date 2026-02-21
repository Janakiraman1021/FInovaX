const mongoose = require('mongoose');

const riskAlertSchema = new mongoose.Schema(
    {
        alertCode: {
            type: String,
            required: [true, 'Alert code is required'],
            enum: [
                'MULTI_LENDER_PRESSURE',
                'NO_FINANCE_PATTERN',
                'NEAR_DUPLICATE_PATTERN',
                'INCONSISTENT_BEHAVIOR'
            ],
            index: true,
        },
        severity: {
            type: String,
            enum: ['INFO', 'WARNING'],
            default: 'INFO',
        },
        entityType: {
            type: String,
            enum: ['RECEIVABLE', 'MSME'],
            required: true,
            index: true,
        },
        entityId: {
            type: String, // Can be fingerprint or MSME User ID
            required: true,
            index: true,
        },
        resolved: {
            type: Boolean,
            default: false,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        }
    },
    {
        timestamps: true,
    }
);

// Index for lookup
riskAlertSchema.index({ entityType: 1, entityId: 1 });

module.exports = mongoose.model('RiskAlert', riskAlertSchema);
