# FInovaX — Blockchain-Powered Invoice Financing Platform

FInovaX (FinTrust) is a production-grade fintech platform that enables MSMEs to upload invoices, register them on the Ethereum Sepolia blockchain, store documents on IPFS, and obtain financing from verified lenders — all with a cryptographically-linked, tamper-proof audit trail.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Smart Contract](#smart-contract)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [User Roles](#user-roles)
- [Security](#security)
- [Contributing](#contributing)

---

## Overview

FInovaX solves the invoice financing gap for small and medium enterprises (MSMEs) by:

1. Letting an **MSME** upload a PDF invoice — the backend hashes it (SHA-256), pins it to **IPFS** (Pinata), and registers the hash on a **Solidity smart contract** deployed on Ethereum Sepolia.
2. Letting a **Lender** verify the on-chain status of an invoice and finance it — triggering a blockchain transaction that prevents double-financing.
3. Giving an **Auditor** a full, immutable, paginated audit log of every action taken on every invoice.

The frontend is a Next.js 14 app with role-based dashboards for each participant.

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Next.js Frontend                  │
│  Landing · Auth · MSME Dashboard · Lender Dashboard  │
│              Auditor Dashboard · Profile             │
└────────────────────────┬─────────────────────────────┘
                         │ REST (JWT Bearer)
┌────────────────────────▼─────────────────────────────┐
│              Express.js Backend (Node)               │
│  Auth · Invoices · Lender · Audit · MSME Profile     │
│  Rate Limiting · Helmet · RBAC · Request-ID          │
└─────────┬──────────────┬────────────────┬────────────┘
          │              │                │
    ┌─────▼────┐  ┌──────▼──────┐  ┌─────▼──────┐
    │ MongoDB  │  │    IPFS     │  │  Ethereum  │
    │ (Mongoose│  │   Pinata    │  │  Sepolia   │
    │  ODM)    │  │   Gateway   │  │  (ethers)  │
    └──────────┘  └─────────────┘  └────────────┘
```

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 5 |
| Database | MongoDB + Mongoose 9 |
| Auth | JWT (`jsonwebtoken`) + `bcryptjs` |
| Blockchain | `ethers` v6, Ethereum Sepolia |
| Storage | IPFS via Pinata (`axios` multipart) |
| Validation | `express-validator` |
| Security | `helmet`, `cors`, `express-rate-limit` |
| Logging | `morgan` |
| File Upload | `multer` (10 MB PDF limit) |

### Frontend
| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 + custom design tokens |
| Animation | Framer Motion 11, GSAP 3 |
| 3D | Three.js + `@react-three/fiber` + `@react-three/drei` |
| UI Components | Radix UI (Dialog, Dropdown) |
| Icons | Lucide React |
| Notifications | Sonner |
| Web3 | `ethers` v6 |
| HTTP Client | Axios |

### Smart Contract
| Layer | Technology |
|---|---|
| Language | Solidity ^0.8.20 |
| Network | Ethereum Sepolia Testnet |
| Contract | `InvoiceRegistry.sol` |

---

## Project Structure

```
FInovaX/
├── backend/                        # Express API server
│   ├── server.js                   # Entry point (connects DB, starts server)
│   ├── package.json
│   ├── .env.example                # Environment variable template
│   ├── contracts/
│   │   └── InvoiceRegistry.sol     # Solidity smart contract
│   └── src/
│       ├── app.js                  # Express app, middleware, routes
│       ├── config/
│       │   └── db.js               # Mongoose connection
│       ├── controllers/            # Route handler logic
│       │   ├── auth.controller.js
│       │   ├── invoice.controller.js
│       │   ├── lender.controller.js
│       │   ├── audit.controller.js
│       │   ├── blockchain.controller.js
│       │   ├── health.controller.js
│       │   ├── docs.controller.js
│       │   └── msmeProfileController.js
│       ├── middleware/
│       │   ├── auth.js             # JWT verification
│       │   ├── rbac.js             # Role-based access control
│       │   ├── validate.js         # express-validator error handler
│       │   ├── rateLimiter.js
│       │   ├── requestId.js        # Injects X-Request-ID header
│       │   └── errorHandler.js     # Global error handler
│       ├── models/
│       │   ├── User.js             # Roles: msme | lender | auditor
│       │   ├── Invoice.js          # Invoice lifecycle model
│       │   ├── MSMEProfile.js      # Extended MSME profile
│       │   └── AuditLog.js         # Immutable audit entries
│       ├── routes/
│       │   ├── v1.routes.js        # Versioned /api/v1 router
│       │   ├── auth.routes.js
│       │   ├── invoice.routes.js
│       │   ├── lender.routes.js
│       │   ├── audit.routes.js
│       │   ├── blockchain.routes.js
│       │   ├── health.routes.js
│       │   ├── docs.routes.js
│       │   └── msmeProfileRoutes.js
│       ├── services/
│       │   ├── blockchain.service.js   # ethers.js — register/finance on-chain
│       │   ├── ipfs.service.js         # Pinata IPFS upload
│       │   ├── audit.service.js        # Audit log creation helpers
│       │   └── eventListener.service.js # Blockchain event listener
│       ├── validators/
│       │   ├── auth.validator.js
│       │   └── invoice.validator.js
│       └── utils/
│           ├── AppError.js         # Custom error class
│           ├── hash.js             # SHA-256 file hashing
│           └── response.js         # Standardised JSON response helpers
│
├── frontend/                       # Next.js 14 app
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── src/
│       ├── middleware.ts           # Auth guard (redirects by role)
│       ├── app/
│       │   ├── page.tsx            # Public landing page
│       │   ├── layout.tsx          # Root layout (AuthProvider)
│       │   ├── (auth)/
│       │   │   ├── login/
│       │   │   └── register/
│       │   ├── (dashboard)/
│       │   │   ├── msme/           # Invoice upload, history, pending, financed
│       │   │   ├── lender/         # Verify & finance invoices
│       │   │   └── auditor/        # Audit log viewer
│       │   ├── about/
│       │   ├── why-finovax/
│       │   ├── privacy-policy/
│       │   └── terms-and-conditions/
│       ├── components/
│       │   ├── finovax/            # Domain-specific UI components
│       │   └── shared/             # Reusable UI components
│       ├── context/
│       │   └── AuthContext.tsx     # JWT session, role, demo-mode state
│       ├── hooks/
│       │   └── useWallet.ts        # MetaMask / ethers wallet hook
│       └── lib/
│           ├── api.ts              # Axios API client (authAPI, invoiceAPI…)
│           ├── utils.ts
│           └── mock/               # Demo-mode mock data
│
└── v0/                             # Prototype / design reference (v0.dev)
```

---

## Features

### Invoice Lifecycle
- **Upload** — MSME uploads a PDF (≤ 10 MB). Backend computes a SHA-256 hash, uploads to IPFS via Pinata, and registers the hash on-chain via `InvoiceRegistry.registerInvoice()`.
- **Verify** — Lender queries both MongoDB and the blockchain to confirm an invoice is registered and not yet financed.
- **Finance** — Lender calls `InvoiceRegistry.financeInvoice()`. The contract guards against double-financing; MongoDB status is updated to `FINANCED`.
- **Audit** — Every state transition writes an entry to `AuditLog`. Auditors can filter by action, user, or invoice.

### Blockchain Integration
- Hash-only approach — no sensitive data on-chain, only `bytes32` hashes and flags.
- `InvoiceRegistry` also supports a **Receivable Fingerprint** pattern for receivables deduplication.
- Duplicate financing attempts emit a `DuplicateFinancingAttempt` event rather than reverting silently.
- Lender addresses must be explicitly authorised by the contract owner.

### IPFS / Pinata Storage
- Invoice PDFs are pinned to IPFS on upload.
- CID is stored in MongoDB (`ipfsCID` field) so files are always retrievable via the Pinata gateway.
- IPFS upload is optional — if credentials are absent, the invoice is still hashed and stored in MongoDB.

### Role-Based Access Control (RBAC)
| Resource | MSME | Lender | Auditor |
|---|:---:|:---:|:---:|
| Upload invoice | ✅ | — | — |
| View own invoices | ✅ | — | — |
| View all invoices | — | ✅ | ✅ |
| Verify invoice | — | ✅ | — |
| Finance invoice | — | ✅ | — |
| View audit logs | — | — | ✅ |

### Frontend Dashboards
- **MSME**: Upload invoices, track history, view pending/financed/rejected tabs, manage profile.
- **Lender**: Search and verify invoices on-chain, initiate financing.
- **Auditor**: Paginated audit log with filters.
- **Demo Mode**: Full interactive walkthrough without a backend connection (mock data).

---

## Smart Contract

**File**: [backend/contracts/InvoiceRegistry.sol](backend/contracts/InvoiceRegistry.sol)  
**Network**: Ethereum Sepolia Testnet  
**Address**: configured via `INVOICE_REGISTRY_CONTRACT` env var

### Key Functions
| Function | Access | Description |
|---|---|---|
| `registerInvoice(bytes32, string)` | Owner / Backend wallet | Register an invoice hash |
| `financeInvoice(bytes32)` | Authorized lenders | Mark an invoice as financed |
| `registerReceivable(bytes32)` | Owner | Register a receivable fingerprint |
| `financeReceivable(bytes32)` | Authorized lenders | Finance a receivable |
| `isRegistered(bytes32)` | Public | Check if an invoice is registered |
| `isFinanced(bytes32)` | Public | Check if an invoice is financed |
| `authorizeLender(address)` | Owner | Grant lender permissions |
| `revokeLender(address)` | Owner | Revoke lender permissions |

### Events
- `InvoiceRegistered(bytes32, string, address, uint256)`
- `InvoiceFinanced(bytes32, address, uint256)`
- `DuplicateFinancingAttempt(bytes32, address, uint256)`
- `ReceivableRegistered(bytes32)`
- `ReceivableFinanced(bytes32, address)`
- `LenderAuthorized(address)` / `LenderRevoked(address)`

---

## Getting Started

### Prerequisites

- **Node.js** v18+ and **npm** v9+
- **MongoDB** (local or Atlas)
- **Ethereum Sepolia** RPC endpoint (Alchemy / Infura)
- **Pinata** account for IPFS (optional but recommended)
- A funded Sepolia wallet (for deploying / calling the contract)

---

### Backend Setup

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — see Environment Variables section below

# 3. (Optional) Seed the database with demo users
npm run seed

# 4. Start development server (auto-reload via --watch)
npm run dev

# 5. Start production server
npm start
```

Server runs on `http://localhost:5000` by default.

---

### Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Configure environment
# Create .env.local and set NEXT_PUBLIC_API_URL
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local

# 3. Start development server
npm run dev

# 4. Build for production
npm run build && npm start
```

Frontend runs on `http://localhost:3000` by default.

---

## Environment Variables

### Backend (`backend/.env`)

```dotenv
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/fintrust
# or Atlas: mongodb+srv://<user>:<password>@cluster.mongodb.net/fintrust

# JWT
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=24h

# Ethereum Sepolia
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
WALLET_PRIVATE_KEY=your_wallet_private_key_without_0x_prefix
INVOICE_REGISTRY_CONTRACT=0xYourDeployedContractAddress

# Blockchain event listeners (set false on free-tier RPC to avoid rate limits)
ENABLE_EVENT_LISTENERS=false

# IPFS — Pinata (optional)
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key

# Rate Limiting (defaults: 15 min window, 100 requests)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

> **Note**: Blockchain and IPFS credentials are optional. Their respective services degrade gracefully and log a warning if not configured.

### Frontend (`frontend/.env.local`)

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## API Reference

All versioned routes are prefixed with `/api/v1`. Legacy routes (without version prefix) are kept for backward compatibility.

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Server and DB health check |

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | — | Register a new user |
| `POST` | `/api/v1/auth/login` | — | Login — returns JWT |
| `GET` | `/api/v1/auth/me` | Bearer | Get current user profile |
| `PATCH` | `/api/v1/auth/me` | Bearer | Update name / organization |

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
Roles: `msme` · `lender` · `auditor`

### Invoices (`/api/v1/invoices`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/v1/invoices` | Bearer | MSME | Upload invoice PDF |
| `GET` | `/api/v1/invoices` | Bearer | All | List invoices (paginated) |
| `GET` | `/api/v1/invoices/:id` | Bearer | All | Get invoice details |

`POST` uses `multipart/form-data`:
- `file` — PDF, max 10 MB
- `invoiceNumber` — e.g. `INV-2026-001`
- `amount` — numeric
- `currency` — optional, default `INR`
- `description` — optional, max 500 chars

Query params for list: `page`, `limit`, `status` (`UPLOADED | FINANCED | BLOCKED`)

### Lender (`/api/v1/lender`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/lender/verify/:invoiceId` | Bearer | Lender | Verify invoice (DB + chain) |
| `POST` | `/api/v1/lender/finance/:invoiceId` | Bearer | Lender | Finance an invoice |

### Audit Logs (`/api/v1/audit`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/audit/logs` | Bearer | Auditor | All audit logs (paginated) |
| `GET` | `/api/v1/audit/logs/:invoiceId` | Bearer | Auditor | Logs for a specific invoice |

Query params: `page`, `limit`, `action`, `userId`

### Blockchain (`/api/v1/blockchain`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/blockchain/status/:invoiceHash` | Bearer | On-chain registration status |
| `POST` | `/api/v1/blockchain/register` | Bearer | Manually register a hash |

### MSME Profile (`/api/msme-profile`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/msme-profile` | Bearer | MSME | Get own profile |
| `PUT` | `/api/msme-profile` | Bearer | MSME | Create / update profile |

---

## User Roles

| Role | Description |
|---|---|
| **MSME** | Small / medium enterprise that uploads invoices for financing. Has access to the MSME dashboard: upload, history, pending, financed, and profile views. |
| **Lender** | Financial institution that verifies and finances invoices. Must be authorised on-chain by the contract owner. |
| **Auditor** | Read-only role with access to the full audit log across all invoices and users. Intended for regulators / compliance officers. |

---

## Security

| Control | Implementation |
|---|---|
| Password hashing | `bcryptjs` with salt rounds = 12 |
| JWT | HS256, configurable expiry (default 24 h) |
| RBAC | `rbac.js` middleware enforces role on every protected route |
| Rate limiting | `express-rate-limit` — 100 req / 15 min per IP (configurable) |
| HTTP headers | `helmet` sets secure defaults (CSP, HSTS, X-Frame-Options, etc.) |
| Request tracing | `requestId.js` injects `X-Request-ID` on every response |
| Input validation | `express-validator` schemas for auth and invoice routes |
| File validation | `multer` — PDF only, 10 MB hard limit |
| On-chain integrity | SHA-256 hash stored on-chain; any tampering is immediately detectable |
| IPFS pinning | Files pinned permanently; CID is the content address — immutable by design |

---

## Contributing

1. Fork the repository and create a feature branch from `main`.
2. Follow the existing code style (CommonJS for backend, TypeScript strict mode for frontend).
3. Write clear commit messages.
4. Open a pull request with a description of the changes and any relevant test output.

---

> Built for the Indian MSME ecosystem with RBI / SEBI compliance principles in mind.  
> Powered by Ethereum · IPFS · MongoDB · Next.js.
