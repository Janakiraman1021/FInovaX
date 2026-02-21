const express = require('express');
const router = express.Router();
const { verifyInvoice, financeInvoice } = require('../controllers/lender.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// All routes are protected — lender only
router.use(protect, authorize('lender'));

// GET /api/lender/verify/:invoiceId — check invoice status
router.get('/verify/:invoiceId', verifyInvoice);

// POST /api/lender/finance/:invoiceId — finance an invoice
router.post('/finance/:invoiceId', financeInvoice);

module.exports = router;
