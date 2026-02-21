const express = require('express');
const router = express.Router();
const { register, login, getMe, updateMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { registerValidation, loginValidation } = require('../validators/auth.validator');
const { authLimiter } = require('../middleware/rateLimiter');

// POST /auth/register
router.post('/register', registerValidation, validate, register);

// POST /auth/login
router.post('/login', authLimiter, loginValidation, validate, login);

// GET /auth/me — protected
router.get('/me', protect, getMe);

// PATCH /auth/me — protected
router.patch('/me', protect, updateMe);

module.exports = router;
