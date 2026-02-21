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

const requestIdMiddleware = require('./middleware/requestId');
const v1Routes = require('./routes/v1.routes');

const app = express();

// --------------- Global Middleware ---------------
app.use(requestIdMiddleware);
app.use(helmet());
app.use(cors());
app.use(
    rateLimit({
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
        max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            success: false,
            message: 'Too many requests, please try again later.',
            errorCode: 'RATE_LIMIT_EXCEEDED'
        },
    })
);

// --------------- Body Parsing ---------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// --------------- Logging ---------------
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
}

// --------------- API Routes ---------------

// Versioned routes (v1)
app.use('/api/v1', v1Routes);

// Backward Compatibility Routes
app.use('/auth', v1Routes);
app.use('/invoices', v1Routes);
app.use('/blockchain', v1Routes);
app.use('/lender', v1Routes);
app.use('/audit', v1Routes);

// General Health (Redirecting to versioned health)
app.get('/health', (_req, res) => res.redirect('/api/v1/health'));

// --------------- 404 Handler ---------------
app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// --------------- Error Handler ---------------
app.use(errorHandler);

module.exports = app;
