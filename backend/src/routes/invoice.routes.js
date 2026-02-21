const express = require('express');
const router = express.Router();
const { upload, createInvoice, getInvoices, getInvoiceById } = require('../controllers/invoice.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { invoiceUploadValidation } = require('../validators/invoice.validator');

// All routes are protected
router.use(protect);

// POST /api/invoices — MSME only
router.post(
    '/',
    authorize('msme'),
    upload.single('file'),
    invoiceUploadValidation,
    validate,
    createInvoice
);

// GET /api/invoices — all roles
router.get('/', authorize('msme', 'lender', 'auditor'), getInvoices);

// GET /api/invoices/:id — all roles
router.get('/:id', authorize('msme', 'lender', 'auditor'), getInvoiceById);

module.exports = router;
