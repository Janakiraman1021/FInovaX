import { mockInvoices, Invoice, InvoiceStatus, addInvoice, updateInvoiceStatus } from "./mock/mockInvoices";
import { mockStats, mockAuditTimeline } from "./mock/mockStats";
import { simulateLedgerLookup } from "./mock/mockLedger";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Real Backend API ──────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/** Custom error class that includes backend error codes */
export class APIError extends Error {
    constructor(public message: string, public errorCode: string, public statusCode?: number) {
        super(message);
        this.name = "APIError";
    }
}

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: string;
    organization: string;
    createdAt?: string;
}

export interface RegisterPayload {
    name: string;
    email: string;
    password: string;
    role: string;
    organization: string;
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
    const { headers: optHeaders, ...restOptions } = options;
    const res = await fetch(`${API_BASE}${path}`, {
        ...restOptions,
        headers: { "Content-Type": "application/json", ...(optHeaders ?? {}) },
    });
    const data = await res.json();
    if (!res.ok) throw new APIError(data.message || "Request failed", data.errorCode || "ERROR", res.status);
    return data as T;
}

export interface LenderListItem {
    _id: string;
    name: string;
    email: string;
    organization: string;
}

export const authAPI = {
    login: (email: string, password: string) =>
        apiRequest<{ success: boolean; data: { user: AuthUser; token: string } }>(
            "/api/v1/auth/login",
            { method: "POST", body: JSON.stringify({ email, password }) }
        ),
    register: (payload: RegisterPayload) =>
        apiRequest<{ success: boolean; data: { user: AuthUser; token: string } }>(
            "/api/v1/auth/register",
            { method: "POST", body: JSON.stringify(payload) }
        ),
    getMe: (token: string) =>
        apiRequest<{ success: boolean; data: AuthUser }>("/api/v1/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
        }),
    updateProfile: (token: string, updates: { name?: string; organization?: string }) =>
        apiRequest<{ success: boolean; data: AuthUser }>("/api/v1/auth/me", {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(updates),
        }),
    /** GET /api/v1/auth/lenders — MSME only: discover available lenders */
    getLenders: (token: string) =>
        apiRequest<{ success: boolean; data: LenderListItem[] }>("/api/v1/auth/lenders", {
            headers: { Authorization: `Bearer ${token}` },
        }),
};

export interface UploadedInvoice {
    invoiceId: string;
    invoiceHash: string;
    receivableFingerprint?: string;
    ipfsCID: string;
    uploadedBy: string;
    status: string;
    amount: number;
    currency: string;
    description?: string;
    originalFileName?: string;
    /** Blockchain tx hash from on-chain registration; null until registered */
    blockchainTxHash: string | null;
    createdAt: string;
    submittedTo?: Array<{ _id: string; name: string; organization: string }>;
}

// Multipart upload — do NOT set Content-Type, browser sets it with boundary
async function apiUpload<T>(path: string, token: string, formData: FormData): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new APIError(data.message || "Upload failed", data.errorCode || "ERROR", res.status);
    return data as T;
}

