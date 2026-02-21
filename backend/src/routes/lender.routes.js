const express = require('express');
const router = express.Router();
const { getAllInvoices, verifyInvoice, financeInvoice, updateInvoiceStatus } = require('../controllers/lender.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { financeLimiter } = require('../middleware/rateLimiter');

// All routes are protected — lender only
router.use(protect, authorize('lender'));

// GET /lender/invoices — list all invoices
router.get('/invoices', getAllInvoices);

// GET /lender/verify/:invoiceId — check invoice status
router.get('/verify/:invoiceId', verifyInvoice);

// POST /lender/finance/:invoiceId — finance an invoice
router.post('/finance/:invoiceId', financeLimiter, financeInvoice);

// PATCH /lender/invoices/:invoiceId/status — update invoice status
router.patch('/invoices/:invoiceId/status', updateInvoiceStatus);

module.exports = router;
