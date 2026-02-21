const rateLimit = require('express-rate-limit');

// Strict rate limiter for authentication endpoints (e.g. login)
// Allows 5 requests per 15 minutes per IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: {
        success: false,
        message: 'Too many login attempts, please try again after 15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Strict rate limiter for critical financial endpoints (e.g. finance invoice)
// Allows 5 requests per minute per IP
const financeLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    message: {
        success: false,
        message: 'Too many financing attempts, please slow down',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    authLimiter,
    financeLimiter,
};
