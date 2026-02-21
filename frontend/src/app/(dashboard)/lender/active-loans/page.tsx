"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Invoice } from "@/lib/mock/mockInvoices";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate, generateTxHash, cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Coins, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function LenderActiveLoans() {
    const [invoices, setInvoices]     = useState<Invoice[]>([]);
    const [processing, setProcessing] = useState<string | null>(null);
    const [loading, setLoading]       = useState(true);

    useEffect(() => {
        api.invoices.getAll().then((data: Invoice[]) => {
            setInvoices(data.filter(i => i.status === "VERIFIED"));
            setLoading(false);
        });
    }, []);

    const handleDisburse = async (inv: Invoice) => {
        setProcessing(inv.id);
        const txHash = generateTxHash();
        try {
            await api.invoices.disburse(inv.id, "Sarah Smith (Lender)", txHash);
            toast.success("Capital disbursed", { description: `TX: ${txHash.slice(0, 18)}…` });
            setInvoices(prev => prev.filter(i => i.id !== inv.id));
        } finally { setProcessing(null); }
    };

    return (
        <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <p className="mg-label mb-1.5">Lender Console</p>
                <h1 className="text-3xl font-bold text-mg-silver tracking-tight">
                    Active <span className="mg-accent-text">Loan Queue</span>
                </h1>
                <p className="text-sm text-mg-muted mt-1">Verified invoices awaiting capital disbursement</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mg-card rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-mg-lavender/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(5,150,105,0.10)", border: "1px solid rgba(5,150,105,0.22)" }}>
                            <Coins className="w-4 h-4 text-status-success" />
                        </div>
                        <div>
                            <p className="font-semibold text-mg-silver text-sm">Eligible Invoices</p>
                            <p className="text-[10px] text-mg-dim">{invoices.length} awaiting disbursement</p>
                        </div>
                    </div>
                    {invoices.length > 0 && (
                        <p className="text-sm font-bold text-status-success">{formatCurrency(invoices.reduce((s, i) => s + i.amount, 0))} total</p>
                    )}
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="py-16 text-center text-mg-dim text-sm italic">Loading…</div>
                    ) : invoices.length === 0 ? (
                        <div className="py-16 text-center">
                            <Coins className="w-10 h-10 text-mg-dim mx-auto mb-3" />
                            <p className="text-sm text-mg-dim italic">No invoices pending disbursement</p>
                        </div>
                    ) : (
                        <table className="w-full mg-table">
                            <thead>
                                <tr>
                                    <th>Invoice ID</th><th>MSME</th><th>Amount</th><th>Date</th><th>Status</th><th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map(inv => (
                                    <tr key={inv.id}>
                                        <td><span className="font-mono font-semibold text-mg-silver">{inv.id}</span></td>
                                        <td>{inv.borrower}</td>
                                        <td><span className="font-bold text-status-success">{formatCurrency(inv.amount)}</span></td>
                                        <td>{formatDate(inv.timestamp)}</td>
                                        <td><StatusBadge status={inv.status} /></td>
                                        <td>
                                            <button onClick={() => handleDisburse(inv)} disabled={processing === inv.id}
                                                className={cn("px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all",
                                                    processing === inv.id ? "bg-mg-elevated text-mg-dim cursor-not-allowed" : "text-white hover:opacity-90")}
                                                style={processing !== inv.id ? { background: "linear-gradient(135deg, #059669, #10b981)" } : undefined}>
                                                {processing === inv.id ? "Settling…" : "Disburse"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
