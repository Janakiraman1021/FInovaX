const express = require('express');
const router = express.Router();
<<<<<<< HEAD
const { getAuditLogs, getInvoiceAuditLogs, getReceivableAuditLogs } = require('../controllers/audit.controller');
=======
const { getAllInvoices, getAuditLogs, getInvoiceAuditLogs } = require('../controllers/audit.controller');
>>>>>>> fd51e07e76cb493c946db651dd9ec9b2ed378cca
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// All routes are protected — auditor only
router.use(protect, authorize('auditor'));

// GET /audit/invoices — read-only list of all invoices
router.get('/invoices', getAllInvoices);

// GET /audit/system — paginated audit logs
router.get('/system', getAuditLogs);

// GET /audit/invoice/:invoiceId — logs for a specific invoice
router.get('/invoice/:invoiceId', getInvoiceAuditLogs);

// GET /audit/receivable/:fingerprint — logs for a specific business obligation
router.get('/receivable/:fingerprint', getReceivableAuditLogs);

module.exports = router;
