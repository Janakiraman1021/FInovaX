const axios = require('axios');

const PINATA_BASE_URL = 'https://api.pinata.cloud';

/**
 * Upload a file buffer to IPFS via Pinata.
 * @param {Buffer} fileBuffer - The file content.
 * @param {string} fileName - Original filename.
 * @returns {Promise<{ cid: string, url: string }>}
 */
const uploadToIPFS = async (fileBuffer, fileName) => {
    const apiKey = process.env.PINATA_API_KEY;
    const secretKey = process.env.PINATA_SECRET_KEY;

    if (!apiKey || !secretKey) {
        console.warn('⚠️  IPFS (Pinata) credentials not configured — skipping upload');
        return { cid: null, url: null };
    }

    try {
        // Pinata expects multipart/form-data
        const FormData = (await import('form-data')).default || require('form-data');
        const formData = new FormData();

        formData.append('file', fileBuffer, {
            filename: fileName,
            contentType: 'application/pdf',
        });

        const metadata = JSON.stringify({ name: fileName });
        formData.append('pinataMetadata', metadata);

        const response = await axios.post(`${PINATA_BASE_URL}/pinning/pinFileToIPFS`, formData, {
            maxBodyLength: Infinity,
            headers: {
                ...formData.getHeaders(),
                pinata_api_key: apiKey,
                pinata_secret_api_key: secretKey,
            },
        });

        const cid = response.data.IpfsHash;
        return {
            cid,
            url: `https://gateway.pinata.cloud/ipfs/${cid}`,
        };
    } catch (error) {
        console.error('IPFS upload error:', error.response?.data || error.message);
        throw new Error(`IPFS upload failed: ${error.message}`);
    }
};

module.exports = { uploadToIPFS };
