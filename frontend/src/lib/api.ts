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
};

// ─── Mock / Offline API ────────────────────────────────────────────────────────

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
