const { v4: uuidv4 } = require('uuid');

/**
 * Middleware to generate and attach a unique requestId to each request.
 */
const requestTrace = (req, res, next) => {
    const requestId = uuidv4();
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
};

module.exports = requestTrace;
