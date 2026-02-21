const AuditLog = require('../models/AuditLog');

/**
 * Create an audit log entry.
 * @param {object} params
 * @param {string} params.action - The action performed.
 * @param {string} params.performedBy - User ID of the actor.
 * @param {string} [params.invoiceId] - Related invoice ID.
 * @param {string} [params.txHash] - Blockchain transaction hash.
 * @param {object} [params.details] - Additional details.
 * @param {string} [params.ipAddress] - Client IP address.
 * @returns {Promise<object>}
 */
const createAuditLog = async ({
    action,
    performedBy,
    invoiceId = null,
    receivableFingerprint = null,
    txHash = null,
    details = {},
    ipAddress = null,
    requestId = null,
    severity = null
}) => {
    try {
        // Automatic Severity Mapping if not provided
        let eventSeverity = severity;
        if (!eventSeverity) {
            const warningEvents = ['DUPLICATE_ATTEMPT', 'DUPLICATE_FINANCING_ATTEMPT', 'finance_blocked_duplicate', 'RECEIVABLE_BLOCKED'];
            const criticalEvents = ['INVOICE_BLOCKED', 'BLOCKCHAIN_TX_FAILED', 'DATABASE_SYNC_ERROR'];

            if (criticalEvents.includes(action)) eventSeverity = 'CRITICAL';
            else if (warningEvents.includes(action) || action.includes('blocked')) eventSeverity = 'WARNING';
            else eventSeverity = 'INFO';
        }

        const log = await AuditLog.create({
            eventType: action,
            performedBy,
            invoiceId,
            receivableFingerprint,
            txHash,
            details,
            ipAddress,
            requestId,
            severity: eventSeverity
        });
        return log;
    } catch (error) {
        // Audit logging should never crash the main request
        console.error('Audit log creation failed:', error.message);
        return null;
    }
};

module.exports = { createAuditLog };
