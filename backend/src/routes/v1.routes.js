const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const invoiceRoutes = require('./invoice.routes');
const blockchainRoutes = require('./blockchain.routes');
const lenderRoutes = require('./lender.routes');
const auditRoutes = require('./audit.routes');
const healthRoutes = require('./health.routes');
const docsRoutes = require('./docs.routes');
const trustRoutes = require('./trust.routes');

// Mount V1 routes
router.use('/auth', authRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/blockchain', blockchainRoutes);
router.use('/lender', lenderRoutes);
router.use('/audit', auditRoutes);
router.use('/health', healthRoutes);
router.use('/docs', docsRoutes);
router.use('/trust', trustRoutes);

module.exports = router;
