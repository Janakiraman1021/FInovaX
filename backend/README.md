# FinTrust Backend API

Production-ready fintech backend for invoice management with blockchain audit trail, IPFS storage, and role-based access control.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, and optional blockchain/IPFS credentials

# Start development server (auto-reload)
npm run dev

# Start production server
npm start
```

## API Endpoints

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |

---

### Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register a new user |
| POST | `/api/auth/login` | — | Login and receive JWT |
| GET | `/api/auth/me` | Bearer | Get current user profile |

**Register body:**
```json
{
  "name": "MSME Corp",
  "email": "msme@example.com",
  "password": "securePass1",
  "role": "msme",
  "organization": "MSME Corp Pvt Ltd"
}
```
Roles: `msme`, `lender`, `auditor`

**Login body:**
```json
{
  "email": "msme@example.com",
  "password": "securePass1"
}
```

---

### Invoices (`/api/invoices`)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/invoices` | Bearer | MSME | Upload invoice PDF |
| GET | `/api/invoices` | Bearer | All | List invoices (paginated) |
| GET | `/api/invoices/:id` | Bearer | All | Get invoice details |

**Upload** (`multipart/form-data`):
- `file` — PDF file (max 10 MB)
- `invoiceNumber` — e.g. `"INV-2026-001"`
- `amount` — e.g. `50000`
- `currency` — optional, default `"INR"`
- `description` — optional

**Query params** (GET list): `page`, `limit`, `status` (`uploaded | registered | financed`)

---

### Lender Verification (`/api/lender`)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/lender/verify/:invoiceId` | Bearer | Lender | Verify invoice status (DB + blockchain) |
| POST | `/api/lender/finance/:invoiceId` | Bearer | Lender | Finance an invoice |

---

### Audit Logs (`/api/audit`)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/audit/logs` | Bearer | Auditor | Get all audit logs (paginated) |
| GET | `/api/audit/logs/:invoiceId` | Bearer | Auditor | Get logs for a specific invoice |

**Query params** (GET logs): `page`, `limit`, `action`, `userId`

---

## Architecture

```
server.js → src/app.js (Express)
├── middleware/ (auth, rbac, validation, error handling)
├── routes/ → controllers/ → services/
├── models/ (Mongoose schemas)
└── validators/ (express-validator chains)
```

## Smart Contract

`contracts/InvoiceRegistry.sol` — Solidity contract for Sepolia testnet:
- `registerInvoice(bytes32 hash, string invoiceNumber)` — register invoice hash
- `markFinanced(bytes32 hash)` — mark as financed (blocks duplicates)
- `isRegistered(bytes32 hash)` / `isFinanced(bytes32 hash)` — view functions
- Events: `InvoiceRegistered`, `InvoiceFinanced`

## Environment Variables

See `.env.example` for all required configuration. Blockchain and IPFS features degrade gracefully when credentials are not configured.
