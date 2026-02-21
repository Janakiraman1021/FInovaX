/**
 * Utility to standardize API responses.
 */
const sendResponse = (res, statusCode, data = {}, message = '') => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        requestId: res.req.requestId,
    });
};

/**
 * Utility to standardize API error responses.
 */
const sendError = (res, statusCode, errorCode, message) => {
    return res.status(statusCode).json({
        success: false,
        errorCode,
        message,
        requestId: res.req.requestId,
    });
};

module.exports = { sendResponse, sendError };
