const { createAuditLog } = require('../services/audit.service');

/**
 * Middleware to automatically log all API requests for comprehensive audit trails
 * This supplements the specific event logging done in controllers
 */
const auditLogger = (req, res, next) => {
    // Skip non-mutating operations (GET, HEAD, OPTIONS) unless explicitly needed
    const shouldLog = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
    
    if (!shouldLog) {
        return next();
    }

    // Capture the original res.json to intercept response
    const originalJson = res.json.bind(res);
    
    res.json = function (body) {
        // Only log successful operations (2xx status codes)
        if (res.statusCode >= 200 && res.statusCode < 300) {
            // Extract relevant info
            const eventData = {
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                userAgent: req.get('user-agent'),
                // Don't log sensitive data like passwords
            };

            // Sanitize request body (remove sensitive fields)
            if (req.body) {
                const sanitizedBody = { ...req.body };
                delete sanitizedBody.password;
                delete sanitizedBody.token;
                eventData.requestBody = sanitizedBody;
            }

            // Log asynchronously to not block response
            setImmediate(async () => {
                try {
                    await createAuditLog({
                        action: `API_${req.method}_${req.path.replace(/\//g, '_').replace(/^_/, '')}`,
                        performedBy: req.user?.id || null,
                        details: eventData,
                        ipAddress: req.ip,
                        requestId: req.requestId,
                    });
                } catch (err) {
                    console.error('Audit logging failed:', err.message);
                }
            });
        }

        return originalJson(body);
    };

    next();
};

module.exports = { auditLogger };
