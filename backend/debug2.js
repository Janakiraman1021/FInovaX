require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const fs = require('fs');

const test = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        await User.deleteMany();
        const users = [
            { name: 'Acme Corp MSME', email: 'msme@fintrust.com', password: 'Password123!', role: 'msme', organization: 'Acme Corp' },
            { name: 'Global Finance Bank', email: 'lenderA@fintrust.com', password: 'Password123!', role: 'lender', organization: 'Global Finance' },
            { name: 'Capital One NBFC', email: 'lenderB@fintrust.com', password: 'Password123!', role: 'lender', organization: 'Capital One' },
            { name: 'Ernst & Young Auditor', email: 'auditor@fintrust.com', password: 'Password123!', role: 'auditor', organization: 'EY' },
        ];
        await User.create(users);
        console.log('Success');
        fs.writeFileSync('debug-out.txt', 'Success');
    } catch (e) {
        console.error('Error Details:', e);
        fs.writeFileSync('debug-out.txt', String(e.stack));
    } finally {
        process.exit();
    }
}
test();
