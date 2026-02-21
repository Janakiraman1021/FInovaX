const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { registerValidation, loginValidation } = require('../validators/auth.validator');

// POST /api/auth/register
router.post('/register', registerValidation, validate, register);

// POST /api/auth/login
router.post('/login', loginValidation, validate, login);

// GET /api/auth/me — protected
router.get('/me', protect, getMe);

module.exports = router;
