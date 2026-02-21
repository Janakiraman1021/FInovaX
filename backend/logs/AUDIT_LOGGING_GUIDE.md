# Backend Audit Logging System

## Overview
This document describes the comprehensive audit logging system implemented across the FInovaX backend. Every significant event is logged to the `AuditLog` collection in MongoDB.

## Event Types & Locations

### 1. User Events

#### `user_registered`
- **Location**: `auth.controller.js` (register function)
- **Triggered**: When a new user account is created
- **Logged Data**: role, email, IP address

#### `user_login`
- **Location**: `auth.controller.js` (login function)
- **Triggered**: When a user successfully logs in
- **Logged Data**: email, IP address

---

### 2. Invoice Lifecycle Events

#### `invoice_uploaded`
- **Location**: `invoice.controller.js` (createInvoice function)
- **Triggered**: When MSME uploads a new invoice
- **Logged Data**: invoiceId, invoiceHash, receivableFingerprint, ipfsCID, lender selection status

#### `invoice_submitted`
- **Location**: `invoice.controller.js` (submitInvoice function)
- **Triggered**: When MSME submits an existing invoice to a lender
- **Logged Data**: invoiceId, receivableFingerprint, lenderId, lender organization

#### `invoice_submitted_to_additional_lender`
- **Location**: `invoice.controller.js` (createInvoice function)
- **Triggered**: When uploading same receivable to different lender
- **Logged Data**: invoiceId, receivableFingerprint, reuse status

#### `invoice_verified`
- **Location**: `lender.controller.js` (verifyInvoice function)
- **Triggered**: When lender verifies an invoice
- **Logged Data**: invoiceId, receivableFingerprint, blockchain status, canFinance flag

#### `invoice_financed`
- **Location**: `lender.controller.js` (financeInvoice function)
- **Triggered**: When lender successfully finances an invoice
- **Logged Data**: invoiceId, receivableFingerprint, amount, blockchain tx hash

#### `invoice_registered_on_chain`
- **Location**: `blockchain.controller.js` (registerInvoice function)
- **Triggered**: When invoice is explicitly registered on blockchain
- **Logged Data**: invoiceId, invoiceHash, blockchain tx hash

---

### 3. Blockchain Event Monitoring

#### `InvoiceRegistered`
- **Location**: `eventListener.service.js`
- **Triggered**: Blockchain event when invoice hash is registered on-chain
- **Logged Data**: invoiceHash, actor address, blockchain timestamp, tx hash

#### `InvoiceFinanced`
- **Location**: `eventListener.service.js`
- **Triggered**: Blockchain event when invoice is marked as financed
- **Logged Data**: invoiceHash, lender address, blockchain timestamp, tx hash

#### `DuplicateFinancingAttempt`
- **Location**: `eventListener.service.js`
- **Triggered**: Blockchain event when duplicate financing is attempted
- **Logged Data**: invoiceHash, actor address, blockchain timestamp, tx hash

---

### 4. Receivable Tracking Events

#### `RECEIVABLE_REGISTERED`
- **Location**: `invoice.controller.js` (createInvoice function)
- **Triggered**: When a new receivable fingerprint is created
- **Logged Data**: receivableFingerprint

#### `RECEIVABLE_VERIFIED`
- **Location**: `lender.controller.js` (verifyInvoice function)
- **Triggered**: When lender verifies a receivable's blockchain status
- **Logged Data**: receivableFingerprint, financing status, canFinance flag

#### `RECEIVABLE_FINANCED`
- **Location**: `eventListener.service.js`
- **Triggered**: Blockchain event when receivable is financed
- **Logged Data**: receivableFingerprint, lender address, affected invoice IDs

#### `RECEIVABLE_BLOCKED`
- **Location**: `lender.controller.js` (financeInvoice function)
- **Triggered**: When receivable is blocked due to duplicate financing attempt
- **Logged Data**: receivableFingerprint, reason, attempted by, blockchain error

---

### 5. Security & Fraud Detection Events

#### `finance_blocked_duplicate`
- **Location**: `lender.controller.js` (financeInvoice function)
- **Triggered**: When lender attempts to finance already-financed receivable
- **Logged Data**: invoiceId, receivableFingerprint, reason, blockchain error

#### `DUPLICATE_RECEIVABLE_FINANCING_ATTEMPT`
- **Location**: `eventListener.service.js`
- **Triggered**: Blockchain event detecting duplicate receivable financing
- **Logged Data**: receivableFingerprint, actor address, blockchain timestamp

#### `DUPLICATE_FINANCING_ATTEMPT`
- **Location**: `lender.controller.js` (duplicate detection logic)
- **Triggered**: Legacy event for duplicate attempts
- **Logged Data**: invoiceId, receivableFingerprint, detection reason

#### `DUPLICATE_ATTEMPT`
- **Location**: Various controllers via `trust.service.js`
- **Triggered**: General duplicate attempt tracking for trust scoring
- **Logged Data**: context-specific duplicate attempt details

---

### 6. Trust & Assurance Events

#### Assurance Report Events
- **Location**: `assurance.controller.js`
- Events logged when MSMEs submit usage reports and lenders acknowledge them
- Tracked separately but integrated with trust score system

---

## Storage & Access

