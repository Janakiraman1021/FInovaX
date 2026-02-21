const express = require('express');
const router = express.Router();
const { submitReport, acknowledgeReport, getReportByInvoice } = require('../controllers/assurance.controller');
const { getInvoiceTimeline, getReceivableTimeline } = require('../controllers/timeline.controller');
const { getMyTrustScore, getMSMETrustScore } = require('../controllers/msmeProfileController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

// Assurance Reports
router.post('/assurance/submit', authorize('msme'), submitReport);
router.post('/assurance/acknowledge', authorize('lender'), acknowledgeReport);
router.get('/assurance/invoice/:invoiceId', getReportByInvoice);

// Timeline
router.get('/timeline/invoice/:invoiceId', getInvoiceTimeline);
router.get('/timeline/receivable/:fingerprint', authorize('lender', 'auditor'), getReceivableTimeline);

// Trust Score
router.get('/trustscore/me', authorize('msme'), getMyTrustScore);
router.get('/trustscore/msme/:msmeId', authorize('lender', 'auditor'), getMSMETrustScore);

module.exports = router;
