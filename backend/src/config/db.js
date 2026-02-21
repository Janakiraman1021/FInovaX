const mongoose = require('mongoose');

const connectDB = async () => {
    const uri = process.env.MONGO_URI;

    if (!uri) {
        throw new Error('MONGO_URI is not defined in environment variables');
    }

    try {
        const conn = await mongoose.connect(uri);

        console.log(`✅ MongoDB connected: ${conn.connection.host}`);

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️  MongoDB disconnected');
        });
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        throw error;
    }
};

module.exports = connectDB;
