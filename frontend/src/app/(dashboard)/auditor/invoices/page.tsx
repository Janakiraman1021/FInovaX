"use client";

import { useEffect, useState, useCallback } from "react";
import { auditorAPI, LenderInvoice } from "@/lib/api";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import { FileText, Search, ExternalLink, RefreshCw, AlertCircle, Copy, Check } from "lucide-react";

const STATUSES = ["ALL", "UPLOADED", "FINANCED", "BLOCKED"] as const;
type StatusFilter = typeof STATUSES[number];

export default function AuditorInvoices() {
    const [invoices, setInvoices] = useState<LenderInvoice[]>([]);
    const [query, setQuery]       = useState("");
    const [filter, setFilter]     = useState<StatusFilter>("ALL");
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState("");
    const [total, setTotal]       = useState(0);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const token = localStorage.getItem("oneflow-token") ?? "";
            const res   = await auditorAPI.getAllInvoices(token, { limit: 200 });
            setInvoices(res.data.invoices);
            setTotal(res.data.pagination.total);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to load invoices");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

    const copyHash = (hash: string, id: string) => {
        navigator.clipboard.writeText(hash);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const filtered = invoices.filter(inv => {
        const matchStatus = filter === "ALL" || inv.status === filter;
        const matchQuery  = !query ||
            inv.invoiceId.toLowerCase().includes(query.toLowerCase()) ||
            (inv.uploadedBy?.organization ?? "").toLowerCase().includes(query.toLowerCase()) ||
            (inv.description ?? "").toLowerCase().includes(query.toLowerCase()) ||
            inv.invoiceHash.toLowerCase().includes(query.toLowerCase());
        return matchStatus && matchQuery;
    });

    return (
        <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <p className="mg-label mb-1.5">Regulator View</p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-mg-silver tracking-tight">
                        All <span className="mg-accent-text">Invoices</span>
                    </h1>
                    <p className="text-sm text-mg-muted mt-1">
                        {loading ? "Loading…" : `${total} invoice${total !== 1 ? "s" : ""} in the system`}
                    </p>
                </div>
                <button onClick={fetchInvoices} disabled={loading}
                    className="mg-btn-ghost border border-mg-lavender/20 px-3 py-2 rounded-xl text-mg-muted hover:text-mg-silver transition-colors flex items-center gap-1.5 text-sm disabled:opacity-40">
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </motion.div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 p-4 rounded-xl text-sm text-status-danger"
                    style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.18)" }}>
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                    <button onClick={fetchInvoices} className="ml-auto text-xs underline">Retry</button>
                </div>
            )}

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mg-card rounded-2xl overflow-hidden">
                {/* Toolbar */}
                <div className="px-6 py-4 border-b border-mg-lavender/10 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                        {STATUSES.map(s => (
                            <button key={s} onClick={() => setFilter(s)}
                                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                                    filter === s
                                        ? "bg-mg-cosmic text-white shadow-[0_0_8px_rgba(74,78,143,0.35)]"
                                        : "bg-mg-elevated text-mg-dim hover:text-mg-silver border border-mg-lavender/12"
                                }`}>
                                {s}
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-mg-dim" />
                        <input value={query} onChange={e => setQuery(e.target.value)}
                            placeholder="Search by ID, company, hash…" className="mg-input pl-8 text-sm w-60" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="py-16 text-center">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-7 h-7 rounded-full border-2 border-mg-dim border-t-mg-lavender animate-spin" />
                                <span className="text-xs text-mg-dim animate-pulse">Fetching invoices…</span>
                            </div>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-16 text-center">
                            <FileText className="w-10 h-10 text-mg-dim mx-auto mb-3 opacity-40" />
                            <p className="text-sm text-mg-dim italic">
                                {invoices.length === 0 ? "No invoices in the system yet" : "No invoices match your search"}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full mg-table">
                            <thead>
                                <tr>
                                    {["Invoice ID", "Company", "Amount", "Date", "Hash", "Status", "IPFS"].map(h => (
                                        <th key={h} className="text-left">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((inv, i) => (
                                    <motion.tr key={inv._id}
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                                        <td>
                                            <p className="font-mono font-semibold text-mg-silver text-sm">{inv.invoiceId}</p>
                                            <p className="text-[10px] text-mg-dim mt-0.5">{inv.description ?? "—"}</p>
                                        </td>
                                        <td>
                                            <p className="text-mg-silver text-sm">{inv.uploadedBy?.organization ?? "—"}</p>
                                            <p className="text-[10px] text-mg-dim">{inv.uploadedBy?.name}</p>
                                        </td>
                                        <td className="font-bold text-mg-cosmic whitespace-nowrap">
                                            {formatCurrency(inv.amount)}&nbsp;
                                            <span className="text-[10px] font-normal text-mg-dim">{inv.currency}</span>
                                        </td>
                                        <td className="text-mg-muted text-sm whitespace-nowrap">{formatDate(inv.createdAt)}</td>
                                        <td>
                                            {inv.invoiceHash ? (
                                                <button onClick={() => copyHash(inv.invoiceHash, inv._id)}
                                                    title={inv.invoiceHash}
                                                    className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-mg-elevated transition-colors group">
                                                    <span className="font-mono text-[10px] text-mg-dim group-hover:text-mg-muted">
                                                        {inv.invoiceHash.slice(0, 8)}…{inv.invoiceHash.slice(-4)}
                                                    </span>
                                                    {copiedId === inv._id
                                                        ? <Check className="w-3 h-3 text-status-success shrink-0" />
                                                        : <Copy className="w-3 h-3 text-mg-dim group-hover:text-mg-lavender shrink-0" />}
                                                </button>
                                            ) : (
                                                <span className="text-[10px] text-mg-dim italic">N/A</span>
                                            )}
                                        </td>
                                        <td><StatusBadge status={inv.status} /></td>
                                        <td>
                                            {inv.ipfsCID ? (
                                                <a href={`https://ipfs.io/ipfs/${inv.ipfsCID}`}
                                                    target="_blank" rel="noopener noreferrer"
                                                    className="p-1.5 rounded-md hover:bg-mg-elevated text-mg-dim hover:text-mg-lavender transition-colors inline-flex">
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            ) : <span className="text-mg-dim text-xs">—</span>}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {!loading && filtered.length > 0 && (
                    <div className="px-6 py-3 border-t border-mg-lavender/08 text-xs text-mg-dim text-right">
                        Showing {filtered.length} of {total}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
