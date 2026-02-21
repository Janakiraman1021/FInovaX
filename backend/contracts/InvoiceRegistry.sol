// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title InvoiceRegistry
 * @notice On-chain registry for invoice hash verification and financing audit trail.
 * @dev Deployed on Sepolia testnet for FinTrust platform.
 */
contract InvoiceRegistry {
    struct InvoiceRecord {
        string invoiceNumber;
        address registeredBy;
        bool financed;
        address financedBy;
        uint256 registeredAt;
        uint256 financedAt;
    }

    /// @notice Owner of the contract (deployer)
    address public owner;

    /// @notice Mapping from SHA-256 file hash (bytes32) to invoice record
    mapping(bytes32 => InvoiceRecord) public invoices;

    /// @notice Track registered hashes
    mapping(bytes32 => bool) public hashExists;

    // ─── Events ───────────────────────────────────────────────────────

    event InvoiceRegistered(
        bytes32 indexed hash,
        string invoiceNumber,
        address indexed registeredBy,
        uint256 timestamp
    );

    event InvoiceFinanced(
        bytes32 indexed hash,
        address indexed financedBy,
        uint256 timestamp
    );

    // ─── Modifiers ────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ─── Functions ────────────────────────────────────────────────────

    /**
     * @notice Register a new invoice hash on-chain.
     * @param hash SHA-256 hash of the invoice file (as bytes32).
     * @param invoiceNumber Human-readable invoice identifier.
     */
    function registerInvoice(bytes32 hash, string calldata invoiceNumber) external {
        require(!hashExists[hash], "Invoice hash already registered");
        require(bytes(invoiceNumber).length > 0, "Invoice number cannot be empty");

        invoices[hash] = InvoiceRecord({
            invoiceNumber: invoiceNumber,
            registeredBy: msg.sender,
            financed: false,
            financedBy: address(0),
            registeredAt: block.timestamp,
            financedAt: 0
        });

        hashExists[hash] = true;

        emit InvoiceRegistered(hash, invoiceNumber, msg.sender, block.timestamp);
    }

    /**
     * @notice Mark an invoice as financed. Prevents duplicate financing.
     * @param hash SHA-256 hash of the invoice file (as bytes32).
     */
    function markFinanced(bytes32 hash) external {
        require(hashExists[hash], "Invoice hash not registered");
        require(!invoices[hash].financed, "Invoice already financed");

        invoices[hash].financed = true;
        invoices[hash].financedBy = msg.sender;
        invoices[hash].financedAt = block.timestamp;

        emit InvoiceFinanced(hash, msg.sender, block.timestamp);
    }

    /**
     * @notice Check if an invoice hash is registered.
     * @param hash SHA-256 hash to check.
     * @return bool True if the hash is registered.
     */
    function isRegistered(bytes32 hash) external view returns (bool) {
        return hashExists[hash];
    }

    /**
     * @notice Check if a registered invoice has been financed.
     * @param hash SHA-256 hash to check.
     * @return bool True if the invoice is financed.
     */
    function isFinanced(bytes32 hash) external view returns (bool) {
        require(hashExists[hash], "Invoice hash not registered");
        return invoices[hash].financed;
    }

    /**
     * @notice Get full invoice record by hash.
     * @param hash SHA-256 hash of the invoice.
     * @return invoiceNumber The human-readable invoice identifier.
     * @return registeredBy Address that registered the invoice.
     * @return financed Whether the invoice has been financed.
     * @return timestamp Registration timestamp.
     */
    function getInvoice(bytes32 hash)
        external
        view
        returns (
            string memory invoiceNumber,
            address registeredBy,
            bool financed,
            uint256 timestamp
        )
    {
        require(hashExists[hash], "Invoice hash not registered");
        InvoiceRecord memory record = invoices[hash];
        return (record.invoiceNumber, record.registeredBy, record.financed, record.registeredAt);
    }
}
