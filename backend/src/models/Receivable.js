const mongoose = require('mongoose');

const receivableSchema = new mongoose.Schema(
    {
        receivableFingerprint: {
            type: String,
            required: [true, 'Receivable fingerprint is required'],
            unique: true,
            index: true,
        },
        receivableConfidence: {
            type: String,
            enum: ['LOW', 'MEDIUM', 'HIGH'],
            default: 'MEDIUM',
        },
        consistentSubmissionsCount: {
            type: Number,
            default: 0,
        },
        inconsistentDataDetected: {
            type: Boolean,
            default: false,
        },
        lenderSubmissionCount: {
            type: Number,
            default: 0,
        },
        lastConfidenceUpdate: {
            type: Date,
            default: Date.now,
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Receivable', receivableSchema);
