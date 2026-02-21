const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Invoice = require('../models/Invoice');
const AuditLog = require('../models/AuditLog');
const crypto = require('crypto');
const { hashBuffer, generateReceivableFingerprint } = require('../utils/hash');

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

        const msme = await User.findOne({ email: 'msme@fintrust.com' });
        const lenderA = await User.findOne({ email: 'lenderA@fintrust.com' });

        // 3. Create dummy file hashes for invoices
        const dummyBuffer1 = Buffer.from('Dummy Invoice PDF Content 1');
        const dummyBuffer2 = Buffer.from('Dummy Invoice PDF Content 2 (Already Financed)');

        const hash1 = hashBuffer(dummyBuffer1);
        const hash2 = hashBuffer(dummyBuffer2);

        // 4. Metadata for fingerprints
        const metadata1 = {
            sellerGSTIN: '27AAAAA0000A1Z5',
            buyerGSTIN: '27BBBBB1111B1Z5',
            invoiceAmount: 50000,
            poReference: 'PO-2023-001',
            invoiceDate: '2023-10-01'
        };

        const metadata2 = {
            sellerGSTIN: '27AAAAA0000A1Z5',
            buyerGSTIN: '27CCCCC2222C1Z5',
            invoiceAmount: 120000,
            poReference: 'PO-2023-999',
            invoiceDate: '2023-11-15'
        };

        const fingerprint1 = generateReceivableFingerprint(metadata1);
        const fingerprint2 = generateReceivableFingerprint(metadata2);

        // 5. Seed structured demo invoices
        const invoices = [
            {
                invoiceId: `INV-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
                uploadedBy: msme._id,
                ...metadata1,
                amount: metadata1.invoiceAmount,
                receivableFingerprint: fingerprint1,
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
                ...metadata2,
                amount: metadata2.invoiceAmount,
                receivableFingerprint: fingerprint2,
                currency: 'USD',
                description: 'Export goods tracking #8932',
                invoiceHash: hash2,
                ipfsCID: 'QmDummyHashString987654321',
                originalFileName: 'export_invoice_99.pdf',
                status: 'FINANCED', // Pre-financed
                financedBy: lenderA._id,
                financedAt: new Date(Date.now() - 86400000),
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
