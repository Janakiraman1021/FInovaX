const MSMEProfile = require('../models/MSMEProfile');
const { createAuditLog } = require('./audit.service');

/**
 * Trust Signals & Impact
 */
const SIGNALS = {
    FINANCE_SUCCESS: 10,
    REPORT_SUBMITTED: 5,
    REPORT_ACKNOWLEDGED: 5,
    CLEAN_HISTORY_BONUS: 5,
    DUPLICATE_ATTEMPT: -30,
    INVOICE_BLOCKED: -20
};

/**
 * Update MSME Trust Score based on system events.
 * @param {string} userId - MSME user ID
 * @param {string} signal - Key from SIGNALS
 * @param {object} context - Additional info for audit log
 */
const updateTrustScore = async (userId, signal, context = {}) => {
    try {
        const impact = SIGNALS[signal];
        if (impact === undefined) return;

        const profile = await MSMEProfile.findOne({ userId });
        if (!profile) return;

        const oldScore = profile.trustScore;
        const newScore = Math.min(100, Math.max(0, oldScore + impact));

        if (oldScore === newScore) return;

        profile.trustScore = newScore;
        await profile.save();

        // Log the trust change
        await createAuditLog({
            action: 'TRUST_SCORE_UPDATED',
            performedBy: userId,
            details: {
                signal,
                impact,
                oldScore,
                newScore,
                ...context
            }
        });

        return newScore;
    } catch (error) {
        console.error('Trust Score Update Error:', error.message);
    }
};

module.exports = { updateTrustScore, SIGNALS };
