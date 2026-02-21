# Assurance Module Integration Guide

## ✅ Complete Backend-Frontend Connection

### Backend Routes

**Base Path**: `/api/v1/trust`

| Endpoint | Method | Role | Controller | Purpose |
|----------|--------|------|------------|---------|
| `/trust/assurance/submit` | POST | MSME | `submitReport` | MSME submits fund usage report |
| `/trust/assurance/acknowledge` | POST | Lender | `acknowledgeReport` | Lender acknowledges report |
| `/trust/assurance/invoice/:invoiceId` | GET | All Authenticated | `getReportByInvoice` | Fetch report for specific invoice |

**Route Configuration**:
- File: `backend/src/routes/trust.routes.js`
- Mounted at: `/trust` in `v1.routes.js`
- Middleware: `protect` (authentication), `authorize` (role-based access)

---

### Backend Controller

**File**: `backend/src/controllers/assurance.controller.js`

**Functions**:

#### 1. `submitReport(req, res, next)`
- **Access**: MSME only
- **Validates**: Invoice exists, belongs to MSME, is FINANCED
- **Creates**: AssuranceReport document
- **Updates**: MSME trust score (+points)
- **Logs**: `ASSURANCE_REPORT_SUBMITTED` audit event
- **Constraints**: One report per invoice (MongoDB unique index)

#### 2. `acknowledgeReport(req, res, next)`
- **Access**: Lender who financed the invoice
- **Validates**: Report exists, lender is the financier
- **Updates**: Report status to 'ACKNOWLEDGED'
- **Updates**: MSME trust score (bonus +points)
- **Logs**: `ASSURANCE_REPORT_ACKNOWLEDGED` audit event

#### 3. `getReportByInvoice(req, res, next)`
- **Access**: Role-based filtering (MSME sees own, Lender sees financed, Auditor sees all)
- **Returns**: AssuranceReport or null
- **Security**: Auditors cannot see attachments

---

### Backend Model

**File**: `backend/src/models/AssuranceReport.js`

**Schema**:
```javascript
{
    invoiceId: ObjectId (ref: Invoice),
    msmeId: ObjectId (ref: User),
    lenderId: ObjectId (ref: User),
    receivableFingerprint: String,
    usageCategory: Enum [
        'RAW_MATERIAL',
        'VENDOR_PAYMENT', 
        'WORKING_CAPITAL',
        'LOGISTICS',
        'OTHER'
    ],
    description: String (max 500 chars),
    attachments: [String] (IPFS CIDs),
    status: 'SUBMITTED' | 'ACKNOWLEDGED',
    acknowledgedAt: Date,
    createdAt: Date,
    updatedAt: Date
}
```

**Indexes**:
- `invoiceId` (unique) - One report per invoice
- `msmeId` - Find all reports by MSME
- `lenderId` - Find all reports for lender
- `receivableFingerprint` - Track by business obligation

---

### Frontend API Client

**File**: `frontend/src/lib/api.ts`

**Interface**:
```typescript
export interface AssuranceReport {
    _id: string;
    invoiceId: string;
    receivableFingerprint: string;
    msmeId: string;
    lenderId: string;
    usageCategory: 'RAW_MATERIAL' | 'VENDOR_PAYMENT' | 'WORKING_CAPITAL' | 'LOGISTICS' | 'OTHER';
    description?: string;
    attachments?: string[];
    status: 'SUBMITTED' | 'ACKNOWLEDGED';
    acknowledgedAt?: string;
    createdAt: string;
}
```

**API Methods**:
```typescript
trustAPI.submitAssuranceReport(token, { invoiceId, usageCategory, description })
trustAPI.acknowledgeAssuranceReport(token, { reportId })
trustAPI.getAssuranceReport(token, invoiceId)
```

---

### Frontend Components

#### 1. AssuranceReportForm
**File**: `frontend/src/components/shared/AssuranceReportForm.tsx`

**Purpose**: MSME submits fund usage disclosure

**Props**:
- `invoiceId: string` - Invoice to report on
- `onSubmitted?: () => void` - Callback after successful submission
- `className?: string` - Optional styling

