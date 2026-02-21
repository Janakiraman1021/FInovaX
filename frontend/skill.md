# FINOVAX Frontend Skill Guide

## skill.md — Frontend Development (Mock Simulation Mode)

This document defines the **development rules, mock architecture, and simulation standards** for the FINOVAX frontend.
The goal is to allow rapid UI development without requiring a live blockchain or backend during early prototyping.

---

# 1. Purpose of this Skill

FINOVAX frontend must behave like a **real fintech blockchain product** even when running entirely with mocked data.

This skill enables:

* Role switching without real authentication
* Simulated blockchain verification
* Fake ledger confirmations
* Fraud detection demos
* Real-time UI transitions
* Presentation-ready flows

No real API or smart contract calls are required at this stage.

---

# 2. Global Mock Philosophy

All data must be deterministic and realistic.

Avoid random meaningless values.

Every invoice must include:

* id
* invoiceHash (SHA-256 format string)
* amount
* borrowerName
* lenderName
* status
* timestamp
* ledgerTxHash

Statuses allowed:

PENDING
VERIFIED
FINANCED
FRAUD_ALERT

---

# 3. Mock Data Location

Create:

/src/lib/mock/

Files:

mockInvoices.ts
mockLedger.ts
mockUsers.ts
mockStats.ts

Example structure:

```ts
export type InvoiceStatus =
  | "PENDING"
  | "VERIFIED"
  | "FINANCED"
  | "FRAUD_ALERT";

export interface Invoice {
  id: string;
  borrower: string;
  lender?: string;
  amount: number;
  invoiceHash: string;
  status: InvoiceStatus;
  timestamp: string;
  ledgerTx?: string;
}
```

---

# 4. Fake Blockchain Simulation

The frontend must simulate a blockchain lookup.

Create:

simulateLedgerLookup(hash)

Behavior:

1. Loading state (1.2s delay)
2. Search mockLedger.ts
3. Return result:

{
exists: boolean,
financedBy?: string,
txHash?: string
}

Rules:

If exists = true AND lender differs → trigger FRAUD_ALERT modal.

---

# 5. Mock Auth System

Roles:

msme
lender
auditor

Mock Login must:

* Store role in localStorage
* Generate fake JWT string
* Update AuthContext state

Example token format:

"mock.jwt.finovax.[role]"

No real encryption required.

---

# 6. Axios Mock Adapter

Create @/lib/api.ts

Instead of real API calls:

* Intercept requests
* Return Promise.resolve(mockData)

Simulated endpoints:

POST /auth/login
GET /invoices
POST /invoice/upload
POST /invoice/verify
POST /invoice/disburse
GET /audit/stats

Use setTimeout to simulate network latency (600–1400ms).

---

# 7. MSME Simulation Rules

Uploading an invoice must:

1. Generate SHA-256 hash client-side
2. Push new object into mockInvoices
3. Set status = PENDING
4. Trigger Sonner toast:
   "Invoice submitted to ledger"

After 2 seconds automatically update to VERIFIED.

---

# 8. Lender Simulation Rules

Verification widget must:

* Animate scanning effect
* Call simulateLedgerLookup()

If duplicate:

status → FRAUD_ALERT
Trigger GSAP shake animation.

If valid:

status → VERIFIED
Show cyan-blue border animation.

Disburse Funds:

* Change status to FINANCED
* Assign lenderName
* Generate fake txHash:

0xFINO + randomHex(32)

---

# 9. Auditor Simulation Rules

mockStats.ts must include:

* totalVolume
* fraudAttemptsBlocked
* activeMSMEs
* totalInvoices

Audit Timeline format:

[
{ event: "Invoice Uploaded", time: "..." },
{ event: "Hash Verified", time: "..." },
{ event: "Lender Approved", time: "..." },
{ event: "Funds Settled", time: "..." }
]

Timeline must animate sequentially using Theatre.js or Framer Motion.

---

# 10. Motion & Animation Guidelines

Pending:
Pulse animation using Framer Motion.

Verified:
Sharp border highlight.

Financed:
Soft emerald glow.

Fraud Alert:
GSAP horizontal shake (repeat: 3).

Lenis must control global scrolling.

Avoid overusing Anime.js — restrict to micro-interactions only.

---

# 11. Developer Rules

DO:

* Use strict typing everywhere
* Separate UI from logic
* Keep mock state centralized
* Build reusable components under /finovax

DO NOT:

* Hardcode role checks inside components
* Use random statuses
* Add real backend calls yet

---

# 12. Demo Mode Requirement

Include a global toggle:

DEV_PRESENTATION_MODE = true

When enabled:

* Auto-switch roles from a dropdown
* Auto-trigger ledger confirmations
* Display fake block height counter

---

# 13. Expected Outcome

Frontend must feel like:

A real institutional blockchain financing platform with:

* Instant feedback
* Smooth state transitions
* Realistic fraud scenarios
* Audit-grade transparency visuals

The UI should convincingly simulate a live Web3 ledger without requiring any external infrastructure.

You are a Senior Frontend Architect & UI/UX Engineer tasked with building a **production-ready Web3 Fintech prototype**.

