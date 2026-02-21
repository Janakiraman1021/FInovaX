"use client";

import { useEffect, useState, useCallback } from "react";
import { invoiceAPI, blockchainAPI, UploadedInvoice } from "@/lib/api";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import { ExternalLink, FileText, Search, RefreshCw, AlertCircle, Copy, Check, Link2, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const ETHERSCAN = "https://sepolia.etherscan.io/tx/";

type StatusFilter = "ALL" | "UPLOADED" | "FINANCED" | "BLOCKED";

const STATUS_FILTERS: Array<{ label: string; value: StatusFilter }> = [
    { label: "All",      value: "ALL"      },
    { label: "Uploaded", value: "UPLOADED" },
    { label: "Financed", value: "FINANCED" },
    { label: "Blocked",  value: "BLOCKED"  },
];

export default function MSMEInvoicesPage() {
    const [invoices, setInvoices] = useState<UploadedInvoice[]>([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState("");
    const [query, setQuery]       = useState("");
    const [filter, setFilter]     = useState<StatusFilter>("ALL");
    const [total, setTotal]       = useState(0);
    const [copiedId, setCopiedId]       = useState<string | null>(null);
    const [registering, setRegistering] = useState<string | null>(null);  // invoiceId being registered

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleRegisterOnChain = async (inv: UploadedInvoice) => {
        const token = localStorage.getItem("oneflow-token") ?? "";
        if (!token || token.startsWith("mock.")) { toast.error("Real account required."); return; }
        setRegistering(inv.invoiceId);
        try {
            const res = await blockchainAPI.registerInvoice(token, inv.invoiceId);
            toast.success("Registered on-chain!", { description: res.data.blockchainTxHash.slice(0, 20) + "…" });
            // Patch local state so the row updates immediately without re-fetch
            setInvoices(prev => prev.map(i =>
                i.invoiceId === inv.invoiceId
                    ? { ...i, blockchainTxHash: res.data.blockchainTxHash }
                    : i
            ));
        } catch (err: unknown) {
            toast.error("Registration failed", { description: err instanceof Error ? err.message : "Unknown error" });
        } finally {
            setRegistering(null);
        }
    };

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const token = localStorage.getItem("oneflow-token") ?? "";
            const res   = await invoiceAPI.getMyInvoices(token, { limit: 100 });
            setInvoices(res.data.invoices as UploadedInvoice[]);
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
            (inv.description ?? "").toLowerCase().includes(query.toLowerCase()) ||
            inv.invoiceHash.toLowerCase().includes(query.toLowerCase());
        return matchStatus && matchQuery;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
                <div>
                    <p className="mg-label mb-1.5">MSME Portal</p>
                    <h1 className="text-3xl font-bold text-mg-silver tracking-tight">
                        My <span className="mg-accent-text">Invoices</span>
                    </h1>
                    <p className="text-sm text-mg-muted mt-1">
                        {loading ? "Loading…" : `${total} invoice${total !== 1 ? "s" : ""} on ledger`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchInvoices} disabled={loading}
                        className="mg-btn-ghost border border-mg-lavender/20 px-3 py-2 rounded-xl text-mg-muted hover:text-mg-silver transition-colors flex items-center gap-1.5 text-sm disabled:opacity-40">
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                    <Link href="/msme/invoices/upload" className="mg-btn-primary text-sm gap-2">
                        <FileText className="w-4 h-4" /> Upload Invoice
                    </Link>
                </div>
            </motion.div>

            {/* Search & filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mg-dim" />
                    <input value={query} onChange={e => setQuery(e.target.value)}
                        placeholder="Search by invoice ID, description or hash…" className="mg-input pl-9" />
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

            {/* Error state */}
            {error && (
                <div className="flex items-center gap-2 p-4 rounded-xl text-sm text-status-danger"
                    style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.18)" }}>
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                    <button onClick={fetchInvoices} className="ml-auto text-xs underline hover:no-underline">Retry</button>
                </div>
            )}

            {/* Table */}
            <div className="mg-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full mg-table">
                        <thead>
                            <tr>
                                {["Invoice ID", "Description", "Amount", "Date", "Status", "CID", "IPFS", "On-Chain"].map(h => (
                                    <th key={h} className="text-left">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} className="py-16 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-7 h-7 rounded-full border-2 border-mg-dim border-t-mg-lavender animate-spin" />
                                        <span className="text-xs text-mg-dim animate-pulse">Fetching invoices…</span>
                                    </div>
                                </td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={8} className="py-16 text-center">
                                    <div className="flex flex-col items-center gap-3 text-mg-dim">
                                        <FileText className="w-8 h-8 opacity-40" />
                                        <span className="text-sm italic">
                                            {invoices.length === 0
                                                ? "No invoices yet — upload your first one!"
                                                : "No invoices match your search"}
                                        </span>
                                        {invoices.length === 0 && (
                                            <Link href="/msme/invoices/upload" className="mg-btn-primary text-xs mt-1">
                                                Upload Invoice
                                            </Link>
                                        )}
                                    </div>
                                </td></tr>
                            ) : filtered.map((inv, i) => (
                                <motion.tr key={inv.invoiceId}
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                                    <td>
                                        <p className="font-medium text-mg-silver text-sm">{inv.invoiceId}</p>
                                        <p className="font-mono text-[10px] text-mg-dim mt-0.5 truncate max-w-[140px]">
                                            {inv.invoiceHash.slice(0, 14)}…
                                        </p>
                                    </td>
                                    <td className="text-mg-muted text-sm max-w-[180px] truncate">
                                        {inv.description || <span className="italic text-mg-dim">—</span>}
                                    </td>
                                    <td className="font-semibold text-mg-silver whitespace-nowrap">
                                        {formatCurrency(inv.amount)}&nbsp;
                                        <span className="text-[10px] font-normal text-mg-dim">{inv.currency}</span>
                                    </td>
                                    <td className="text-mg-muted text-sm whitespace-nowrap">
                                        {formatDate(inv.createdAt)}
                                    </td>
                                    <td><StatusBadge status={inv.status} /></td>
                                    <td>
                                        {inv.ipfsCID ? (
                                            <button
                                                onClick={() => copyToClipboard(inv.ipfsCID!, inv.invoiceId)}
                                                title={inv.ipfsCID}
                                                className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-mg-elevated transition-colors group max-w-[110px]">
                                                <span className="font-mono text-[10px] text-mg-dim group-hover:text-mg-muted truncate">
                                                    {inv.ipfsCID.slice(0, 8)}…{inv.ipfsCID.slice(-4)}
                                                </span>
                                                {copiedId === inv.invoiceId
                                                    ? <Check className="w-3 h-3 text-status-success shrink-0" />
                                                    : <Copy className="w-3 h-3 text-mg-dim group-hover:text-mg-lavender shrink-0" />}
                                            </button>
                                        ) : <span className="text-mg-dim text-xs">—</span>}
                                    </td>
                                    <td>
                                        {inv.ipfsCID ? (
                                            <a href={`https://ipfs.io/ipfs/${inv.ipfsCID}`}
                                                target="_blank" rel="noopener noreferrer"
                                                title={inv.ipfsCID}
                                                className="p-1.5 rounded-md hover:bg-mg-elevated text-mg-dim hover:text-mg-lavender transition-colors inline-flex">
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        ) : <span className="text-mg-dim text-xs">—</span>}
                                    </td>
                                    {/* On-Chain column */}
                                    <td>
                                        {inv.blockchainTxHash ? (
                                            <div className="flex items-center gap-1.5">
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                                                    style={{ background: "rgba(5,150,105,0.12)", color: "#10b981", border: "1px solid rgba(5,150,105,0.25)" }}>
                                                    <Link2 className="w-2.5 h-2.5" /> Anchored
                                                </span>
                                                <button onClick={() => copyToClipboard(inv.blockchainTxHash!, inv.invoiceId + "-tx")}
                                                    title={"Copy TX: " + inv.blockchainTxHash}
                                                    className="p-1 rounded hover:bg-mg-elevated transition-colors">
                                                    {copiedId === inv.invoiceId + "-tx"
                                                        ? <Check className="w-3 h-3 text-status-success" />
                                                        : <Copy className="w-3 h-3 text-mg-dim hover:text-mg-lavender" />}
                                                </button>
                                                <a href={`${ETHERSCAN}${inv.blockchainTxHash}`} target="_blank" rel="noopener noreferrer"
                                                    title="View on Etherscan"
                                                    className="p-1 rounded hover:bg-mg-elevated transition-colors inline-flex">
                                                    <ExternalLink className="w-3 h-3 text-mg-dim hover:text-mg-cosmic" />
                                                </a>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleRegisterOnChain(inv)}
                                                disabled={registering === inv.invoiceId}
                                                title="Register this invoice hash on Sepolia"
                                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all disabled:opacity-60 hover:-translate-y-0.5"
                                                style={{ background: "rgba(74,78,143,0.12)", color: "#a5b4fc", border: "1px solid rgba(74,78,143,0.25)" }}>
                                                {registering === inv.invoiceId
                                                    ? <><Loader2 className="w-3 h-3 animate-spin" /> Anchoring…</>
                                                    : <><Link2 className="w-3 h-3" /> Register On-Chain</>}
                                            </button>
                                        )}
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination hint */}
                {!loading && filtered.length > 0 && (
                    <div className="px-5 py-3 border-t border-mg-lavender/08 text-xs text-mg-dim text-right">
                        Showing {filtered.length} of {total}
                    </div>
                )}
            </div>
        </div>
    );
}
