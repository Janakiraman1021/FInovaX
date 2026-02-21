require('dotenv').config();
const mongoose = require('mongoose');
const Invoice = require('./src/models/Invoice');
const User = require('./src/models/User');
const crypto = require('crypto');
const { hashBuffer } = require('./src/utils/hash');

const test = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const msme = await User.findOne({ role: 'msme' });
        const lenderA = await User.findOne({ email: 'lenderA@fintrust.com' });

        await Invoice.deleteMany();

        const dummyBuffer1 = Buffer.from('Dummy Invoice PDF Content 1');
        const dummyBuffer2 = Buffer.from('Dummy Invoice PDF Content 2 (Already Financed)');

        const hash1 = hashBuffer(dummyBuffer1);
        const hash2 = hashBuffer(dummyBuffer2);

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
                status: 'UPLOADED',
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
                status: 'FINANCED',
                financedBy: lenderA._id,
                financeTxHash: '0xDummyTxHashSimulatingBlockchainActionToDemonstrateBlockingBehavior',
                blockchainTxHash: '0xDummyTxHashSimulatingRegistration',
            }
        ];

        await Invoice.create(invoices);
        console.log('Success Invoice');
    } catch (e) {
        console.error('INVOICE ERROR:', e.message);
    } finally {
        process.exit();
    }
}
test();
