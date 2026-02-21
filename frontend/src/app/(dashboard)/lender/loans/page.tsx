"use client";

import { useEffect, useState, useCallback } from "react";
import { lenderAPI, LenderInvoice } from "@/lib/api";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import { BookOpen, ExternalLink, Search, RefreshCw, AlertCircle, ShieldCheck, Copy, Check, Banknote, Loader2, X, ChevronDown } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type StatusFilter = "ALL" | "UPLOADED" | "FINANCED" | "BLOCKED";

const STATUS_FILTERS: Array<{ label: string; value: StatusFilter }> = [
    { label: "All",      value: "ALL"      },
    { label: "Pending",  value: "UPLOADED" },
    { label: "Financed", value: "FINANCED" },
    { label: "Blocked",  value: "BLOCKED"  },
];

export default function LenderLoans() {
    const [invoices, setInvoices] = useState<LenderInvoice[]>([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState("");
    const [query, setQuery]       = useState("");
    const [filter, setFilter]     = useState<StatusFilter>("ALL");
    const [total, setTotal]       = useState(0);
    const [copiedId, setCopiedId]   = useState<string | null>(null);
    const [financing, setFinancing]   = useState<string | null>(null);   // invoiceId being financed
    const [confirmInv, setConfirmInv] = useState<LenderInvoice | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);   // invoiceId being updated
    const [openDropdown, setOpenDropdown]     = useState<string | null>(null);   // dropdown open for invoiceId

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

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setOpenDropdown(null);
        if (openDropdown) {
            document.addEventListener("click", handleClickOutside);
            return () => document.removeEventListener("click", handleClickOutside);
        }
    }, [openDropdown]);

    const filtered = invoices.filter(inv => {
        const matchStatus = filter === "ALL" || inv.status === filter;
        const matchQuery  =
            query === "" ||
            inv.invoiceId.toLowerCase().includes(query.toLowerCase()) ||
            (inv.uploadedBy?.organization ?? "").toLowerCase().includes(query.toLowerCase()) ||
            (inv.description ?? "").toLowerCase().includes(query.toLowerCase());
        return matchStatus && matchQuery;
    });

    const handleFinance = async (inv: LenderInvoice) => {
        const token = localStorage.getItem("oneflow-token") ?? "";
        if (!token || token.startsWith("mock.")) { toast.error("Real lender account required."); return; }
        setFinancing(inv.invoiceId);
        setConfirmInv(null);
        try {
            const res = await lenderAPI.financeInvoice(token, inv.invoiceId);
            const tx  = res.data.invoice.financeTxHash ?? "";
            // Update status locally for the financed invoice AND block siblings
            setInvoices(prev =>
                prev.map(i =>
                    i.invoiceId === inv.invoiceId
                        ? { ...i, status: "FINANCED" as const, financeTxHash: tx }
                        : i.ipfsCID && i.ipfsCID === inv.ipfsCID && i.invoiceId !== inv.invoiceId
                        ? { ...i, status: "BLOCKED" as const }
                        : i
                )
            );
            toast.success("Invoice financed", { description: tx ? `TX: ${tx.slice(0,18)}…` : undefined });
        } catch (err: unknown) {
            toast.error("Finance failed", { description: err instanceof Error ? err.message : "Unknown error" });
        } finally {
            setFinancing(null);
        }
    };

    const copyHash = (hash: string, id: string) => {
        navigator.clipboard.writeText(hash);
        setCopiedId(id);
        toast.success("Hash copied");
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleStatusChange = async (inv: LenderInvoice, newStatus: "UPLOADED" | "FINANCED" | "BLOCKED") => {
        if (inv.status === newStatus) { setOpenDropdown(null); return; }
        const token = localStorage.getItem("oneflow-token") ?? "";
        if (!token || token.startsWith("mock.")) { toast.error("Real lender account required."); return; }
        setUpdatingStatus(inv.invoiceId);
        setOpenDropdown(null);
        try {
            const res = await lenderAPI.updateInvoiceStatus(token, inv.invoiceId, newStatus);
            // Update local state for this invoice AND all siblings with same ipfsCID
            setInvoices(prev =>
                prev.map(i =>
                    i.invoiceId === inv.invoiceId
                        ? { ...i, status: newStatus }
                        : i.ipfsCID && i.ipfsCID === inv.ipfsCID
                        ? { ...i, status: newStatus }
                        : i
                )
            );
            toast.success(res.message ?? `Status updated to ${newStatus}`);
        } catch (err: unknown) {
            toast.error("Status update failed", { description: err instanceof Error ? err.message : "Unknown error" });
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
                                    <th className="text-left">Actions</th>
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
                                        <td>
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === inv._id ? null : inv._id); }}
                                                    disabled={updatingStatus === inv.invoiceId}
                                                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-mg-lavender/15 hover:border-mg-lavender/30 transition-colors disabled:opacity-50"
                                                >
                                                    {updatingStatus === inv.invoiceId ? (
                                                        <Loader2 className="w-3 h-3 animate-spin text-mg-dim" />
                                                    ) : (
                                                        <StatusBadge status={inv.status} />
                                                    )}
                                                    <ChevronDown className="w-3 h-3 text-mg-dim" />
                                                </button>
                                                {openDropdown === inv._id && (
                                                    <div className="absolute z-20 top-full left-0 mt-1 w-32 rounded-lg border border-mg-lavender/15 bg-mg-card shadow-lg overflow-hidden"
                                                        onClick={(e) => e.stopPropagation()}>
                                                        {(["UPLOADED", "FINANCED", "BLOCKED"] as const).map(s => (
                                                            <button
                                                                key={s}
                                                                onClick={() => handleStatusChange(inv, s)}
                                                                className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors hover:bg-mg-elevated ${
                                                                    inv.status === s ? "bg-mg-elevated text-mg-silver" : "text-mg-muted"
                                                                }`}
                                                            >
                                                                <StatusBadge status={s} />
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
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
                                                    <button
                                                        onClick={() => setConfirmInv(inv)}
                                                        disabled={financing === inv.invoiceId}
                                                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                                                        style={{ background: "rgba(5,150,105,0.10)", border: "1px solid rgba(5,150,105,0.28)", color: "#059669" }}>
                                                        {financing === inv.invoiceId
                                                            ? <Loader2 className="w-3 h-3 animate-spin" />
                                                            : <Banknote className="w-3 h-3" />}
                                                        Finance
                                                    </button>
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

            {/* Confirm Finance Modal */}
            {confirmInv && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
                >
                    <motion.div
                        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="mg-card rounded-2xl p-6 w-full max-w-md space-y-5"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <p className="font-bold text-mg-silver">Confirm Financing</p>
                            <button onClick={() => setConfirmInv(null)} className="p-1 text-mg-dim hover:text-mg-silver"><X className="w-4 h-4" /></button>
                        </div>
                        <p className="text-sm text-mg-muted">You are about to finance the following invoice on-chain. This action is irreversible.</p>
                        <div className="bg-mg-elevated rounded-xl border border-mg-lavender/10 p-4 space-y-2">
                            {([
                                ["Invoice ID",  confirmInv.invoiceId, true],
                                ["Company",     confirmInv.uploadedBy?.organization ?? "—", false],
                                ["Amount",      `${formatCurrency(confirmInv.amount)} ${confirmInv.currency}`, false],
                                ["Date",        formatDate(confirmInv.createdAt), false],
                            ] as [string, string, boolean][]).map(([k, v, mono]) => (
                                <div key={k} className="flex justify-between items-center gap-4">
                                    <span className="text-xs text-mg-muted">{k}</span>
                                    <span className={`text-sm font-semibold text-mg-silver ${mono ? "font-mono" : ""}`}>{v}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmInv(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-mg-lavender/20 text-sm font-medium text-mg-muted hover:text-mg-silver transition-colors">
                                Cancel
                            </button>
                            <button onClick={() => handleFinance(confirmInv)} disabled={!!financing}
                                className="flex-1 mg-btn-primary justify-center gap-2">
                                {financing ? <><Loader2 className="w-4 h-4 animate-spin" />Processing…</> : <><Banknote className="w-4 h-4" />Finance Invoice</>}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </>
    );
}