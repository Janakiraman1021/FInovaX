const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const invoiceRoutes = require('./routes/invoice.routes'); // Wait, check path
const blockchainRoutes = require('./blockchain.routes');
const lenderRoutes = require('./lender.routes');
const auditRoutes = require('./audit.routes');
const healthRoutes = require('./health.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/blockchain', blockchainRoutes);
router.use('/lender', lenderRoutes);
router.use('/audit', auditRoutes);
router.use('/health', healthRoutes);

module.exports = router;
