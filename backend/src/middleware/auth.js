const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const User = require('../models/User');

/**
 * Protect routes — verifies JWT and attaches user to req.
 */
const protect = async (req, _res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next(new AppError('Not authorized — no token provided', 401));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return next(new AppError('User belonging to this token no longer exists', 401));
        }

        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = { protect };
