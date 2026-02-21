import { mockInvoices, Invoice, InvoiceStatus, addInvoice, updateInvoiceStatus } from "./mock/mockInvoices";
import { mockStats, mockAuditTimeline } from "./mock/mockStats";
import { simulateLedgerLookup } from "./mock/mockLedger";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Real Backend API ──────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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
    const res = await fetch(`${API_BASE}${path}`, {
        headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
        ...options,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data as T;
}

export const authAPI = {
    login: (email: string, password: string) =>
        apiRequest<{ success: boolean; data: { user: AuthUser; token: string } }>(
            "/auth/login",
            { method: "POST", body: JSON.stringify({ email, password }) }
        ),
    register: (payload: RegisterPayload) =>
        apiRequest<{ success: boolean; data: { user: AuthUser; token: string } }>(
            "/auth/register",
            { method: "POST", body: JSON.stringify(payload) }
        ),
    getMe: (token: string) =>
        apiRequest<{ success: boolean; data: AuthUser }>("/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
        }),
    updateProfile: (token: string, updates: { name?: string; organization?: string }) =>
        apiRequest<{ success: boolean; data: AuthUser }>("/auth/me", {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(updates),
        }),
};

export interface UploadedInvoice {
    invoiceId: string;
    invoiceHash: string;
    ipfsCID: string;
    uploadedBy: string;
    status: string;
    amount: number;
    currency: string;
    description?: string;
    originalFileName?: string;
    createdAt: string;
}

// Multipart upload — do NOT set Content-Type, browser sets it with boundary
async function apiUpload<T>(path: string, token: string, formData: FormData): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Upload failed");
    return data as T;
}

export const invoiceAPI = {
    upload: (token: string, formData: FormData) =>
        apiUpload<{ success: boolean; message: string; data: { invoice: UploadedInvoice } }>(
            "/invoices/upload",
            token,
            formData
        ),
    getMyInvoices: (token: string, params?: { page?: number; limit?: number; status?: string }) => {
        const qs = new URLSearchParams();
        if (params?.page)   qs.set("page",   String(params.page));
        if (params?.limit)  qs.set("limit",  String(params.limit));
        if (params?.status) qs.set("status", params.status);
        return apiRequest<{ success: boolean; data: { invoices: UploadedInvoice[]; pagination: { total: number; page: number; totalPages: number } } }>(
            `/invoices/my${qs.toString() ? "?" + qs.toString() : ""}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
    },
};

export interface LenderInvoice {
    _id: string;
    invoiceId: string;
    amount: number;
    currency: string;
    description?: string;
    status: string;
    invoiceHash: string;
    ipfsCID: string;
    originalFileName?: string;
    uploadedBy: { _id: string; name: string; email: string; organization: string };
    financedBy: { _id: string; name: string; email: string; organization: string } | null;
    financedAt: string | null;
    financeTxHash: string | null;
    createdAt: string;
}

export interface LenderVerifyResult {
    invoice: {
        id: string;
        invoiceId: string;
        amount: number;
        currency: string;
        status: string;
        invoiceHash: string;
        uploadedBy: { name: string; email: string; organization: string };
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
    /** GET /lender/invoices — list all invoices (lender view) */
    getAllInvoices: (token: string, params?: { page?: number; limit?: number; status?: string }) => {
        const qs = new URLSearchParams();
        if (params?.page)   qs.set("page",   String(params.page));
        if (params?.limit)  qs.set("limit",  String(params.limit));
        if (params?.status) qs.set("status", params.status);
        return apiRequest<{ success: boolean; data: { invoices: LenderInvoice[]; pagination: { total: number; page: number; totalPages: number } } }>(
            `/lender/invoices${qs.toString() ? "?" + qs.toString() : ""}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
    },

    /** GET /lender/verify/:invoiceId — accepts invoiceId or invoiceHash */
    verifyInvoice: (token: string, invoiceIdOrHash: string) =>
        apiRequest<{ success: boolean; data: LenderVerifyResult }>(
            `/lender/verify/${encodeURIComponent(invoiceIdOrHash)}`,
            { headers: { Authorization: `Bearer ${token}` } }
        ),

    /** POST /lender/finance/:invoiceId */
    financeInvoice: (token: string, invoiceId: string) =>
        apiRequest<{ success: boolean; message: string; data: { invoice: { invoiceId: string; status: string; financeTxHash: string | null } } }>(
            `/lender/finance/${encodeURIComponent(invoiceId)}`,
            { method: "POST", headers: { Authorization: `Bearer ${token}` } }
        ),
};



export const api = {
    auth: {
        login: async (role: string) => {
            await delay(800);
            return {
                token: `mock.jwt.finovax.${role}`,
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
