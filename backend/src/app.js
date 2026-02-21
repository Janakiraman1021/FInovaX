const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const requestTrace = require('./middleware/requestTrace');

const authRoutes = require('./routes/auth.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const blockchainRoutes = require('./routes/blockchain.routes');
const lenderRoutes = require('./routes/lender.routes');
const auditRoutes = require('./routes/audit.routes');

const app = express();

// --------------- Traceability ---------------
app.use(requestTrace);

// --------------- Security Middleware ---------------
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
            errorCode: 'TOO_MANY_REQUESTS',
            message: 'Too many requests, please try again later.',
            requestId: (req) => req.requestId
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

// --------------- System Health & Monitoring ---------------
app.get(['/health', '/api/v1/health'], async (req, res) => {
    const mongoose = require('mongoose');
    const { ethers } = require('ethers');
    const axios = require('axios');

    const health = {
        api: 'HEALTHY',
        uptime: process.uptime(),
        mongodb: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DEGRADED',
        ethereum: 'UNKNOWN',
        ipfs: 'UNKNOWN',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
    };

    // Check Ethereum RPC
    try {
        const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
        await provider.getBlockNumber();
        health.ethereum = 'CONNECTED';
    } catch (e) {
        health.ethereum = 'DEGRADED';
    }

    // Check IPFS (Pinata)
    try {
        await axios.get('https://api.pinata.cloud/data/testAuthentication', {
            headers: {
                pinata_api_key: process.env.PINATA_API_KEY,
                pinata_secret_api_key: process.env.PINATA_SECRET_KEY
            }
        });
        health.ipfs = 'CONNECTED';
    } catch (e) {
        health.ipfs = 'DEGRADED';
    }

    const isHealthy = health.mongodb === 'CONNECTED' && health.ethereum === 'CONNECTED' && health.ipfs === 'CONNECTED';
    const statusCode = isHealthy ? 200 : 503;

    res.status(statusCode).json({
        success: isHealthy,
        data: health,
        requestId: req.requestId
    });
});

// --------------- API Routes (v1) ---------------
const v1Router = express.Router();
v1Router.use('/auth', authRoutes);
v1Router.use('/invoices', invoiceRoutes);
v1Router.use('/blockchain', blockchainRoutes);
v1Router.use('/lender', lenderRoutes);
v1Router.use('/audit', auditRoutes);

app.use('/api/v1', v1Router);

// Backward Compatibility
app.use('/auth', authRoutes);
app.use('/invoices', invoiceRoutes);
app.use('/blockchain', blockchainRoutes);
app.use('/lender', lenderRoutes);
app.use('/audit', auditRoutes);

// --------------- Documentation ---------------
app.get('/docs', (req, res) => {
    res.json({
        success: true,
        data: {
            name: 'FinTrust API',
            version: '1.0.0',
            baseUrl: '/api/v1',
            endpoints: {
                auth: ['/register', '/login', '/me'],
                invoices: ['/upload', '/my'],
                lender: ['/verify/:invoiceId', '/finance/:invoiceId'],
                blockchain: ['/register-invoice'],
                audit: ['/system', '/invoice/:invoiceId']
            }
        },
        requestId: req.requestId
    });
});

// --------------- 404 Handler ---------------
app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// --------------- Error Handler ---------------
app.use(errorHandler);

module.exports = app;
