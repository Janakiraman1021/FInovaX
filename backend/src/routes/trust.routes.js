const express = require('express');
const router = express.Router();
const { submitReport, acknowledgeReport, getReportByInvoice } = require('../controllers/assurance.controller');
const { getInvoiceTimeline } = require('../controllers/timeline.controller');
const { getMyTrustScore } = require('../controllers/msmeProfileController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

// Assurance Reports
router.post('/assurance/submit', authorize('msme'), submitReport);
router.post('/assurance/acknowledge', authorize('lender'), acknowledgeReport);
router.get('/assurance/invoice/:invoiceId', getReportByInvoice);

// Timeline
router.get('/timeline/invoice/:invoiceId', getInvoiceTimeline);

// Trust Score
router.get('/trustscore/me', authorize('msme'), getMyTrustScore);

module.exports = router;
