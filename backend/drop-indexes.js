/**
 * One-time script: drop the stale unique indexes on the invoices collection
 * that were removed from the Mongoose schema but still exist in MongoDB.
 *
 * Run from the backend folder:
 *   node drop-indexes.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('invoices');

        // List current indexes
        const before = await collection.indexes();
        console.log('Indexes BEFORE:', before.map(i => i.name));

        const toDrop = ['invoiceHash_1', 'receivable_uniqueness_index'];

        for (const name of toDrop) {
            const exists = before.some(i => i.name === name);
            if (exists) {
                await collection.dropIndex(name);
                console.log(`✅ Dropped index: ${name}`);
            } else {
                console.log(`⚠️  Index not found (already gone): ${name}`);
            }
        }

        const after = await collection.indexes();
        console.log('Indexes AFTER:', after.map(i => i.name));
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
        console.log('Done.');
    }
})();
