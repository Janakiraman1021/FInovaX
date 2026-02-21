const { sendResponse } = require('../utils/response');

/**
 * GET /docs
 * Returns structured API documentation.
 */
const getDocs = (req, res) => {
    const docs = {
        name: 'FinTrust Backend API',
        version: 'v1',
        description: 'Enterprise-grade invoice financing and audit platform.',
        endpoints: [
            {
                path: '/api/v1/auth',
                methods: ['POST /register', 'POST /login', 'GET /me', 'GET /lenders'],
                description: 'Authentication and user discovery.'
            },
            {
                path: '/api/v1/invoices',
                methods: ['POST /upload', 'GET /my'],
                description: 'MSME invoice management (IPFS + DB).'
            },
            {
                path: '/api/v1/lender',
                methods: ['GET /verify/:invoiceId', 'POST /finance/:invoiceId'],
                description: 'Lender operations (Blockchain anchoring).'
            },
            {
                path: '/api/v1/audit',
                methods: ['GET /system', 'GET /invoice/:invoiceId', 'GET /receivable/:fingerprint'],
                description: 'Auditor and compliance views.'
            },
            {
                path: '/api/v1/health',
                methods: ['GET /'],
                description: 'System health and dependency monitoring.'
            }
        ],
        security: {
            authType: 'JWT / Bearer Token',
            roles: ['msme', 'lender', 'auditor']
        },
        responses: {
            success: '{ success: true, data: {}, requestId: "uuid" }',
            error: '{ success: false, errorCode: "STRING", message: "STRING", requestId: "uuid" }'
        }
    };

    return sendResponse(res, 200, docs);
};

module.exports = { getDocs };