export const invoiceAPI = {
    upload: (token: string, formData: FormData) =>
        apiUpload<{ success: boolean; message: string; data: { invoice: UploadedInvoice } }>(
            "/api/v1/invoices/upload",
            token,
            formData
        ),
    getMyInvoices: (token: string, params?: { page?: number; limit?: number; status?: string }) => {
        const qs = new URLSearchParams();
        if (params?.page)   qs.set("page",   String(params.page));
        if (params?.limit)  qs.set("limit",  String(params.limit));
        if (params?.status) qs.set("status", params.status);
        return apiRequest<{ success: boolean; data: { invoices: UploadedInvoice[]; pagination: { total: number; page: number; totalPages: number } } }>(
            `/api/v1/invoices/my${qs.toString() ? "?" + qs.toString() : ""}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
    },
    /** POST /api/v1/invoices/:invoiceId/submit — submit invoice to additional lender */
    submitToLender: (token: string, invoiceId: string, lenderId: string) =>
        apiRequest<{ success: boolean; message: string; data: { invoiceId: string; receivableFingerprint: string; lenderOrganization: string } }>(
            `/api/v1/invoices/${encodeURIComponent(invoiceId)}/submit`,
            {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: JSON.stringify({ lenderId }),
            }
        ),
};

export interface MSMEProfile {
    _id: string;
    userId: string;
    companyName?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    /** Stored as a plain string, e.g. "123 Industrial Hub, Mumbai" */
    address?: string;
    createdAt: string;
    updatedAt: string;
}

export interface MSMEProfilePayload {
    /** Required by backend */
    companyName: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    /** Plain address string */
    address?: string;
}

export const blockchainAPI = {
    /** POST /api/v1/blockchain/register-invoice — explicit on-chain anchor */
    registerInvoice: (token: string, invoiceId: string) =>
        apiRequest<{ success: boolean; message: string; data: { invoiceId: string; invoiceHash: string; blockchainTxHash: string } }>(
            "/api/v1/blockchain/register-invoice",
            {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: JSON.stringify({ invoiceId }),
            }
        ),
};

export const msmeProfileAPI = {
    /** GET /api/msme-profile — get current user's profile */
    getProfile: (token: string) =>
        apiRequest<{ success: boolean; data: MSMEProfile }>(
            "/api/msme-profile",
            { headers: { Authorization: `Bearer ${token}` } }
        ),

    /** POST /api/msme-profile — create or update profile */
    createOrUpdate: (token: string, payload: MSMEProfilePayload) =>
        apiRequest<{ success: boolean; message: string; data: MSMEProfile }>(
            "/api/msme-profile",
            {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            }
        ),

    /** PATCH /api/msme-profile/field — update single field */
    updateField: (token: string, field: string, value: unknown) =>
        apiRequest<{ success: boolean; message: string; data: MSMEProfile }>(
            "/api/msme-profile/field",
            {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
                body: JSON.stringify({ field, value }),
            }
        ),

    /** DELETE /api/msme-profile — delete profile */
    deleteProfile: (token: string) =>
        apiRequest<{ success: boolean; message: string }>(
            "/api/msme-profile",
            {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            }
        ),
};

export interface LenderInvoice {
    _id: string;
    invoiceId: string;
    amount: number;
    currency: string;
    description?: string;
    status: string;
    invoiceHash: string;
    receivableFingerprint?: string;
    ipfsCID: string;
    originalFileName?: string;
    uploadedBy: { _id: string; name: string; email: string; organization: string };
    financedBy: { _id: string; name: string; email: string; organization: string } | null;
    financedAt: string | null;
    blockchainTxHash: string | null;
    financeTxHash: string | null;
    createdAt: string;
    // New fields from backend submission tracking
    submissionStatus?: string;
    submittedAt?: string;
    isReceivableFinanced?: boolean;
    canFinance?: boolean;
}

export interface LenderVerifyResult {
    invoice: {
        id: string;
        invoiceId: string;
        amount: number;
        currency: string;
        status: string;
        invoiceHash: string;
        /** Blockchain tx hash from the on-chain registration (anchoring) */
        blockchainTxHash: string | null;
        /** Blockchain tx hash from the finance/disburse transaction */
        financeTxHash: string | null;
        uploadedBy: { name: string; email: string; organization: string } | null;
        financedBy: { name: string; email: string; organization: string } | null;
        financedAt: string | null;
    };
    verification: {
        valid: boolean;
        duplicate: boolean;
        financed: boolean;
        registeredOnChain: boolean;
    };
    canFinance: boolean;
}

export const lenderAPI = {
    /** GET /api/v1/lender/invoices — list all invoices (lender view) */
    getAllInvoices: (token: string, params?: { page?: number; limit?: number; status?: string }) => {
        const qs = new URLSearchParams();
        if (params?.page)   qs.set("page",   String(params.page));
        if (params?.limit)  qs.set("limit",  String(params.limit));
        if (params?.status) qs.set("status", params.status);
        return apiRequest<{ success: boolean; data: { invoices: LenderInvoice[]; pagination: { total: number; page: number; totalPages: number } } }>(
            `/api/v1/lender/invoices${qs.toString() ? "?" + qs.toString() : ""}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
    },

    /** GET /api/v1/lender/verify/:invoiceId — verify invoice by invoiceId */
    verifyInvoice: (token: string, invoiceId: string) =>
        apiRequest<{ success: boolean; data: LenderVerifyResult }>(
            `/api/v1/lender/verify/${encodeURIComponent(invoiceId)}`,

            { headers: { Authorization: `Bearer ${token}` } }
        ),


    /** POST /api/v1/lender/finance/:invoiceId */
    financeInvoice: (token: string, invoiceId: string) =>
        apiRequest<{ success: boolean; message: string; data: { invoice: { invoiceId: string; status: string; financeTxHash: string | null } } }>(
            `/api/v1/lender/finance/${encodeURIComponent(invoiceId)}`,
            { method: "POST", headers: { Authorization: `Bearer ${token}` } }
        ),

    /** PATCH /api/v1/lender/invoices/:invoiceId/status — update invoice status */
    updateInvoiceStatus: (token: string, invoiceId: string, status: "UPLOADED" | "FINANCED" | "BLOCKED") =>
        apiRequest<{ success: boolean; message: string; data: { invoiceId: string; status: string; updated: number } }>(
            `/api/v1/lender/invoices/${encodeURIComponent(invoiceId)}/status`,
            { method: "PATCH", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }) }
        ),
};

