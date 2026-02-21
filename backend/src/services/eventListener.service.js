const { ethers } = require('ethers');
const Invoice = require('../models/Invoice');
const AuditLog = require('../models/AuditLog');

// ABI must match the events we want to listen to
const CONTRACT_ABI = [
    'event InvoiceRegistered(bytes32 indexed invoiceHash, string invoiceId, address indexed registeredBy, uint256 timestamp)',
    'event InvoiceFinanced(bytes32 indexed invoiceHash, address indexed lender, uint256 timestamp)',
    'event ReceivableFinanced(bytes32 indexed receivableFingerprint, address indexed lender, uint256 timestamp)',
    'event DuplicateFinancingAttempt(bytes32 indexed invoiceHash, address indexed attemptedBy, uint256 timestamp)',
    'event DuplicateReceivableFinancingAttempt(bytes32 indexed receivableFingerprint, address indexed attemptedBy, uint256 timestamp)',
];

let provider = null;
let contract = null;

/**
 * Initialize and start listening to blockchain events
 */
const initEventListeners = () => {
    const rpcUrl = process.env.SEPOLIA_RPC_URL; // Or WSS URL if available
    const contractAddress = process.env.INVOICE_REGISTRY_CONTRACT;

    if (!rpcUrl || !contractAddress) {
        console.warn('⚠️  Blockchain credentials missing — event listeners disabled');
        return;
    }

    try {
        // A WebSocket provider is better for listening, but JsonRpcProvider works too for polling
        provider = new ethers.JsonRpcProvider(rpcUrl);
        contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);

        console.log('🎧 Blockchain event listeners started (Sepolia)');

        // Listen: InvoiceRegistered
        contract.on('InvoiceRegistered', async (invoiceHash, invoiceIdStr, registeredBy, timestamp, event) => {
            try {
                console.log(`[Event] InvoiceRegistered: ${invoiceHash} by ${registeredBy}`);

                // Strip '0x' if needed to match our DB storage (we typically store as hex string without 0x or with, depending on utils)
                // In our previous implementation, we stored the hash without '0x' in DB, but let's check by exact match or substring
                const cleanHash = invoiceHash.replace('0x', '');

                const invoice = await Invoice.findOne({ invoiceHash: cleanHash });

                await AuditLog.create({
                    eventType: 'InvoiceRegistered',
                    invoiceId: invoice ? invoice._id : null,
                    actorAddress: registeredBy,
                    txHash: event.log.transactionHash,
                    details: { invoiceHash: cleanHash, invoiceId: invoiceIdStr, timestamp: timestamp.toString() },
                });
            } catch (err) {
                console.error('Error processing InvoiceRegistered event:', err.message);
            }
        });

        // Listen: InvoiceFinanced
        contract.on('InvoiceFinanced', async (invoiceHash, lender, timestamp, event) => {
            try {
                console.log(`[Event] InvoiceFinanced: ${invoiceHash} by ${lender}`);
                const cleanHash = invoiceHash.replace('0x', '');
                const invoice = await Invoice.findOne({ invoiceHash: cleanHash });

                await AuditLog.create({
                    eventType: 'InvoiceFinanced',
                    invoiceId: invoice ? invoice._id : null,
                    actorAddress: lender,
                    txHash: event.log.transactionHash,
                    details: { invoiceHash: cleanHash, timestamp: timestamp.toString() },
                });
            } catch (err) {
                console.error('Error processing InvoiceFinanced event:', err.message);
            }
        });

        // Listen: DuplicateFinancingAttempt
        contract.on('DuplicateFinancingAttempt', async (invoiceHash, attemptedBy, timestamp, event) => {
            try {
                console.warn(`[Event] DuplicateFinancingAttempt: ${invoiceHash} by ${attemptedBy}`);
                const cleanHash = invoiceHash.replace('0x', '');
                const invoice = await Invoice.findOne({ invoiceHash: cleanHash });

                await AuditLog.create({
                    eventType: 'DuplicateFinancingAttempt',
                    invoiceId: invoice ? invoice._id : null,
                    actorAddress: attemptedBy,
                    txHash: event.log.transactionHash,
                    details: { invoiceHash: cleanHash, timestamp: timestamp.toString() },
                });
            } catch (err) {
                console.error('Error processing DuplicateFinancingAttempt event:', err.message);
            }
        });

        // Listen: ReceivableFinanced
        contract.on('ReceivableFinanced', async (fingerprint, lender, timestamp, event) => {
            try {
                console.log(`[Event] ReceivableFinanced: ${fingerprint} by ${lender}`);
                const cleanFingerprint = fingerprint.replace('0x', '');

                // There might be multiple invoices for one receivable fingerprint
                const invoices = await Invoice.find({ receivableFingerprint: cleanFingerprint });

                await AuditLog.create({
                    eventType: 'RECEIVABLE_FINANCED',
                    actorAddress: lender,
                    receivableFingerprint: cleanFingerprint,
                    txHash: event.log.transactionHash,
                    details: {
                        fingerprint: cleanFingerprint,
                        timestamp: timestamp.toString(),
                        affectedInvoices: invoices.map(i => i.invoiceId)
                    },
                });
            } catch (err) {
                console.error('Error processing ReceivableFinanced event:', err.message);
            }
        });

        // Listen: DuplicateReceivableFinancingAttempt
        contract.on('DuplicateReceivableFinancingAttempt', async (fingerprint, attemptedBy, timestamp, event) => {
            try {
                console.warn(`[Event] DuplicateReceivableFinancingAttempt: ${fingerprint} by ${attemptedBy}`);
                const cleanFingerprint = fingerprint.replace('0x', '');

                await AuditLog.create({
                    eventType: 'DUPLICATE_RECEIVABLE_FINANCING_ATTEMPT',
                    actorAddress: attemptedBy,
                    receivableFingerprint: cleanFingerprint,
                    txHash: event.log.transactionHash,
                    details: { fingerprint: cleanFingerprint, timestamp: timestamp.toString() },
                });
            } catch (err) {
                console.error('Error processing DuplicateReceivableFinancingAttempt event:', err.message);
            }
        });

    } catch (error) {
        console.error('Event listener init error:', error.message);
    }
};

module.exports = { initEventListeners };
