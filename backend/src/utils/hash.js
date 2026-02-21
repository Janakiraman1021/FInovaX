const crypto = require('crypto');

/**
 * Generate SHA-256 hash of a file buffer.
 * @param {Buffer} buffer - The file buffer to hash.
 * @returns {string} Hex-encoded SHA-256 hash.
 */
const hashBuffer = (buffer) => {
    return crypto.createHash('sha256').update(buffer).digest('hex');
};

/**
 * Generate a multi-signal receivable fingerprint.
 * Represents the business obligation based on key invoice metadata.
 */
const generateReceivableFingerprint = ({ sellerGSTIN, buyerGSTIN, invoiceAmount, poReference, invoiceDate }) => {
    // Normalize fields
    const seller = String(sellerGSTIN || '').trim().toUpperCase();
    const buyer = String(buyerGSTIN || '').trim().toUpperCase();
    const amount = Number(invoiceAmount).toFixed(2);
    const po = String(poReference || '').trim().toUpperCase();
    const date = new Date(invoiceDate).toISOString().split('T')[0]; // YYYY-MM-DD

    // Concatenate in fixed order
    const signal = `SELLER:${seller}|BUYER:${buyer}|AMOUNT:${amount}|PO:${po}|DATE:${date}`;

    // Hash using SHA-256
    return crypto.createHash('sha256').update(signal).digest('hex');
};

module.exports = { hashBuffer, generateReceivableFingerprint };