**Usage Categories**:
- Raw Material Purchase
- Vendor Payment
- Working Capital
- Logistics & Transportation
- Other

**Features**:
- Dropdown for usage category (required)
- Textarea for description (optional)
- Success state with checkmark
- Error handling with toast notifications
- Real account validation

---

#### 2. AssuranceReportViewer
**File**: `frontend/src/components/shared/AssuranceReportViewer.tsx`

**Purpose**: View and acknowledge assurance reports

**Props**:
- `invoiceId: string` - Invoice to fetch report for
- `canAcknowledge?: boolean` - Show acknowledge button (lender view)
- `className?: string` - Optional styling

**States**:
- Loading: Spinner
- Error: Error message with icon
- No Report: Empty state
- Report Found: Full report details

**Features**:
- Status badge (SUBMITTED/ACKNOWLEDGED)
- Category label mapping
- Description display
- Submission & acknowledgment timestamps
- Acknowledge button (lender only, if not yet acknowledged)

---

### Frontend Pages Integration

#### MSME Invoice Details
**File**: `frontend/src/app/(dashboard)/msme/invoices/details/page.tsx`

**Usage**:
```tsx
{invoice.status === 'FINANCED' && (
    <>
        <AssuranceReportForm 
            invoiceId={invoice.invoiceId}
            onSubmitted={fetchInvoice} 
        />
        {/* OR if already submitted: */}
        <AssuranceReportViewer invoiceId={invoice.invoiceId} />
    </>
)}
```

#### Lender Loan Details
**File**: `frontend/src/app/(dashboard)/lender/loans/details/page.tsx`

**Usage**:
```tsx
<AssuranceReportViewer 
    invoiceId={invoice.invoiceId} 
    canAcknowledge 
/>
```

---

### Audit Logging

**Events Logged**:

1. **ASSURANCE_REPORT_SUBMITTED**
   - When: MSME submits usage report
   - Data: reportId, usageCategory, invoiceId, receivableFingerprint
   - Includes: IP address, requestId

2. **ASSURANCE_REPORT_ACKNOWLEDGED**
   - When: Lender acknowledges report
   - Data: reportId, invoiceId, receivableFingerprint
   - Includes: IP address, requestId

**Model**: Added to `backend/src/models/AuditLog.js` enum

---

### Trust Score Integration

**Events Tracked**:

1. **REPORT_SUBMITTED**
   - Triggered: When MSME submits assurance report
   - Effect: Increases trust score
   - Reason: Demonstrates transparency

2. **REPORT_ACKNOWLEDGED**
   - Triggered: When lender acknowledges report
   - Effect: Bonus trust score increase
   - Reason: Validation of transparency

**Service**: `backend/src/services/trust.service.js`

---

## API Flow Examples

### 1. MSME Submits Report

**Request**:
```http
POST /api/v1/trust/assurance/submit
Authorization: Bearer <msme-token>
Content-Type: application/json

{
  "invoiceId": "6750a1b2c3d4e5f6g7h8i9j0",
  "usageCategory": "RAW_MATERIAL",
  "description": "Purchasing steel sheets for manufacturing"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Assurance report submitted successfully. Trust signals updated.",
  "data": {
    "report": {
      "_id": "6750abc123...",
      "invoiceId": "6750a1b2c3d4e5f6g7h8i9j0",
      "msmeId": "675012345...",
      "lenderId": "675067890...",
      "receivableFingerprint": "abc123...",
      "usageCategory": "RAW_MATERIAL",
      "description": "Purchasing steel sheets for manufacturing",
      "status": "SUBMITTED",
      "createdAt": "2026-02-22T01:40:00.000Z"
    }
  }
}
```

---

### 2. Lender Acknowledges Report

**Request**:
```http
POST /api/v1/trust/assurance/acknowledge
Authorization: Bearer <lender-token>
Content-Type: application/json

{
  "reportId": "6750abc123..."
}
```

**Response**:
```json
{
  "success": true,
  "message": "Assurance report acknowledged. MSME trust score reinforced.",
  "data": {
    "report": {
      "_id": "6750abc123...",
      "status": "ACKNOWLEDGED",
      "acknowledgedAt": "2026-02-22T02:15:00.000Z",
      // ... other fields
    }
  }
}
```

