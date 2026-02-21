// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title InvoiceRegistry
 * @notice On-chain trust and audit layer for invoice financing on FinTrust.
 * @dev Deployed on Sepolia testnet. No invoice data is stored on-chain —
 *      only hashes and flags for verification. All detail lives off-chain.
 */
contract InvoiceRegistry {
    // ─── State ────────────────────────────────────────────────────────

    /// @notice Contract owner (deployer)
    address public owner;

    /// @notice Whether an invoiceHash has been registered
    mapping(bytes32 => bool) public registered;

    /// @notice Whether a registered invoiceHash has been financed
    mapping(bytes32 => bool) public financed;

    /// @notice The lender address that financed a given invoiceHash
    mapping(bytes32 => address) public financedBy;

    /// @notice Addresses authorised to call financeInvoice
    mapping(address => bool) public authorizedLenders;

    /// @notice Whether a receivableFingerprint has been financed
    mapping(bytes32 => bool) public isReceivableFinanced;

    /// @notice The lender address that financed a given receivableFingerprint (optional metadata)
    mapping(bytes32 => address) public receivableFinancedBy;

    // ─── Events (immutable audit trail) ───────────────────────────────

    event InvoiceRegistered(
        bytes32 indexed invoiceHash,
        string invoiceId,
        address indexed registeredBy,
        uint256 timestamp
    );

    event InvoiceFinanced(
        bytes32 indexed invoiceHash,
        address indexed lender,
        uint256 timestamp
    );

    event ReceivableRegistered(bytes32 indexed receivableFingerprint);
    
    event ReceivableFinanced(
        bytes32 indexed receivableFingerprint, 
        address indexed lender
    );
    
    event DuplicateReceivableAttempt(
        bytes32 indexed receivableFingerprint, 
        address indexed lender
    );

    event DuplicateFinancingAttempt(
        bytes32 indexed invoiceHash,
        address indexed attemptedBy,
        uint256 timestamp
    );

    event LenderAuthorized(address indexed lender);
    event LenderRevoked(address indexed lender);

    // ─── Modifiers ────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    modifier onlyAuthorizedLender() {
        require(authorizedLenders[msg.sender], "Caller is not an authorized lender");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ─── Admin Functions ──────────────────────────────────────────────

    /**
     * @notice Authorize an address to finance invoices.
     * @param lender The lender wallet address.
     */
    function authorizeLender(address lender) external onlyOwner {
        require(lender != address(0), "Invalid lender address");
        authorizedLenders[lender] = true;
        emit LenderAuthorized(lender);
    }

    /**
     * @notice Revoke a lender's authorization.
     * @param lender The lender wallet address.
     */
    function revokeLender(address lender) external onlyOwner {
        authorizedLenders[lender] = false;
        emit LenderRevoked(lender);
    }

    // ─── Core Functions ───────────────────────────────────────────────

    /**
     * @notice Register an invoice hash on-chain. Reverts on duplicate.
     * @param invoiceHash SHA-256 hash of the invoice file (bytes32).
     * @param invoiceId   Human-readable invoice identifier (emitted in event only, NOT stored).
     */
    function registerInvoice(bytes32 invoiceHash, string calldata invoiceId) external {
        require(!registered[invoiceHash], "Invoice hash already registered");
        require(bytes(invoiceId).length > 0, "Invoice ID cannot be empty");

        registered[invoiceHash] = true;

        emit InvoiceRegistered(invoiceHash, invoiceId, msg.sender, block.timestamp);
    }

    /**
     * @notice Mark an invoice as financed. Only callable by authorized lenders.
     *         Emits DuplicateFinancingAttempt (instead of reverting) if already financed.
     * @param invoiceHash SHA-256 hash of the invoice file (bytes32).
     */
    function financeInvoice(bytes32 invoiceHash) external onlyAuthorizedLender {
        require(registered[invoiceHash], "Invoice hash not registered");

        // Duplicate financing guard — emit event and return instead of reverting
        if (financed[invoiceHash]) {
            emit DuplicateFinancingAttempt(invoiceHash, msg.sender, block.timestamp);
            return;
        }

        financed[invoiceHash] = true;
        financedBy[invoiceHash] = msg.sender;

        emit InvoiceFinanced(invoiceHash, msg.sender, block.timestamp);
    }

    /**
     * @notice Register a receivable fingerprint (audit-only).
     * @param receivableFingerprint SHA-256 hash of normalized receivable metadata.
     */
    function registerReceivable(bytes32 receivableFingerprint) external {
        emit ReceivableRegistered(receivableFingerprint);
    }

    /**
     * @notice Mark a receivable as financed. Enforces one-financing-per-receivable.
     * @param receivableFingerprint SHA-256 hash of normalized receivable metadata.
     */
    function financeReceivable(bytes32 receivableFingerprint) external onlyAuthorizedLender {
        if (isReceivableFinanced[receivableFingerprint]) {
            emit DuplicateReceivableAttempt(receivableFingerprint, msg.sender);
            revert("RECEIVABLE_ALREADY_FINANCED");
        }

        isReceivableFinanced[receivableFingerprint] = true;
        receivableFinancedBy[receivableFingerprint] = msg.sender;

        emit ReceivableFinanced(receivableFingerprint, msg.sender);
    }

    // ─── View Functions ───────────────────────────────────────────────

    /**
     * @notice Check if an invoice hash is registered.
     */
    function isRegistered(bytes32 invoiceHash) external view returns (bool) {
        return registered[invoiceHash];
    }

    /**
     * @notice Check if a registered invoice has been financed.
     */
    function isFinanced(bytes32 invoiceHash) external view returns (bool) {
        return financed[invoiceHash];
    }

    /**
     * @notice Get the lender address that financed an invoice.
     * @return lender Address of the financing lender (address(0) if not financed).
     */
    function getFinancier(bytes32 invoiceHash) external view returns (address lender) {
        return financedBy[invoiceHash];
    }

    /**
     * @notice Get the lender address that financed a receivable.
     */
    function getReceivableFinancier(bytes32 receivableFingerprint) external view returns (address lender) {
        return receivableFinancedBy[receivableFingerprint];
    }
}
