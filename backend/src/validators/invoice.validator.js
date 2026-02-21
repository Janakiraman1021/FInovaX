const { body } = require('express-validator');

const invoiceUploadValidation = [
    body('invoiceNumber').trim().notEmpty().withMessage('Invoice number is required'),
    body('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be a positive number'),
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
