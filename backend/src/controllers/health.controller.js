const mongoose = require('mongoose');
const { ethers } = require('ethers');
const axios = require('axios');
const pkg = require('../../package.json');
const { sendResponse } = require('../utils/response');

/**
 * GET /health
 * Returns the health status of the application and its dependencies.
 */
const getHealth = async (req, res) => {
    const healthStatus = {
        api: 'HEALTHY',
        uptime: process.uptime(),
        version: pkg.version,
        timestamp: new Date().toISOString(),
        dependencies: {
            mongodb: 'UNKNOWN',
            blockchain: 'UNKNOWN',
            ipfs: 'UNKNOWN'
        }
    };

    // 1. Check MongoDB
    try {
        const state = mongoose.connection.readyState;
        const states = {
            0: 'DISCONNECTED',
            1: 'CONNECTED',
            2: 'CONNECTING',
            3: 'DISCONNECTING'
        };
        healthStatus.dependencies.mongodb = states[state] || 'ERROR';
    } catch (err) {
        healthStatus.dependencies.mongodb = 'ERROR';
    }

    // 2. Check Blockchain (Ethereum Sepolia)
    try {
        if (!process.env.SEPOLIA_RPC_URL) {
            healthStatus.dependencies.blockchain = 'CONFIG_MISSING';
        } else {
            const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
            const network = await provider.getNetwork();
            healthStatus.dependencies.blockchain = network ? 'HEALTHY' : 'DEGRADED';
        }
    } catch (err) {
        healthStatus.dependencies.blockchain = 'UNAVAILABLE';
    }

    // 3. Check IPFS (Using gateway as a proxy for availability)
    try {
        const gateway = process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs/';
        await axios.get(gateway, { timeout: 3000 });
        healthStatus.dependencies.ipfs = 'HEALTHY';
    } catch (err) {
        healthStatus.dependencies.ipfs = 'DEGRADED';
    }

    // Determine overall status
    const overallHealthy =
        healthStatus.api === 'HEALTHY' &&
        healthStatus.dependencies.mongodb === 'CONNECTED' &&
        healthStatus.dependencies.blockchain === 'HEALTHY';

    return sendResponse(res, overallHealthy ? 200 : 207, healthStatus, overallHealthy ? 'System Health: OK' : 'System Health: DEGRADED');
};

module.exports = { getHealth };
