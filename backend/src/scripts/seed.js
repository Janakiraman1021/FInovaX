const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Invoice = require('../models/Invoice');
const AuditLog = require('../models/AuditLog');
const crypto = require('crypto');
const { hashBuffer } = require('../utils/hash');

// Load env vars
dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected for seeding...');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }
};

const runSeed = async () => {
    await connectDB();

    console.log('🌱 Starting database seed...');

    try {
        // 1. Clear database Collections (Drop completely to kill old indexes)
        try { await User.collection.drop(); } catch (e) { }
        try { await Invoice.collection.drop(); } catch (e) { }
        try { await AuditLog.collection.drop(); } catch (e) { }
        console.log('🗑️  Cleared existing Users, Invoices, and Audit Logs');

        // 2. Create base roles to test
        const users = [
            { name: 'Acme Corp MSME', email: 'msme@fintrust.com', password: 'Password123!', role: 'msme', organization: 'Acme Corp' },
            { name: 'Global Finance Bank', email: 'lenderA@fintrust.com', password: 'Password123!', role: 'lender', organization: 'Global Finance' },
            { name: 'Capital One NBFC', email: 'lenderB@fintrust.com', password: 'Password123!', role: 'lender', organization: 'Capital One' },
            { name: 'Ernst & Young Auditor', email: 'auditor@fintrust.com', password: 'Password123!', role: 'auditor', organization: 'EY' },
        ];

        const createdUsers = await User.create(users);
        console.log(`👤 Created ${createdUsers.length} seed users`);

        const msme = createdUsers.find(u => u.role === 'msme');
        const lenderA = createdUsers.find(u => u.email === 'lenderA@fintrust.com');

        // 3. Create dummy file hashes for invoices
        const dummyBuffer1 = Buffer.from('Dummy Invoice PDF Content 1');
        const dummyBuffer2 = Buffer.from('Dummy Invoice PDF Content 2 (Already Financed)');

        const hash1 = hashBuffer(dummyBuffer1);
        const hash2 = hashBuffer(dummyBuffer2);

        // 4. Seed structured demo invoices
        const invoices = [
            {
                invoiceId: `INV-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
                uploadedBy: msme._id,
                amount: 50000,
                currency: 'INR',
                description: 'Server hardware supplies for Q3',
                invoiceHash: hash1,
                ipfsCID: 'QmDummyHashString123456789',
                originalFileName: 'acme_invoice_01.pdf',
                status: 'UPLOADED', // Ready for demo financing map
            },
            {
                invoiceId: `INV-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
                uploadedBy: msme._id,
                amount: 120000,
                currency: 'USD',
                description: 'Export goods tracking #8932',
                invoiceHash: hash2,
                ipfsCID: 'QmDummyHashString987654321',
                originalFileName: 'export_invoice_99.pdf',
                status: 'FINANCED', // Pre-financed to show the duplicate blocking feature if Lender B tries
                financedBy: lenderA._id,
                financedAt: new Date(Date.now() - 86400000), // 1 day ago
                financeTxHash: '0xDummyTxHashSimulatingBlockchainActionToDemonstrateBlockingBehavior',
                blockchainTxHash: '0xDummyTxHashSimulatingRegistration',
            }
        ];

        await Invoice.create(invoices);
        console.log(`📄 Created ${invoices.length} seed invoices`);

        console.log('\n✅ SEED COMPLETED SUCCESSFULLY');
        console.log('==============================================');
        console.log('DEMO CREDENTIALS (All passwords are "Password123!")');
        console.log('👉 MSME: msme@fintrust.com');
        console.log('👉 Lender A: lenderA@fintrust.com');
        console.log('👉 Lender B: lenderB@fintrust.com');
        console.log('👉 Auditor: auditor@fintrust.com');
        console.log('==============================================\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ SEED FAILED:', error);
        process.exit(1);
    }
};

runSeed();