### Database Collection
- **Collection Name**: `auditlogs`
- **Model**: `AuditLog.js`
- **Retention**: Permanent (consider implementing archival policy)

### Indexed Fields
- `eventType` - Fast filtering by event type
- `performedBy` - Find all actions by specific user
- `actorAddress` - Track blockchain address activities
- `receivableFingerprint` - Track receivable lifecycle
- `invoiceId` - Track invoice lifecycle
- `createdAt` - Chronological queries
- `requestId` - Trace related operations

### Schema Fields
```javascript
{
    eventType: String (enum),
    performedBy: ObjectId (User reference),
    actorAddress: String (blockchain address),
    receivableFingerprint: String,
    invoiceId: ObjectId (Invoice reference),
    txHash: String (blockchain transaction),
    details: Mixed (flexible event-specific data),
    ipAddress: String,
    requestId: String (trace related requests),
    createdAt: Date (auto),
    updatedAt: Date (auto)
}
```

## API Access

### Audit Trail Endpoint
- **Route**: `/api/v1/audit/*`
- **Controller**: `audit.controller.js`
- **Access**: Role-based (auditor, admin)

---

## Event Listener Service

### Blockchain Monitoring
- **Service**: `eventListener.service.js`
- **Provider**: Sepolia testnet via Infura
- **Events Monitored**: 
  - InvoiceRegistered
  - InvoiceFinanced
  - ReceivableFinanced
  - DuplicateFinancingAttempt
  - DuplicateReceivableFinancingAttempt

### Configuration
- Enable/disable: `ENABLE_EVENT_LISTENERS` env variable
- RPC URL: `SEPOLIA_RPC_URL`
- Contract: `INVOICE_REGISTRY_CONTRACT`

---

## Best Practices

### When to Log
✅ **Always Log:**
- Authentication events (login, register)
- State changes (upload, submit, finance, block)
- Blockchain interactions
- Security events (duplicates, fraud detection)
- Verification activities

❌ **Don't Log:**
- Read-only operations (GET requests)
- Sensitive data (passwords, private keys)
- High-frequency health checks

### Logging Format
```javascript
await createAuditLog({
    action: 'event_name',           // Use snake_case for app events, PascalCase for blockchain
    performedBy: req.user.id,       // MongoDB User ID (or null for blockchain events)
    actorAddress: '0x...',          // Blockchain address (for on-chain events)
    invoiceId: invoice._id,         // Related invoice
    receivableFingerprint: 'hash',  // Related receivable
    txHash: '0x...',                // Blockchain transaction
    details: { ... },               // Event-specific details
    ipAddress: req.ip,              // Client IP
    requestId: req.requestId,       // Trace ID
});
```

---

## Monitoring & Alerts

### Key Metrics to Monitor
1. **Duplicate Attempts**: Spike in `finance_blocked_duplicate` or `DUPLICATE_ATTEMPT`
2. **Blockchain Failures**: High rate of blockchain errors
3. **Unusual Activity**: Multiple failed verifications from same user
4. **Performance**: Audit log write latency

### Alert Thresholds
- More than 3 duplicate attempts by same user in 1 hour → Flag for review
- Blockchain event listener disconnected → Immediate alert
- Audit log write failures > 1% → Investigate database issues

---

## Compliance & Regulatory

### Data Retention
- **Production**: 7 years (financial regulations)
- **Development**: 90 days

### GDPR Considerations
- User IDs are retained for audit purposes
- IP addresses stored for security
- Right to erasure: Anonymize (don't delete) audit logs
- Export: Provide filtered audit trail on request

---

## Future Enhancements

### Planned Features
1. **Real-time Dashboard**: WebSocket feed of critical events
2. **ML Fraud Detection**: Pattern analysis on audit logs
3. **Compliance Reports**: Automated generation for regulators
4. **Event Replay**: Reconstruct system state from audit trail
5. **Blockchain Sync**: Verify audit log integrity using blockchain anchors

---

## Testing

### Verify Logging
```bash
# Check recent events
db.auditlogs.find().sort({createdAt: -1}).limit(10)

# Count events by type
db.auditlogs.aggregate([
    {$group: {_id: "$eventType", count: {$sum: 1}}},
    {$sort: {count: -1}}
])

# Find all events for specific receivable
db.auditlogs.find({receivableFingerprint: "abc123..."})

# Trace request flow
db.auditlogs.find({requestId: "req_xyz..."}).sort({createdAt: 1})
```

---

## Support & Troubleshooting

### Common Issues

**Issue**: Audit logs not appearing
- Check: `createAuditLog` errors in server logs
- Verify: MongoDB connection is stable
- Ensure: Event type is in allowed enum

**Issue**: Blockchain events missing
- Check: `ENABLE_EVENT_LISTENERS=true`
- Verify: Infura RPC URL is valid
- Monitor: Rate limit warnings

**Issue**: High disk usage
- Implement: Log rotation/archival
- Review: Audit log retention policy
- Consider: Separate audit database

---

## Summary

**Total Event Types**: 20+ distinct events
**Coverage**: 100% of critical operations
**Storage**: MongoDB with indexed queries
**Performance**: Async logging (non-blocking)
**Reliability**: Failure-safe (logs errors, never crashes app)
