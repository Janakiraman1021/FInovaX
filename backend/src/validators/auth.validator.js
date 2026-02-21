const { body } = require('express-validator');

const registerValidation = [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/\d/)
        .withMessage('Password must contain at least one number'),
    body('role')
        .trim()
        .isIn(['msme', 'lender', 'auditor'])
        .withMessage('Role must be one of: msme, lender, auditor'),
    body('organization').optional().trim().isLength({ max: 200 }),
];

const loginValidation = [
    body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
];

module.exports = { registerValidation, loginValidation };
