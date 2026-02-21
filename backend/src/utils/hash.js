const crypto = require('crypto');

/**
 * Generate SHA-256 hash of a file buffer.
 * @param {Buffer} buffer - The file buffer to hash.
 * @returns {string} Hex-encoded SHA-256 hash.
 */
const hashBuffer = (buffer) => {
    return crypto.createHash('sha256').update(buffer).digest('hex');
};

module.exports = { hashBuffer };
