const mongoose = require('mongoose');

const assuranceReportSchema = new mongoose.Schema(
    {
        invoiceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Invoice',
            required: [true, 'Invoice reference is required'],
            index: true,
        },
        msmeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'MSME reference is required'],
            index: true,
        },
        lenderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Lender reference is required'],
            index: true,
        },
        receivableFingerprint: {
            type: String,
            required: [true, 'Receivable fingerprint is required'],
            index: true,
        },
        usageCategory: {
            type: String,
            enum: {
                values: ['RAW_MATERIAL', 'VENDOR_PAYMENT', 'WORKING_CAPITAL', 'LOGISTICS', 'OTHER'],
                message: 'Invalid usage category',
            },
            required: [true, 'Usage category is required'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        attachments: [{
            type: String, // IPFS CIDs
        }],
        status: {
            type: String,
            enum: ['SUBMITTED', 'ACKNOWLEDGED'],
            default: 'SUBMITTED',
        },
        acknowledgedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// One report per invoice
assuranceReportSchema.index({ invoiceId: 1 }, { unique: true });

module.exports = mongoose.model('AssuranceReport', assuranceReportSchema);
