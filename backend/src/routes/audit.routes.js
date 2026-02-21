const express = require('express');
const router = express.Router();
const { getAuditLogs, getInvoiceAuditLogs } = require('../controllers/audit.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// All routes are protected — auditor only
router.use(protect, authorize('auditor'));

// GET /api/audit/logs — paginated audit logs
router.get('/logs', getAuditLogs);

// GET /api/audit/logs/:invoiceId — logs for a specific invoice
router.get('/logs/:invoiceId', getInvoiceAuditLogs);

module.exports = router;
