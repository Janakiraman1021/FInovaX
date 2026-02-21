const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const blockchainRoutes = require('./routes/blockchain.routes');
const lenderRoutes = require('./routes/lender.routes');
const auditRoutes = require('./routes/audit.routes');

const app = express();

// --------------- Security Middleware ---------------
app.use(helmet());
app.use(cors());
app.use(
    rateLimit({
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
        max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, message: 'Too many requests, please try again later.' },
    })
);

// --------------- Body Parsing ---------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// --------------- Logging ---------------
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
}

// --------------- Health Check ---------------
app.get('/api/health', (_req, res) => {
    res.json({ success: true, message: 'FinTrust API is running', timestamp: new Date().toISOString() });
});

// --------------- API Routes ---------------
app.use('/auth', authRoutes);
app.use('/invoices', invoiceRoutes);
app.use('/blockchain', blockchainRoutes);
app.use('/lender', lenderRoutes);
app.use('/audit', auditRoutes);

// --------------- 404 Handler ---------------
app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// --------------- Error Handler ---------------
app.use(errorHandler);

module.exports = app;