Project Name: **FINOVAX — Hybrid Audit Architecture for Invoice Financing**

Objective:
Design and implement a scalable Next.js (App Router) application that demonstrates a **blockchain-backed invoice verification and financing workflow** involving three roles: MSME (Borrower), Lender (Bank/NBFC), and Auditor (Regulator). The system must visually simulate ledger validation, fraud detection, and financing status transitions suitable for a high-impact hackathon demo or investor presentation.

---

## TECHNICAL FOUNDATION

Framework: Next.js (App Router)
Language: TypeScript (Strict Mode Enabled)
Styling Stack:

* Tailwind CSS
* Framer Motion
* GSAP (GreenSock)
* Lenis (smooth scrolling)
* Anime.js (micro-interactions)
* Theatre.js (timeline-based state animations)

UI Architecture:

* Shadcn/UI aesthetic using Radix primitives
* React Three Fiber (R3F) for immersive visual widgets

Authentication:

* JWT-based authentication
* AuthContext with role switching
* middleware.ts for role-based route guarding
  Roles:
* msme
* lender
* auditor

Networking:

* Axios instance under @/lib/api
* Centralized baseURL config
* Request/response interceptors

---

## FOLDER STRUCTURE

/src/app/(auth)/login
/src/app/(auth)/register
/src/app/(dashboard)/msme
/src/app/(dashboard)/lender
/src/app/(dashboard)/auditor

/src/components/shared

* Navbar
* Sidebar
* StatusBadges

/src/components/finovax

* InvoiceUploader
* HashVerifier
* LedgerViewer
* FraudAlertModal

/src/hooks

* useAuth
* useInvoices

/src/lib

* api.ts
* utils.ts

---

## VISUAL & UX SYSTEM

Primary Theme Fusion:

1. Deep Sea (Primary UI foundation)
2. Midnight Galaxy (Presentation Accent Layer)

Deep Sea Core:

* Dark Slate / Navy base
* Electric Blue highlights

Midnight Galaxy Overlay:

* Deep Purple: #2b1e3e
* Cosmic Blue: #4a4e8f
* Lavender Accent: #a490c2
* Silver Text: #e6e6fa

Typography:
Headers: FreeSans Bold
Body: FreeSans

Design Philosophy:

* Futuristic fintech dashboard
* Cinematic dark-mode
* Motion-driven status feedback

---

## STATUS DESIGN LOGIC

PENDING:
linear-gradient(90deg, #7C3AED, #EC4899)
Animated pulse / shimmer effect

VERIFIED:
linear-gradient(90deg, #06B6D4, #3B82F6)
Sharp border highlight

FINANCED:
linear-gradient(90deg, #22C55E, #4ADE80)
Soft emerald glow

FRAUD_ALERT:
Red shake animation
High-contrast warning visuals
Used for “Double Financing” detection demo

Notifications:

* Sonner toast system triggered by simulated ledger confirmations

---

## ROLE REQUIREMENTS

ROLE A — MSME (Borrower)
Upload Portal:

* Drag-and-drop PDF uploader
* Generate SHA-256 hash client-side before API submission
* Smooth progress animation

Management Grid:

* Table listing invoice history
* Amount, status badge, timestamps
* “View on Ledger” transaction link

ROLE B — LENDER (Bank/NBFC)
Verification Engine:

* Real-time search bar for invoice hash lookup
* Simulated blockchain verification animation

Conflict Screen:

* Modal warning when duplicate financing detected
* Text: “Warning: This invoice hash is already financed by [Lender X]. Financing Blocked.”

Approval Workflow:

* One-click “Disburse Funds” action
* Animated confirmation

ROLE C — AUDITOR (Regulator)
System Health Dashboard:

* Total financing volume
* Fraud attempts blocked
* Active MSME count

Audit Trail Timeline:
Vertical animated timeline:
[Timestamp] → Invoice Uploaded
→ Hash Verified on Ledger
→ Lender Approved
→ Funds Settled

---

## INTEGRATION TASKS

1. Generate AuthContext.tsx

* Supports roles: msme, lender, auditor
* Mock login switcher for demo presentations
* JWT simulation with localStorage
* Global role state management

2. Create middleware.ts

* Role-based route protection
* Redirect unauthorized access

3. Build LenderDashboard Layout
   Includes:

* Sidebar + Navbar
* “Real-time Verification” widget
* Simulated blockchain lookup animation
* React Three Fiber visualization element

4. UX MOTION REQUIREMENTS

* Use Framer Motion for page transitions
* GSAP for fraud alert shakes
* Lenis for smooth scrolling
* Theatre.js for timeline-driven ledger status changes

---

## OUTPUT EXPECTATIONS

Produce:

* Clean modular architecture
* Production-grade TypeScript structure
* Strict typing
* Maintainable scalable folder layout
* High-impact cinematic UI suitable for hackathon judging demos

The result should feel like:
“An institutional fintech dashboard powered by blockchain intelligence, designed for dramatic live demonstrations.”


Add MeTa mask wallet connection also do it 