export interface AuditLog {
    _id: string;
    eventType: string;
    performedBy: { _id: string; name: string; email: string; role: string } | null;
    actorAddress: string | null;
    invoiceId: { _id: string; invoiceId: string; amount: number; status: string } | null;
    txHash: string | null;
    details: Record<string, unknown>;
    ipAddress: string | null;
    createdAt: string;
}

export const auditorAPI = {
    /** GET /api/v1/audit/invoices — read-only list of all invoices */
    getAllInvoices: (token: string, params?: { page?: number; limit?: number; status?: string }) => {
        const qs = new URLSearchParams();
        if (params?.page)   qs.set("page",   String(params.page));
        if (params?.limit)  qs.set("limit",  String(params.limit));
        if (params?.status) qs.set("status", params.status);
        return apiRequest<{ success: boolean; data: { invoices: LenderInvoice[]; pagination: { total: number; page: number; totalPages: number } } }>(
            `/api/v1/audit/invoices${qs.toString() ? "?" + qs.toString() : ""}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
    },

    /** GET /api/v1/audit/system — paginated audit logs */
    getAuditLogs: (token: string, params?: { page?: number; limit?: number; eventType?: string; userId?: string }) => {
        const qs = new URLSearchParams();
        if (params?.page)      qs.set("page",      String(params.page));
        if (params?.limit)     qs.set("limit",      String(params.limit));
        if (params?.eventType) qs.set("eventType",  params.eventType);
        if (params?.userId)    qs.set("userId",     params.userId);
        return apiRequest<{ success: boolean; data: { logs: AuditLog[]; pagination: { total: number; page: number; totalPages: number } } }>(
            `/api/v1/audit/system${qs.toString() ? "?" + qs.toString() : ""}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
    },

    /** GET /api/v1/audit/invoice/:invoiceId — logs for a specific invoice */
    getInvoiceLogs: (token: string, invoiceId: string) =>
        apiRequest<{ success: boolean; data: { logs: AuditLog[] } }>(
            `/api/v1/audit/invoice/${encodeURIComponent(invoiceId)}`,
            { headers: { Authorization: `Bearer ${token}` } }
        ),

    /** GET /api/v1/audit/receivable/:fingerprint — obligation-level timeline */
    getReceivableLogs: (token: string, fingerprint: string) =>
        apiRequest<{ success: boolean; data: { logs: AuditLog[] } }>(
            `/api/v1/audit/receivable/${encodeURIComponent(fingerprint)}`,
            { headers: { Authorization: `Bearer ${token}` } }
        ),
};

// ─── Trust & Timeline APIs ────────────────────────────────────────────────────

export interface TrustScore {
    trustScore: number;
    status: 'EXCELLENT' | 'STABLE' | 'RISKY';
}

export interface TimelineEvent {
    type: 'SYSTEM_EVENT' | 'ASSURANCE_REPORT';
    event: string;
    timestamp: string;
    details: Record<string, unknown>;
}

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

export const trustAPI = {
    /** GET /api/v1/trust/trustscore/me — get my trust score (MSME) */
    getMyTrustScore: (token: string) =>
        apiRequest<{ success: boolean; data: TrustScore }>(
            "/api/v1/trust/trustscore/me",
            { headers: { Authorization: `Bearer ${token}` } }
        ),

    /** GET /api/v1/trust/trustscore/msme/:msmeId — get MSME trust score (Lender/Auditor) */
    getMSMETrustScore: (token: string, msmeId: string) =>
        apiRequest<{ success: boolean; data: TrustScore }>(
            `/api/v1/trust/trustscore/msme/${encodeURIComponent(msmeId)}`,
            { headers: { Authorization: `Bearer ${token}` } }
        ),

    /** GET /api/v1/trust/timeline/invoice/:invoiceId — get invoice timeline */
    getInvoiceTimeline: (token: string, invoiceId: string) =>
        apiRequest<{ success: boolean; data: { invoice: { invoiceId: string; status: string }; timeline: TimelineEvent[] } }>(
            `/api/v1/trust/timeline/invoice/${encodeURIComponent(invoiceId)}`,
            { headers: { Authorization: `Bearer ${token}` } }
        ),

    /** GET /api/v1/trust/timeline/receivable/:fingerprint — get receivable timeline */
    getReceivableTimeline: (token: string, fingerprint: string) =>
        apiRequest<{ success: boolean; data: { receivableFingerprint: string; timeline: TimelineEvent[] } }>(
            `/api/v1/trust/timeline/receivable/${encodeURIComponent(fingerprint)}`,
            { headers: { Authorization: `Bearer ${token}` } }
        ),

    /** POST /api/v1/trust/assurance/submit — submit assurance report (MSME) */
    submitAssuranceReport: (token: string, payload: { invoiceId: string; usageCategory: string; description?: string }) =>
        apiRequest<{ success: boolean; message: string; data: AssuranceReport }>(
            "/api/v1/trust/assurance/submit",
            {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            }
        ),

    /** POST /api/v1/trust/assurance/acknowledge — acknowledge assurance report (Lender) */
    acknowledgeAssuranceReport: (token: string, payload: { reportId: string }) =>
        apiRequest<{ success: boolean; message: string; data: AssuranceReport }>(
            "/api/v1/trust/assurance/acknowledge",
            {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            }
        ),

    /** GET /api/v1/trust/assurance/invoice/:invoiceId — get assurance report for invoice */
    getAssuranceReport: (token: string, invoiceId: string) =>
        apiRequest<{ success: boolean; data: AssuranceReport | null }>(
            `/api/v1/trust/assurance/invoice/${encodeURIComponent(invoiceId)}`,
            { headers: { Authorization: `Bearer ${token}` } }
        ),
};


export const api = {
    auth: {
        login: async (role: string) => {
            await delay(800);
            return {
                token: `mock.jwt.oneflow.${role}`,
                user: { role },
            };
        },
    },
    invoices: {
        getAll: async (): Promise<Invoice[]> => {
            await delay(600);
            return [...mockInvoices];
        },
        upload: async (invoiceData: Omit<Invoice, "status" | "timestamp">): Promise<Invoice> => {
            await delay(1200);
            const newInvoice: Invoice = {
                ...invoiceData,
                status: "PENDING",
                timestamp: new Date().toISOString(),
            };
            addInvoice(newInvoice);
            return newInvoice;
        },
        verify: async (hash: string) => {
            return await simulateLedgerLookup(hash);
        },
        disburse: async (id: string, lender: string, txHash: string) => {
            await delay(1400);
            updateInvoiceStatus(id, "FINANCED", txHash, lender);
            return { success: true, txHash };
        },
    },
    audit: {
        getStats: async () => {
            await delay(700);
            return mockStats;
        },
        getTimeline: async () => {
            await delay(500);
            return mockAuditTimeline;
        },
    },
};
