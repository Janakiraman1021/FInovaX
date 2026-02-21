const express = require('express');
const router = express.Router();
const { getAuditLogs, getInvoiceAuditLogs, getReceivableAuditLogs } = require('../controllers/audit.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// All routes are protected — auditor only
router.use(protect, authorize('auditor'));

// GET /audit/system — paginated audit logs
router.get('/system', getAuditLogs);

// GET /audit/invoice/:invoiceId — logs for a specific invoice
router.get('/invoice/:invoiceId', getInvoiceAuditLogs);

// GET /audit/receivable/:fingerprint — logs for a specific business obligation
router.get('/receivable/:fingerprint', getReceivableAuditLogs);

module.exports = router;
