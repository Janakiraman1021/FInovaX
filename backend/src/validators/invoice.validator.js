const { body } = require('express-validator');

const invoiceUploadValidation = [

    body('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be a positive number'),
    body('sellerGSTIN')
        .trim()
        .notEmpty()
        .withMessage('Seller GSTIN is required'),
    body('buyerGSTIN')
        .trim()
        .notEmpty()
        .withMessage('Buyer GSTIN is required'),
    body('invoiceDate')
        .notEmpty()
        .withMessage('Invoice date is required')
        .isISO8601()
        .withMessage('Invoice date must be a valid ISO8601 date'),
    body('poReference')
        .trim()
        .notEmpty()
        .withMessage('PO Reference is required'),
    body('currency')
        .optional()
        .trim()
        .isLength({ min: 3, max: 3 })
        .withMessage('Currency must be a 3-letter code'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters'),
];

module.exports = { invoiceUploadValidation };
