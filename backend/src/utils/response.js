/**
 * Unified success response formatter.
 */
const sendSuccess = (res, data = {}, statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        data,
        requestId: res.req.requestId,
    });
};

/**
 * Unified error response formatter.
 */
const sendError = (res, errorCode, message, statusCode = 400) => {
    return res.status(statusCode).json({
        success: false,
        errorCode,
        message,
        requestId: res.req.requestId,
    });
};

module.exports = { sendSuccess, sendError };
