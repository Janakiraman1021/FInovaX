const { ethers } = require('ethers');

// ABI for InvoiceRegistry contract (only the functions we need)
const CONTRACT_ABI = [
    'function registerInvoice(bytes32 hash, string invoiceNumber) external',
    'function markFinanced(bytes32 hash) external',
    'function isRegistered(bytes32 hash) external view returns (bool)',
    'function isFinanced(bytes32 hash) external view returns (bool)',
    'function getInvoice(bytes32 hash) external view returns (string invoiceNumber, address registeredBy, bool financed, uint256 timestamp)',
    'event InvoiceRegistered(bytes32 indexed hash, string invoiceNumber, address indexed registeredBy, uint256 timestamp)',
    'event InvoiceFinanced(bytes32 indexed hash, address indexed financedBy, uint256 timestamp)',
];

let provider = null;
let wallet = null;
let contract = null;

/**
 * Initialize blockchain connection. Called lazily on first use.
 */
const initBlockchain = () => {
    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    const privateKey = process.env.WALLET_PRIVATE_KEY;
    const contractAddress = process.env.INVOICE_REGISTRY_CONTRACT;

    if (!rpcUrl || !privateKey || !contractAddress) {
        console.warn('⚠️  Blockchain credentials not fully configured — on-chain features disabled');
        return false;
    }

    try {
        provider = new ethers.JsonRpcProvider(rpcUrl);
        wallet = new ethers.Wallet(privateKey, provider);
        contract = new ethers.Contract(contractAddress, CONTRACT_ABI, wallet);
        console.log('✅ Blockchain service initialized (Sepolia)');
        return true;
    } catch (error) {
        console.error('Blockchain init error:', error.message);
        return false;
    }
};

/**
 * Convert hex SHA-256 hash to bytes32 for the contract.
 */
const toBytes32 = (hexHash) => {
    return '0x' + hexHash;
};

/**
 * Register an invoice hash on the blockchain.
 * @param {string} fileHash - SHA-256 hex hash of the invoice file.
 * @param {string} invoiceNumber - Invoice identifier.
 * @returns {Promise<{ txHash: string } | null>}
 */
const registerInvoiceOnChain = async (fileHash, invoiceNumber) => {
    if (!contract && !initBlockchain()) {
        return null;
    }

    try {
        const hashBytes = toBytes32(fileHash);
        const tx = await contract.registerInvoice(hashBytes, invoiceNumber);
        const receipt = await tx.wait();

        console.log(`✅ Invoice registered on-chain: ${receipt.hash}`);
        return { txHash: receipt.hash };
    } catch (error) {
        console.error('Blockchain registerInvoice error:', error.message);
        throw new Error(`Blockchain registration failed: ${error.reason || error.message}`);
    }
};

/**
 * Mark an invoice as financed on the blockchain.
 * @param {string} fileHash - SHA-256 hex hash of the invoice file.
 * @returns {Promise<{ txHash: string } | null>}
 */
const markInvoiceFinancedOnChain = async (fileHash) => {
    if (!contract && !initBlockchain()) {
        return null;
    }

    try {
        const hashBytes = toBytes32(fileHash);
        const tx = await contract.markFinanced(hashBytes);
        const receipt = await tx.wait();

        console.log(`✅ Invoice marked financed on-chain: ${receipt.hash}`);
        return { txHash: receipt.hash };
    } catch (error) {
        console.error('Blockchain markFinanced error:', error.message);
        throw new Error(`Blockchain finance marking failed: ${error.reason || error.message}`);
    }
};

/**
 * Verify if an invoice hash is registered and/or financed on-chain.
 * @param {string} fileHash - SHA-256 hex hash.
 * @returns {Promise<{ registered: boolean, financed: boolean, details: object | null } | null>}
 */
const verifyInvoiceOnChain = async (fileHash) => {
    if (!contract && !initBlockchain()) {
        return null;
    }

    try {
        const hashBytes = toBytes32(fileHash);
        const registered = await contract.isRegistered(hashBytes);

        if (!registered) {
            return { registered: false, financed: false, details: null };
        }

        const financed = await contract.isFinanced(hashBytes);
        const details = await contract.getInvoice(hashBytes);

        return {
            registered: true,
            financed,
            details: {
                invoiceNumber: details.invoiceNumber,
                registeredBy: details.registeredBy,
                financed: details.financed,
                timestamp: Number(details.timestamp),
            },
        };
    } catch (error) {
        console.error('Blockchain verify error:', error.message);
        throw new Error(`Blockchain verification failed: ${error.message}`);
    }
};

module.exports = {
    registerInvoiceOnChain,
    markInvoiceFinancedOnChain,
    verifyInvoiceOnChain,
};