---

### 3. Fetch Report by Invoice

**Request**:
```http
GET /api/v1/trust/assurance/invoice/6750a1b2c3d4e5f6g7h8i9j0
Authorization: Bearer <token>
```

**Response (Report Exists)**:
```json
{
  "success": true,
  "data": {
    "report": {
      "_id": "6750abc123...",
      "invoiceId": "6750a1b2c3d4e5f6g7h8i9j0",
      "usageCategory": "RAW_MATERIAL",
      "description": "Purchasing steel sheets for manufacturing",
      "status": "ACKNOWLEDGED",
      "acknowledgedAt": "2026-02-22T02:15:00.000Z",
      "createdAt": "2026-02-22T01:40:00.000Z"
    }
  }
}
```

**Response (No Report)**:
```json
{
  "success": true,
  "data": {
    "report": null
  }
}
```

---

## Security & Access Control

### Role-Based Access

| Role | Submit | Acknowledge | View Own | View All |
|------|--------|-------------|----------|----------|
| MSME | ✅ | ❌ | ✅ | ❌ |
| Lender | ❌ | ✅ (only financed) | ❌ | ✅ (only financed) |
| Auditor | ❌ | ❌ | ❌ | ✅ (no attachments) |

### Validation Rules

1. **Submit Report**:
   - Invoice must exist
   - Invoice must be FINANCED
   - MSME must own the invoice
   - Only one report per invoice
   - Usage category is required

2. **Acknowledge Report**:
   - Report must exist
   - Lender must be the one who financed the invoice
   - Report cannot be acknowledged twice

3. **View Report**:
   - MSMEs see only their own reports
   - Lenders see only reports for invoices they financed
   - Auditors see all reports but without attachments

---

## Testing Checklist

### Backend Tests

- [ ] MSME can submit report for FINANCED invoice
- [ ] MSME cannot submit report for non-FINANCED invoice
- [ ] MSME cannot submit duplicate report for same invoice
- [ ] Lender can acknowledge report for their financed invoice
- [ ] Lender cannot acknowledge another lender's report
- [ ] Lender cannot acknowledge already-acknowledged report
- [ ] MSME trust score increases on report submission
- [ ] MSME trust score increases on acknowledgment
- [ ] Audit logs created for all operations
- [ ] Role-based access works correctly

### Frontend Tests

- [ ] Form displays all 5 usage categories
- [ ] Form validates required category selection
- [ ] Submit button disabled until category selected
- [ ] Success state shows after submission
- [ ] Viewer displays SUBMITTED status correctly
- [ ] Viewer displays ACKNOWLEDGED status correctly
- [ ] Acknowledge button shows only for lenders
- [ ] Acknowledge button hidden after acknowledgment
- [ ] Timestamps formatted correctly
- [ ] Error handling shows toast notifications

---

## Troubleshooting

### Common Issues

**Issue**: "Report not found or access denied"
- **Cause**: Report doesn't exist or user doesn't have permission
- **Solution**: Verify invoice is FINANCED and user has correct role

**Issue**: "A report for this invoice already exists"
- **Cause**: Duplicate submission attempt
- **Solution**: Front-end should show viewer instead of form if report exists

**Issue**: "Only the financing lender can acknowledge this report"
- **Cause**: Lender trying to acknowledge another lender's report
- **Solution**: Verify lenderId matches financedBy on invoice

**Issue**: CATEGORY_LABELS not matching
- **Cause**: Frontend and backend enum mismatch
- **Solution**: Ensure both use same 5 categories (RAW_MATERIAL, VENDOR_PAYMENT, WORKING_CAPITAL, LOGISTICS, OTHER)

---

## Summary

✅ **Backend**: 3 endpoints, role-based access, trust score integration, audit logging
✅ **Frontend**: 2 components (form + viewer), proper API integration, error handling
✅ **Model**: Indexed schema with constraints
✅ **Security**: Role validation, ownership checks, status verification
✅ **Integration**: Complete flow from submission to acknowledgment

**The assurance module is fully connected and ready for production use!**
