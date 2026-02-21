"use client";

import { useEffect, useState, useCallback } from "react";
import { lenderAPI, LenderInvoice } from "@/lib/api";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import { Coins, ExternalLink, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function LenderActiveLoans() {
    const [invoices, setInvoices]     = useState<LenderInvoice[]>([]);
    const [processing, setProcessing] = useState<string | null>(null);
    const [loading, setLoading]       = useState(true);

    const fetchInvoices = useCallback(async () => {
        const token = localStorage.getItem("oneflow-token") ?? "";
        if (!token || token.startsWith("mock.")) { setLoading(false); return; }
        setLoading(true);
        try {
            const res = await lenderAPI.getAllInvoices(token, { status: "UPLOADED", limit: 100 });
            setInvoices(res.data.invoices);
        } catch (err: unknown) {
            toast.error("Failed to load invoices", { description: err instanceof Error ? err.message : undefined });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

    const handleDisburse = async (inv: LenderInvoice) => {
        const token = localStorage.getItem("oneflow-token") ?? "";
        if (!token || token.startsWith("mock.")) { toast.error("Real lender account required."); return; }
        setProcessing(inv._id);
        try {
            const res = await lenderAPI.financeInvoice(token, inv.invoiceId);
            const tx  = res.data.invoice.financeTxHash ?? "";
            toast.success("Capital disbursed", { description: tx ? `TX: ${tx.slice(0, 18)}…` : "Financing confirmed" });
            setInvoices(prev => prev.filter(i => i._id !== inv._id));
        } catch (err: unknown) {
            toast.error("Disbursement failed", { description: err instanceof Error ? err.message : undefined });
        } finally {
            setProcessing(null);
        }
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
                    <div className="flex items-center gap-3">
                        {invoices.length > 0 && (
                            <p className="text-sm font-bold text-status-success">{formatCurrency(invoices.reduce((s, i) => s + i.amount, 0))} total</p>
                        )}
                        <button onClick={fetchInvoices} disabled={loading} className="p-2 rounded-lg hover:bg-mg-elevated transition-colors">
                            <RefreshCw className={`w-3.5 h-3.5 text-mg-dim ${loading ? "animate-spin" : ""}`} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="py-16 text-center text-mg-dim text-sm italic"><Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" /></div>
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
                                    <tr key={inv._id}>
                                        <td>
                                            <Link href={`/lender/loan/${inv.invoiceId}`} className="font-mono font-semibold text-mg-cosmic hover:underline">
                                                {inv.invoiceId}
                                            </Link>
                                        </td>
                                        <td>{inv.uploadedBy?.organization ?? inv.uploadedBy?.name ?? "—"}</td>
                                        <td><span className="font-bold text-status-success">{formatCurrency(inv.amount)}</span></td>
                                        <td>{formatDate(inv.createdAt)}</td>
                                        <td><StatusBadge status={inv.status} /></td>
                                        <td>
                                            <button onClick={() => handleDisburse(inv)} disabled={processing === inv._id}
                                                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all ${
                                                    processing === inv._id ? "bg-mg-elevated text-mg-dim cursor-not-allowed" : "text-white hover:opacity-90"}`}
                                                style={processing !== inv._id ? { background: "linear-gradient(135deg, #059669, #10b981)" } : undefined}>
                                                {processing === inv._id ? "Settling…" : "Disburse"}
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
