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
const createAuditLog = async ({ action, performedBy, invoiceId = null, txHash = null, details = {}, ipAddress = null }) => {
    try {
        const log = await AuditLog.create({
            eventType: action,
            performedBy,
            invoiceId,
            txHash,
            details,
            ipAddress,
        });
        return log;
    } catch (error) {
        // Audit logging should never crash the main request
        console.error('Audit log creation failed:', error.message);
        return null;
    }
};

module.exports = { createAuditLog };
