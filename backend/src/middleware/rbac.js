const AppError = require('../utils/AppError');

/**
 * Role-based access control middleware factory.
 * @param  {...string} roles - Allowed roles (e.g. 'msme', 'lender', 'auditor').
 */
const authorize = (...roles) => {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new AppError('Not authorized', 401));
        }

        if (!roles.includes(req.user.role)) {
            return next(new AppError(`Role '${req.user.role}' is not authorized to access this resource`, 403));
        }

        next();
    };
};

module.exports = { authorize };
