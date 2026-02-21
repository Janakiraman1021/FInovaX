const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
    {
        invoiceNumber: {
            type: String,
            required: [true, 'Invoice number is required'],
            trim: true,
            index: true,
        },
        msmeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'MSME reference is required'],
            index: true,
        },
        amount: {
            type: Number,
            required: [true, 'Invoice amount is required'],
            min: [0, 'Amount cannot be negative'],
        },
        currency: {
            type: String,
            default: 'INR',
            uppercase: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        // File & integrity
        fileHash: {
            type: String,
            required: [true, 'File hash is required'],
            unique: true,
            index: true,
        },
        ipfsCid: {
            type: String,
            default: null,
        },
        originalFileName: {
            type: String,
        },
        // Blockchain
        status: {
            type: String,
            enum: {
                values: ['uploaded', 'registered', 'financed'],
                message: 'Status must be one of: uploaded, registered, financed',
            },
            default: 'uploaded',
            index: true,
        },
        blockchainTxHash: {
            type: String,
            default: null,
        },
        financeTxHash: {
            type: String,
            default: null,
        },
        financedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        financedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index to prevent same MSME uploading duplicate invoice numbers
invoiceSchema.index({ invoiceNumber: 1, msmeId: 1 }, { unique: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
