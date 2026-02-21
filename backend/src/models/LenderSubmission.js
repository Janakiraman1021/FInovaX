const mongoose = require('mongoose');

/**
 * LenderSubmission tracks which lenders have received which receivable fingerprints.
 * This prevents MSMEs from submitting the same business obligation to the same lender twice.
 * 
 * Key Rule: One receivableFingerprint can be submitted to multiple lenders,
 * but the same (receivableFingerprint + lenderId) combination is blocked.
 */
const lenderSubmissionSchema = new mongoose.Schema(
    {
        receivableFingerprint: {
            type: String,
            required: [true, 'Receivable fingerprint is required'],
            index: true,
        },
        invoiceId: {
            type: String,
            required: [true, 'Invoice ID is required'],
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
        status: {
            type: String,
            enum: ['SUBMITTED', 'FINANCED', 'BLOCKED'],
            default: 'SUBMITTED',
            index: true,
        },
        submittedAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
        financedAt: {
            type: Date,
            default: null,
        },
        financedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index: receivableFingerprint + lenderId must be unique
lenderSubmissionSchema.index({ receivableFingerprint: 1, lenderId: 1 }, { unique: true });

// Index for lender queries
lenderSubmissionSchema.index({ lenderId: 1, status: 1 });

// Index for MSME queries
lenderSubmissionSchema.index({ msmeId: 1, status: 1 });

module.exports = mongoose.model('LenderSubmission', lenderSubmissionSchema);
