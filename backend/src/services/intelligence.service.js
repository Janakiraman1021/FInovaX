const Receivable = require('../models/Receivable');
const RiskAlert = require('../models/RiskAlert');
const LenderSubmission = require('../models/LenderSubmission');
const Invoice = require('../models/Invoice');
const { createAuditLog } = require('./audit.service');

/**
 * Update receivable confidence level based on submission patterns.
 * Signal: Manual entry (default) -> MEDIUM
 * Signal: Consistent submissions -> HIGH
 * Signal: Inconsistent fields/hashes -> LOW
 */
const updateReceivableConfidence = async (fingerprint) => {
    try {
        let receivable = await Receivable.findOne({ receivableFingerprint: fingerprint });

        if (!receivable) {
            receivable = await Receivable.create({ receivableFingerprint: fingerprint });
        }

        const submissionCount = await LenderSubmission.countDocuments({ receivableFingerprint: fingerprint });
        receivable.lenderSubmissionCount = submissionCount;

        // Base Logic: "OneFlow does not decide risk. It surfaces confidence and signals so lenders can decide."
        let newConfidence = 'MEDIUM';

        // HIGH Confidence: 2+ consistent submissions
        if (submissionCount >= 2 && !receivable.inconsistentDataDetected) {
            newConfidence = 'HIGH';
        }

        // LOW Confidence: Inconsistent data flagged previously
        if (receivable.inconsistentDataDetected) {
            newConfidence = 'LOW';
        }

        if (receivable.receivableConfidence !== newConfidence) {
            const oldConfidence = receivable.receivableConfidence;
            receivable.receivableConfidence = newConfidence;
            receivable.lastConfidenceUpdate = new Date();
            await receivable.save();

            // Log the confidence change
            await createAuditLog({
                action: 'CONFIDENCE_LEVEL_CHANGED',
                receivableFingerprint: fingerprint,
                severity: 'INFO',
                details: {
                    oldConfidence,
                    newConfidence,
                    reason: 'Pattern calculation'
                }
            });
        }

        return receivable;
    } catch (err) {
        console.error('[INTELLIGENCE] Confidence update failed:', err.message);
        return null;
    }
};

/**
 * Detect soft risk patterns (non-blocking).
 */
const checkRiskAlerts = async (fingerprint, msmeId) => {
    try {
        const submissionCount = await LenderSubmission.countDocuments({ receivableFingerprint: fingerprint });
        const msmeSubmissionCount = await LenderSubmission.countDocuments({ msmeId });
        const financeCount = await Invoice.countDocuments({ uploadedBy: msmeId, status: 'FINANCED' });

        // 1. MULTI_LENDER_PRESSURE: Same receivable to many lenders (3+)
        if (submissionCount >= 4) {
            await triggerRiskAlert('MULTI_LENDER_PRESSURE', 'INFO', 'RECEIVABLE', fingerprint, { submissionCount });
        }

        // 2. NO_FINANCE_PATTERN: Many attempts, no success
        if (msmeSubmissionCount >= 5 && financeCount === 0) {
            await triggerRiskAlert('NO_FINANCE_PATTERN', 'WARNING', 'MSME', msmeId.toString(), { msmeSubmissionCount, financeCount });
        }

        // Note: NEAR_DUPLICATE_PATTERN and INCONSISTENT_BEHAVIOR are triggered 
        // by specific error events in controllers.

    } catch (err) {
        console.error('[INTELLIGENCE] Risk check failed:', err.message);
    }
};

/**
 * Trigger and store a risk alert.
 */
const triggerRiskAlert = async (alertCode, severity, entityType, entityId, metadata = {}) => {
    try {
        // Prevent duplicate alerts of same type for same entity within 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const existingRecentAlert = await RiskAlert.findOne({
            alertCode,
            entityType,
            entityId,
            createdAt: { $gte: oneDayAgo }
        });

        if (existingRecentAlert) return;

        await RiskAlert.create({
            alertCode,
            severity,
            entityType,
            entityId,
            metadata
        });

        // Log for auditor visibility
        await createAuditLog({
            action: 'RISK_ALERT_TRIGGERED',
            severity: severity === 'WARNING' ? 'WARNING' : 'INFO',
            receivableFingerprint: entityType === 'RECEIVABLE' ? entityId : null,
            details: {
                alertCode,
                entityType,
                entityId,
                ...metadata
            }
        });
    } catch (err) {
        console.error('[INTELLIGENCE] Alert trigger failed:', err.message);
    }
};

module.exports = {
    updateReceivableConfidence,
    checkRiskAlerts,
    triggerRiskAlert
};
