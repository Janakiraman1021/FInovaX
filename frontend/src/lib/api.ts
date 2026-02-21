import { mockInvoices, Invoice, InvoiceStatus, addInvoice, updateInvoiceStatus } from "./mock/mockInvoices";
import { mockStats, mockAuditTimeline } from "./mock/mockStats";
import { simulateLedgerLookup } from "./mock/mockLedger";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
