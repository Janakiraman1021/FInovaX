"use client";

import { useEffect, useState, useCallback } from "react";
import { lenderAPI, LenderInvoice, APIError } from "@/lib/api";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import { BookOpen, ExternalLink, Search, RefreshCw, AlertCircle, ShieldCheck, Copy, Check, Loader2, Banknote, Lock } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type StatusFilter = "ALL" | "UPLOADED" | "FINANCED" | "BLOCKED";

const STATUS_FILTERS: Array<{ label: string; value: StatusFilter }> = [
    { label: "All",      value: "ALL"      },
    { label: "Pending",  value: "UPLOADED" },
    { label: "Financed", value: "FINANCED" },
    // { label: "Blocked",  value: "BLOCKED"  },
];

export default function LenderLoans() {
    const [invoices, setInvoices] = useState<LenderInvoice[]>([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState("");
    const [query, setQuery]       = useState("");
    const [filter, setFilter]     = useState<StatusFilter>("ALL");
    const [total, setTotal]       = useState(0);
    const [copiedId, setCopiedId]   = useState<string | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);   // invoiceId being updated

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const token = localStorage.getItem("oneflow-token") ?? "";
            const res   = await lenderAPI.getAllInvoices(token, { limit: 100 });
            setInvoices(res.data.invoices);
            setTotal(res.data.pagination.total);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to load invoices");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

    const filtered = invoices.filter(inv => {
        const matchStatus = filter === "ALL" || inv.status === filter;
        const matchQuery  =
            query === "" ||
            inv.invoiceId.toLowerCase().includes(query.toLowerCase()) ||
            (inv.uploadedBy?.organization ?? "").toLowerCase().includes(query.toLowerCase()) ||
            (inv.description ?? "").toLowerCase().includes(query.toLowerCase());
        return matchStatus && matchQuery;
    });

    const copyHash = (hash: string, id: string) => {
        navigator.clipboard.writeText(hash);
        setCopiedId(id);
        toast.success("Hash copied");
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleFinance = async (inv: LenderInvoice) => {
        const token = localStorage.getItem("oneflow-token") ?? "";
        if (!token || token.startsWith("mock.")) { toast.error("Real lender account required."); return; }
        
        if (!inv.canFinance) {
            toast.error("Cannot finance", { description: "This receivable is already financed by another lender." });
            return;
        }
        
        setUpdatingStatus(inv.invoiceId);
        try {
            const res = await lenderAPI.updateInvoiceStatus(token, inv.invoiceId, "FINANCED");
            toast.success(res.message ?? "Invoice financed successfully");
            // Refresh to get updated canFinance flags for all invoices
            fetchInvoices();
        } catch (err: unknown) {
            let msg = "Unknown error";
            if (err instanceof APIError && err.errorCode === "RECEIVABLE_ALREADY_FINANCED") {
                msg = "This receivable was just financed by another lender. Your attempt has been logged.";
            } else if (err instanceof Error) {
                msg = err.message;
            }
            toast.error("Finance failed", { description: msg });
            // Refresh to sync state
            fetchInvoices();
        } finally {
            setUpdatingStatus(null);
        }
    };

    return (
        <>
            <div className="space-y-6">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <p className="mg-label mb-1.5">Lender Console</p>
                        <h1 className="text-2xl sm:text-3xl font-bold text-mg-silver tracking-tight">
                            Invoice <span className="mg-accent-text">Ledger</span>
                        </h1>
                        <p className="text-sm text-mg-muted mt-1">
                            {loading ? "Loading…" : `${total} invoice${total !== 1 ? "s" : ""} on ledger`}
                        </p>
                    </div>
                    <button onClick={fetchInvoices} disabled={loading}
                        className="mg-btn-ghost border border-mg-lavender/20 px-3 py-2 rounded-xl text-mg-muted hover:text-mg-silver transition-colors flex items-center gap-1.5 text-sm disabled:opacity-40">
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                </motion.div>

                {/* Search & filter */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mg-dim" />
                        <input value={query} onChange={e => setQuery(e.target.value)}
                            placeholder="Search by invoice ID, company or description…" className="mg-input pl-9" />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {STATUS_FILTERS.map(f => (
                            <button key={f.value} onClick={() => setFilter(f.value)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                    filter === f.value
                                        ? "bg-mg-cosmic text-white border-mg-cosmic"
                                        : "bg-mg-card text-mg-muted border-mg-lavender/15 hover:border-mg-lavender/30"
                                }`}>
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="flex items-center gap-2 p-4 rounded-xl text-sm text-status-danger"
                        style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.18)" }}>
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                        <button onClick={fetchInvoices} className="ml-auto text-xs underline">Retry</button>
                    </div>
                )}

                {/* Table */}
                <div className="mg-card rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full mg-table">
                            <thead>
                                <tr>
                                    <th className="text-left">Invoice ID</th>
                                    <th className="text-left hidden sm:table-cell">Company</th>
                                    <th className="text-left">Amount</th>
                                    <th className="text-left">Date</th>
                                    <th className="text-left hidden lg:table-cell">Hash</th>
                                    <th className="text-left">Status</th>
                                    <th className="text-left">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} className="py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-7 h-7 rounded-full border-2 border-mg-dim border-t-mg-lavender animate-spin" />
                                            <span className="text-xs text-mg-dim animate-pulse">Fetching ledger…</span>
                                        </div>
                                    </td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan={7} className="py-16 text-center">
                                        <div className="flex flex-col items-center gap-3 text-mg-dim">
                                            <BookOpen className="w-8 h-8 opacity-40" />
                                            <span className="text-sm italic">
                                                {invoices.length === 0 ? "No invoices on ledger yet" : "No invoices match your search"}
                                            </span>
                                        </div>
                                    </td></tr>
                                ) : filtered.map((inv, i) => (
                                    <motion.tr key={inv._id}
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                                        <td>
                                            <p className="font-medium text-mg-silver text-sm">{inv.invoiceId}</p>
                                            <p className="text-[10px] text-mg-dim mt-0.5">{inv.originalFileName ?? "—"}</p>
                                        </td>
                                        <td className="hidden sm:table-cell">
                                            <p className="text-mg-silver text-sm">{inv.uploadedBy?.organization ?? "—"}</p>
                                            <p className="text-[10px] text-mg-dim">{inv.uploadedBy?.name}</p>
                                        </td>
                                        <td className="font-semibold text-mg-silver whitespace-nowrap">
                                            {formatCurrency(inv.amount)}&nbsp;
                                            <span className="text-[10px] font-normal text-mg-dim">{inv.currency}</span>
                                        </td>
                                        <td className="text-mg-muted text-sm whitespace-nowrap">{formatDate(inv.createdAt)}</td>
                                        <td className="hidden lg:table-cell">
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
                                        </td>
                                        <td><StatusBadge status={inv.status} /></td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/lender/verify-hash?hash=${encodeURIComponent(inv.invoiceHash)}`}
                                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                                                    style={{ background: "rgba(74,78,143,0.10)", border: "1px solid rgba(74,78,143,0.22)", color: "#8b8fc8" }}>
                                                    <ShieldCheck className="w-3 h-3" /> Verify
                                                </Link>
                                                {inv.ipfsCID && (
                                                    <a href={`https://ipfs.io/ipfs/${inv.ipfsCID}`} target="_blank" rel="noopener noreferrer"
                                                        className="p-1.5 rounded-md hover:bg-mg-elevated text-mg-dim hover:text-mg-lavender transition-colors inline-flex">
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </a>
                                                )}
                                                {inv.status === "UPLOADED" && (
                                                    inv.isReceivableFinanced ? (
                                                        <span
                                                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
                                                            style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.25)", color: "#dc2626" }}
                                                            title="This receivable is already financed by another lender">
                                                            <Lock className="w-3 h-3" /> Financed
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleFinance(inv)}
                                                            disabled={updatingStatus === inv.invoiceId || !inv.canFinance}
                                                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                            style={{ background: "rgba(5,150,105,0.10)", border: "1px solid rgba(5,150,105,0.28)", color: "#059669" }}
                                                            title={!inv.canFinance ? "Cannot finance: receivable already financed" : "Finance this invoice"}>
                                                            {updatingStatus === inv.invoiceId
                                                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                                                : <Banknote className="w-3 h-3" />}
                                                            Finance
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {!loading && filtered.length > 0 && (
                        <div className="px-5 py-3 border-t border-mg-lavender/08 text-xs text-mg-dim text-right">
                            Showing {filtered.length} of {total}
                        </div>
                    )}
                </div>
            </div>


        </>
    );
}