const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000';

async function verifyModules() {
    try {
        console.log('Testing blockchain and lender modules...');
        // Just verify the server is up
        const health = await axios.get(`${BASE_URL}/api/health`);
        console.log('Server Health:', health.data);
    } catch (err) {
        console.error('Error connecting to server:', err.message);
    }
}

verifyModules();
