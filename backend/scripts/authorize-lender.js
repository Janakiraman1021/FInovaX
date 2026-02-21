const { ethers } = require('ethers');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the parent directory's .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

const CONTRACT_ABI = [
    'function authorizeLender(address lender) external',
    'function authorizedLenders(address) public view returns (bool)',
    'function owner() public view returns (address)'
];

async function main() {
    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    const privateKey = process.env.WALLET_PRIVATE_KEY;
    const contractAddress = process.env.INVOICE_REGISTRY_CONTRACT;

    if (!rpcUrl || !privateKey || !contractAddress) {
        console.error('❌ Error: Missing configuration in .env file.');
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, wallet);

    const walletAddress = await wallet.getAddress();
    console.log(`🔗 Connected to Sepolia. Wallet address: ${walletAddress}`);
    console.log(`📄 Target Contract: ${contractAddress}`);

    try {
        // 1. Check if already authorized
        const isAuthorized = await contract.authorizedLenders(walletAddress);
        if (isAuthorized) {
            console.log('✅ Success: This wallet is ALREADY an authorized lender.');
            return;
        }

        // 2. Verify we are the owner
        const contractOwner = await contract.owner();
        console.log(`👤 Contract Owner: ${contractOwner}`);

        if (contractOwner.toLowerCase() !== walletAddress.toLowerCase()) {
            console.error('❌ Error: This wallet is NOT the contract owner. Only the owner can authorize lenders.');
            process.exit(1);
        }

        // 3. Execute Authorization
        console.log('🚀 Sending authorization transaction...');
        const tx = await contract.authorizeLender(walletAddress);
        console.log(`⏳ Waiting for confirmation (TX: ${tx.hash})...`);

        const receipt = await tx.wait();
        console.log('✅ Transaction Confirmed!');
        console.log(`✔️ Wallet ${walletAddress} is now an authorized lender in the InvoiceRegistry.`);

    } catch (error) {
        console.error('❌ Blockchain error:', error.reason || error.message);
        process.exit(1);
    }
}

main();
