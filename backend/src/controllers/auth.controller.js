const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { createAuditLog } = require('../services/audit.service');
const { sendSuccess } = require('../utils/response');

/**
 * Generate JWT token.
 */
const signToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d',
    });
};

/**
 * POST /api/v1/auth/register
 */
const register = async (req, res, next) => {
    try {
        const { name, email, password, role, organization } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return next(new AppError('Email already registered', 409, 'DUPLICATE_USER'));
        }

        const user = await User.create({ name, email, password, role, organization });
        const token = signToken(user._id);

        await createAuditLog({
            action: 'user_registered',
            performedBy: user._id,
            details: { role, email },
            ipAddress: req.ip,
        });

        sendSuccess(res, {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                organization: user.organization,
            },
            token,
        }, 201);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/auth/login
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email, isActive: true }).select('+password');

        if (!user || !(await user.comparePassword(password))) {
            return next(new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS'));
        }

        const token = signToken(user._id);

        await createAuditLog({
            action: 'user_login',
            performedBy: user._id,
            details: { email },
            ipAddress: req.ip,
        });

        sendSuccess(res, {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                organization: user.organization,
            },
            token,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/auth/me
 */
const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
        }

        sendSuccess(res, {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            organization: user.organization,
            createdAt: user.createdAt,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, getMe };

module.exports = { register, login, getMe };
