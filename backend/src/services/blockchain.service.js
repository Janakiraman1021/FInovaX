const { ethers } = require('ethers');

// ABI for InvoiceRegistry contract (matches updated contract)
const CONTRACT_ABI = [
    'function registerInvoice(bytes32 invoiceHash, string invoiceId) external',
    'function financeInvoice(bytes32 invoiceHash) external',
    'function registerReceivable(bytes32 receivableFingerprint) external',
    'function financeReceivable(bytes32 receivableFingerprint) external',
    'function isRegistered(bytes32 invoiceHash) external view returns (bool)',
    'function isFinanced(bytes32 invoiceHash) external view returns (bool)',
    'function isReceivableFinanced(bytes32 receivableFingerprint) external view returns (bool)',
    'function getFinancier(bytes32 invoiceHash) external view returns (address)',
    'function getReceivableFinancier(bytes32 receivableFingerprint) external view returns (address)',
    'function authorizeLender(address lender) external',
    'function revokeLender(address lender) external',
    'event InvoiceRegistered(bytes32 indexed invoiceHash, string invoiceId, address indexed registeredBy, uint256 timestamp)',
    'event InvoiceFinanced(bytes32 indexed invoiceHash, address indexed lender, uint256 timestamp)',
    'event ReceivableRegistered(bytes32 indexed receivableFingerprint)',
    'event ReceivableFinanced(bytes32 indexed receivableFingerprint, address indexed lender)',
    'event DuplicateReceivableAttempt(bytes32 indexed receivableFingerprint, address indexed lender)',
    'event DuplicateFinancingAttempt(bytes32 indexed invoiceHash, address indexed attemptedBy, uint256 timestamp)',
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
 * Fetch live EIP-1559 fee data and apply a 30 % bump so the tx can always
 * replace any stuck pending transaction from this wallet.
 */
const getGasOverrides = async () => {
    const feeData = await provider.getFeeData();
    // Apply 30 % premium (use BigInt arithmetic)
    const bump = (val) => val != null ? val * 130n / 100n : undefined;
    const overrides = {};
    if (feeData.maxFeePerGas != null) {
        overrides.maxFeePerGas         = bump(feeData.maxFeePerGas);
        overrides.maxPriorityFeePerGas = bump(feeData.maxPriorityFeePerGas ?? feeData.maxFeePerGas / 10n);
    } else if (feeData.gasPrice != null) {
        // Legacy network fallback
        overrides.gasPrice = bump(feeData.gasPrice);
    }
    return overrides;
};

/**
 * Register an invoice hash on the blockchain.
 * @param {string} fileHash - SHA-256 hex hash of the invoice file.
 * @param {string} invoiceId - Invoice identifier (emitted in event only, not stored on-chain).
 * @returns {Promise<{ txHash: string } | null>}
 */
const registerInvoiceOnChain = async (fileHash, invoiceId) => {
    if (!contract && !initBlockchain()) {
        return null;
    }

    try {
        const hashBytes = toBytes32(fileHash);
        const overrides = await getGasOverrides();
        const tx = await contract.registerInvoice(hashBytes, invoiceId, overrides);
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
 * Contract emits DuplicateFinancingAttempt if already financed (does not revert).
 * @param {string} fileHash - SHA-256 hex hash of the invoice file.
 * @returns {Promise<{ txHash: string } | null>}
 */
const markInvoiceFinancedOnChain = async (fileHash) => {
    if (!contract && !initBlockchain()) {
        return null;
    }

    try {
        const hashBytes = toBytes32(fileHash);
        const overrides = await getGasOverrides();
        const tx = await contract.financeInvoice(hashBytes, overrides);
        const receipt = await tx.wait();

        console.log(`✅ Invoice marked financed on-chain: ${receipt.hash}`);
        return { txHash: receipt.hash };
    } catch (error) {
        console.error('Blockchain financeInvoice error:', error.message);
        throw new Error(`Blockchain finance marking failed: ${error.reason || error.message}`);
    }
};

/**
 * Verify if an invoice hash is registered and/or financed on-chain.
 * @param {string} fileHash - SHA-256 hex hash.
 * @returns {Promise<{ registered: boolean, financed: boolean, financier: string | null } | null>}
 */
const verifyInvoiceOnChain = async (fileHash) => {
    if (!contract && !initBlockchain()) {
        return null;
    }

    try {
        const hashBytes = toBytes32(fileHash);
        const isRegistered = await contract.isRegistered(hashBytes);

        if (!isRegistered) {
            return { registered: false, financed: false, financier: null };
        }

        const isFinanced = await contract.isFinanced(hashBytes);
        const financier = await contract.getFinancier(hashBytes);

        return {
            registered: true,
            financed: isFinanced,
            financier: financier === ethers.ZeroAddress ? null : financier,
        };
    } catch (error) {
        console.error('Blockchain verify error:', error.message);
        throw new Error(`Blockchain verification failed: ${error.message}`);
    }
};

/**
 * Register a receivable fingerprint on the blockchain.
 * @param {string} fingerprint - SHA-256 hex hash of receivable metadata.
 */
const registerReceivableOnChain = async (fingerprint) => {
    if (!contract && !initBlockchain()) {
        return null;
    }

    try {
        const hashBytes = toBytes32(fingerprint);
        const overrides = await getGasOverrides();
        const tx = await contract.registerReceivable(hashBytes, overrides);
        const receipt = await tx.wait();

        console.log(`✅ Receivable registered on-chain: ${receipt.hash}`);
        return { txHash: receipt.hash };
    } catch (error) {
        console.error('Blockchain registerReceivable error:', error.message);
        throw new Error(`Blockchain receivable registration failed: ${error.reason || error.message}`);
    }
};

/**
 * Verify if a receivable fingerprint is financed on-chain.
 */
const verifyReceivableOnChain = async (fingerprint) => {
    if (!contract && !initBlockchain()) {
        return null;
    }

    try {
        const hashBytes = toBytes32(fingerprint);
        const financed = await contract.isReceivableFinanced(hashBytes);
        const financier = await contract.getReceivableFinancier(hashBytes);

        return {
            financed,
            financier: (financier === ethers.ZeroAddress || !financier) ? null : financier,
        };
    } catch (error) {
        console.error('Blockchain receivable verify error:', error.message);
        throw new Error(`Blockchain receivable verification failed: ${error.message}`);
    }
};

/**
 * Mark a receivable as financed on the blockchain.
 * @param {string} fingerprint - SHA-256 hex hash of receivable metadata.
 */
const markReceivableFinancedOnChain = async (fingerprint) => {
    if (!contract && !initBlockchain()) {
        return null;
    }

    try {
        const hashBytes = toBytes32(fingerprint);
        const overrides = await getGasOverrides();
        const tx = await contract.financeReceivable(hashBytes, overrides);
        const receipt = await tx.wait();

        console.log(`✅ Receivable marked financed on-chain: ${receipt.hash}`);
        return { txHash: receipt.hash };
    } catch (error) {
        console.error('Blockchain financeReceivable error:', error.message);
        // Catch specific revert message for custom error handling in controller if needed
        throw new Error(`Blockchain receivable financing failed: ${error.reason || error.message}`);
    }
};

module.exports = {
    registerInvoiceOnChain,
    markInvoiceFinancedOnChain,
    verifyInvoiceOnChain,
    registerReceivableOnChain,
    markReceivableFinancedOnChain,
    verifyReceivableOnChain,
};
