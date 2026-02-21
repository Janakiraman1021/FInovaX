const express = require('express');
const router = express.Router();
const { upload, createInvoice, getMyInvoices } = require('../controllers/invoice.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { invoiceUploadValidation } = require('../validators/invoice.validator');
const { submitInvoice } = require('../controllers/invoice.controller');

// All routes are protected
router.use(protect);

// POST /api/invoices/upload — MSME only
router.post(
    '/upload',
    authorize('msme'),
    upload.single('file'),
    invoiceUploadValidation,
    validate,
    createInvoice
);

// GET /api/invoices/my — MSME only
router.get('/my', authorize('msme'), getMyInvoices);

// POST /api/invoices/:invoiceId/submit — MSME only
router.post('/:invoiceId/submit', authorize('msme'), submitInvoice);

module.exports = router;
