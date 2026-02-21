# FinTrust API Reference & Checklist

This document is a comprehensive guide to every endpoint available in the FinTrust project. It integrates versioned (`/api/v1`) and legacy routes as mounted in [app.js](file:///d:/finovax/src/app.js).

---

## 🔐 1. Authentication Module (`/api/v1/auth`)

- [ ] **POST /register** — Register a new user.
  - **Body (Raw JSON)**:
    ```json
    {
      "name": "Arjun Sharma",
      "email": "arjun@msme-corp.com",
      "password": "Password123!",
      "role": "msme",
      "organization": "Sharma Industrial Exports"
    }
    ```
- [ ] **POST /login** — Obtain access token.
  - **Body (Raw JSON)**:
    ```json
    {
      "email": "arjun@msme-corp.com",
      "password": "Password123!"
    }
    ```
- [ ] **GET /me** — Get authenticated user details.
  - **Auth**: `Bearer {{TOKEN}}`
- [ ] **PATCH /me** — Update user profile.
  - **Auth**: `Bearer {{TOKEN}}`
  - **Body (Raw JSON)**:
    ```json
    {
      "name": "Arjun S. Sharma",
      "organization": "Sharma Industrial Tier-1"
    }
    ```
- [ ] **GET /lenders** — Discovery of lenders (MSME only).
  - **Auth**: `Bearer {{MSME_TOKEN}}`

---

## 🏢 2. MSME Profile Module (`/api/msme-profile`)

- [ ] **GET /** — Get current MSME profile.
  - **Auth**: `Bearer {{MSME_TOKEN}}`
- [ ] **POST /** — Create or full update of MSME profile.
  - **Auth**: `Bearer {{MSME_TOKEN}}`
  - **Body (Raw JSON)**:
    ```json
    {
      "companyName": "Sharma Industrial Exports Ltd",
      "contactPerson": "Arjun Sharma",
      "email": "arjun@msme-corp.com",
      "phone": "+91-9876543210",
      "address": "123 Industrial Hub, Mumbai, Maharashtra, 400001"
    }
    ```
- [ ] **PATCH /field** — Update specific field in profile.
  - **Auth**: `Bearer {{MSME_TOKEN}}`
  - **Body (Raw JSON)**:
    ```json
    {
      "field": "address",
      "value": "456 Export Zone, Navi Mumbai"
    }
    ```
- [ ] **DELETE /** — Remove MSME profile.
  - **Auth**: `Bearer {{MSME_TOKEN}}`

---

## 📄 3. Invoice Management (`/api/v1/invoices`)

- [ ] **POST /upload** — Upload and anchor invoice (MSME only).
  - **Auth**: `Bearer {{MSME_TOKEN}}`
  - **Body (form-data)**:
    | Key | Value |
    | :--- | :--- |
    | [file](file:///d:/finovax/backend/src/controllers/invoice.controller.js#15-23) | `invoice_sample.pdf` |
    | `amount` | `75000` |
    | `sellerGSTIN` | `27AAAAA0000A1Z5` |
    | `buyerGSTIN` | `27BBBBB0000B1Z5` |
    | `poReference` | `PO-888-IND` |
    | `invoiceDate` | `2024-02-21` |
    | `submittedTo` | `{{LENDER_ID}}` |
- [ ] **GET /my** — List own invoices with masked lender info.
  - **Auth**: `Bearer {{MSME_TOKEN}}`

---

## 🏦 4. Lender Operations (`/api/v1/lender`)

- [ ] **GET /invoices** — List invoices submitted to this lender.
  - **Auth**: `Bearer {{LENDER_TOKEN}}`
- [ ] **GET /verify/:invoiceId** — Verification (Trust data only).
  - **Auth**: `Bearer {{LENDER_TOKEN}}`
- [ ] **POST /finance/:invoiceId** — Execute financing (Lock receivable).
  - **Auth**: `Bearer {{LENDER_TOKEN}}`

---

## 🔍 5. Audit & Compliance (`/api/v1/audit`)

- [ ] **GET /invoices** — System-wide read-only view (Masked bits).
  - **Auth**: `Bearer {{AUDITOR_TOKEN}}`
- [ ] **GET /system** — Paginated system logs.
  - **Auth**: `Bearer {{AUDITOR_TOKEN}}`
- [ ] **GET /invoice/:invoiceId** — Specific invoice lifecycle logs.
  - **Auth**: `Bearer {{AUDITOR_TOKEN}}`
- [ ] **GET /receivable/:fingerprint** — Obligation-level timeline.
  - **Auth**: `Bearer {{AUDITOR_TOKEN}}`

---

## ⛓️ 6. Blockchain Utilities (`/api/v1/blockchain`)

- [ ] **POST /register-invoice** — Explicit on-chain registration.
  - **Auth**: `Bearer {{MSME_TOKEN}}` or `{{LENDER_TOKEN}}`
  - **Body (Raw JSON)**:
    ```json
    {
      "invoiceId": "INV-ABCD-1234",
      "invoiceHash": "6a8..."
    }
    ```

---

## 🏥 7. System Health & Docs (`/api/v1`)

- [ ] **GET /health** — Dependency status check.
  - **Path**: `/health` (Legacy) or `/api/v1/health`
- [ ] **GET /docs** — Technical API definitions.
  - **Path**: `/docs` (Legacy) or `/api/v1/docs`
