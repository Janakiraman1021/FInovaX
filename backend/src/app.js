const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorHandler');

const requestIdMiddleware = require('./middleware/requestId');
const v1Routes = require('./routes/v1.routes');
const msmeProfileRoutes = require("./routes/msmeProfileRoutes");
// const trustRoutes = require('./routes/trust.routes');

const app = express();

// --------------- Global Middleware ---------------
app.use(requestIdMiddleware);
app.use(helmet());
app.use(cors({
    origin: [
        'https://openflow-six.vercel.app',
        'http://localhost:3000',
        'http://localhost:3001'
    ],
    credentials: true
}));
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

// Backward Compatibility Routes (mount individual route modules)
const authRoutes = require('./routes/auth.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const blockchainRoutes = require('./routes/blockchain.routes');
const lenderRoutes = require('./routes/lender.routes');
const auditRoutes = require('./routes/audit.routes');
const trustRoutes = require('./routes/trust.routes');

app.use('/auth', authRoutes);
app.use('/invoices', invoiceRoutes);
app.use('/blockchain', blockchainRoutes);
app.use('/lender', lenderRoutes);
app.use('/audit', auditRoutes);
app.use('/trust', trustRoutes);

// General Health (Redirecting to versioned health)
app.get('/health', (_req, res) => res.redirect('/api/v1/health'));

// MSME Profile Routes
app.use("/api/msme-profile", msmeProfileRoutes);
app.use("/", (req, res) => {
    res.json({ message: "Welcome to FInovaX API" });
});

// --------------- 404 Handler ---------------
app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// --------------- Error Handler ---------------
app.use(errorHandler);

module.exports = app;
