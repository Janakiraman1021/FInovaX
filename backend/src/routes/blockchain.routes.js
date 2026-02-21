const express = require('express');
const router = express.Router();
const { registerInvoice } = require('../controllers/blockchain.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// Protect route — only MSME or Lender can register
router.use(protect, authorize('msme', 'lender'));

// POST /blockchain/register-invoice
router.post('/register-invoice', registerInvoice);

module.exports = router;
