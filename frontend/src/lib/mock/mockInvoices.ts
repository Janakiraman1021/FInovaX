export type InvoiceStatus = "PENDING" | "VERIFIED" | "FINANCED" | "FRAUD_ALERT";

export interface Invoice {
    id: string;
    borrower: string;
    lender?: string;
    amount: number;
    invoiceHash: string;
    status: InvoiceStatus;
    timestamp: string;
    ledgerTx?: string;
    description: string;
}

export let mockInvoices: Invoice[] = [
    {
        id: "INV-001",
        borrower: "TechFlow MSME",
        amount: 25000,
        invoiceHash: "3e236746e53460e4479e4369e9846cd4d67385923c92c813589b9468081682c3",
        status: "FINANCED",
        timestamp: "2024-05-15T10:30:00Z",
        ledgerTx: "0xFINO742893acbd8e5bdf9283749acbd",
        lender: "Global Finance Bank",
        description: "Cloud Infrastructure Setup",
    },
    {
        id: "INV-002",
        borrower: "TechFlow MSME",
        amount: 12000,
        invoiceHash: "f6e0b3c3b5d2a9f9a2b8e3d4c5b6a7f8e9d0c1b2a3b4c5d6e7f8g9h0i1j2k3l4",
        status: "VERIFIED",
        timestamp: "2024-05-18T14:20:00Z",
        ledgerTx: "0xFINO9283749acbd8e5bdf9283749acbd",
        description: "Monthly Software Licensing",
    },
    {
        id: "INV-003",
        borrower: "GreenEnergy Solutions",
        amount: 45000,
        invoiceHash: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2",
        status: "PENDING",
        timestamp: "2024-05-20T09:15:00Z",
        description: "Solar Panel Installation Phase 1",
    },
    {
        id: "INV-004",
        borrower: "AgriTech Corp",
        amount: 8500,
        invoiceHash: "d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6",
        status: "FRAUD_ALERT",
        timestamp: "2024-05-21T11:45:00Z",
        description: "Smart Irrigation Sensors",
    },
];

export const addInvoice = (invoice: Invoice) => {
    mockInvoices = [invoice, ...mockInvoices];
};

export const updateInvoiceStatus = (id: string, status: InvoiceStatus, ledgerTx?: string, lender?: string) => {
    mockInvoices = mockInvoices.map((inv) =>
        inv.id === id ? { ...inv, status, ledgerTx, lender } : inv
    );
};
