export interface AuditEvent {
    id: string;
    event: string;
    time: string;
    status: "success" | "warning" | "info";
}

export const mockStats = {
    totalVolume: 1250000,
    fraudAttemptsBlocked: 14,
    activeMSMEs: 42,
    totalInvoices: 156,
};

export const mockAuditTimeline: AuditEvent[] = [
    {
        id: "1",
        event: "Invoice INV-201 Uploaded by TechFlow",
        time: "2 mins ago",
        status: "info",
    },
    {
        id: "2",
        event: "Hash Collision Detected for INV-199",
        time: "15 mins ago",
        status: "warning",
    },
    {
        id: "3",
        event: "Lender ABC Disbursed $45k to GreenEnergy",
        time: "1 hour ago",
        status: "success",
    },
    {
        id: "4",
        event: "Automated Ledger Audit: 100% Integrity",
        time: "3 hours ago",
        status: "success",
    },
];
