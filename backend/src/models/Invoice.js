const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
    {
        invoiceId: {
            type: String,
            required: [true, 'Invoice ID is required'],
            trim: true,
            index: true,
            unique: true, // Generate unique invoiceId
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Uploader reference is required'],
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
        invoiceHash: {
            type: String,
            required: [true, 'Invoice hash is required'],
            unique: true,
            index: true,
        },
        ipfsCID: {
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
                values: ['UPLOADED', 'FINANCED', 'BLOCKED'],
                message: 'Status must be UPLOADED, FINANCED, or BLOCKED',
            },
            default: 'UPLOADED',
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

// No need for compound index on invoiceId as it will be unique UUID
module.exports = mongoose.model('Invoice', invoiceSchema);
