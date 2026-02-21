export interface LedgerEntry {
    invoiceHash: string;
    exists: boolean;
    financedBy?: string;
    txHash?: string;
    timestamp: string;
}

export const mockLedger: Record<string, LedgerEntry> = {
    "3e236746e53460e4479e4369e9846cd4d67385923c92c813589b9468081682c3": {
        invoiceHash: "3e236746e53460e4479e4369e9846cd4d67385923c92c813589b9468081682c3",
        exists: true,
        financedBy: "Global Finance Bank",
        txHash: "0xFINO742893acbd8e5bdf9283749acbd",
        timestamp: "2024-05-15T10:30:00Z",
    },
    "f6e0b3c3b5d2a9f9a2b8e3d4c5b6a7f8e9d0c1b2a3b4c5d6e7f8g9h0i1j2k3l4": {
        invoiceHash: "f6e0b3c3b5d2a9f9a2b8e3d4c5b6a7f8e9d0c1b2a3b4c5d6e7f8g9h0i1j2k3l4",
        exists: true,
        timestamp: "2024-05-18T14:20:00Z",
    },
};

export const simulateLedgerLookup = async (hash: string): Promise<Partial<LedgerEntry>> => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const entry = mockLedger[hash];
    if (entry) {
        return entry;
    }
    return { exists: false };
};
