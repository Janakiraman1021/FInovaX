"use client";

import { useEffect, useState, useCallback } from "react";
import { auditorAPI, LenderInvoice } from "@/lib/api";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import { Clock, Search, RefreshCw, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function AuditorPendingInvoices() {
    const [invoices, setInvoices] = useState<LenderInvoice[]>([]);
    const [query, setQuery]       = useState("");
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState("");

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const token = localStorage.getItem("finovax-token") ?? "";
            const res = await auditorAPI.getAllInvoices(token, { status: "UPLOADED", limit: 200 });
            setInvoices(res.data.invoices);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to load invoices");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

    const filtered = invoices.filter(inv =>
        !query ||
        inv.invoiceId.toLowerCase().includes(query.toLowerCase()) ||
        (inv.uploadedBy?.organization ?? "").toLowerCase().includes(query.toLowerCase()) ||
        (inv.description ?? "").toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
                <div>
                    <p className="mg-label mb-1.5">Regulator View</p>
                    <h1 className="text-3xl font-bold text-mg-silver tracking-tight">
                        Pending <span className="mg-accent-text">Review</span>
                    </h1>
                    <p className="text-sm text-mg-muted mt-1">Uploaded invoices awaiting financing or audit action</p>
                </div>
                <button onClick={fetchInvoices} disabled={loading}
                    className="mg-btn-ghost border border-mg-lavender/20 px-3 py-2 rounded-xl text-mg-muted hover:text-mg-silver transition-colors flex items-center gap-1.5 text-sm disabled:opacity-40">
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </motion.div>

            {error && (
                <div className="flex items-center gap-2 p-4 rounded-xl text-sm text-status-danger"
                    style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.18)" }}>
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                    <button onClick={fetchInvoices} className="ml-auto text-xs underline">Retry</button>
                </div>
            )}

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mg-card rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-mg-lavender/10 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(234,179,8,0.10)", border: "1px solid rgba(234,179,8,0.22)" }}>
                            <Clock className="w-4 h-4 text-status-warning" />
                        </div>
                        <div>
                            <p className="font-semibold text-mg-silver text-sm">Uploaded Invoices</p>
                            <p className="text-[10px] text-mg-dim">{loading ? "Loading…" : `${filtered.length} awaiting financing`}</p>
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-mg-dim" />
                        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search ID or org…" className="mg-input pl-8 text-sm w-52" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    {loading ? <div className="py-16 text-center text-mg-dim text-sm italic">Loading…</div>
                    : filtered.length === 0 ? <div className="py-16 text-center"><Clock className="w-10 h-10 text-mg-dim mx-auto mb-3" /><p className="text-sm text-mg-dim italic">No pending invoices</p></div>
                    : (
                        <table className="w-full mg-table">
                            <thead><tr><th>Invoice ID</th><th>MSME</th><th>Amount</th><th>Submitted</th><th>Status</th><th>Inspect</th></tr></thead>
                            <tbody>
                                {filtered.map(inv => (
                                    <tr key={inv._id}>
                                        <td><span className="font-mono font-semibold text-mg-silver">{inv.invoiceId}</span></td>
                                        <td>{inv.uploadedBy?.organization ?? "—"}</td>
                                        <td><span className="font-bold text-mg-cosmic">{formatCurrency(inv.amount)}</span></td>
                                        <td>{formatDate(inv.createdAt)}</td>
                                        <td><StatusBadge status={inv.status} /></td>
                                        <td>
                                            <Link href={`/auditor/invoices/pending/${encodeURIComponent(inv.invoiceId)}`}
                                                className="px-3 py-1 rounded-lg text-xs font-semibold bg-mg-elevated border border-mg-lavender/15 text-mg-cosmic hover:border-mg-cosmic/30 transition-colors">
                                                Inspect →
                                            </Link>
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
