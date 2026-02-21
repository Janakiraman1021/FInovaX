const AppError = require('../utils/AppError');

/**
 * Centralized error handler middleware.
 */
const errorHandler = (err, _req, res, _next) => {
    let errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        statusCode = 400;
        errorCode = 'INVALID_RESOURCE_ID';
        message = 'Invalid resource ID';
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        statusCode = 409;
        errorCode = 'DUPLICATE_RESOURCE';
        const field = Object.keys(err.keyValue).join(', ');
        message = `Duplicate value for field: ${field}`;
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        statusCode = 400;
        errorCode = 'VALIDATION_ERROR';
        const errors = Object.values(err.errors).map((e) => e.message);
        message = errors.join('. ');
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        errorCode = 'INVALID_TOKEN';
        message = 'Invalid token';
    }
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        errorCode = 'TOKEN_EXPIRED';
        message = 'Token expired';
    }

    console.error(`[ERROR] ${statusCode} - ${errorCode} - ${message}`, process.env.NODE_ENV === 'development' ? err.stack : '');

    res.status(statusCode).json({
        success: false,
        errorCode,
        message,
        requestId: _req.requestId,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

module.exports = { errorHandler };
