"use client";

import { useEffect, useState, useCallback } from "react";
import { invoiceAPI, authAPI, blockchainAPI, UploadedInvoice, LenderListItem, APIError } from "@/lib/api";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, FileText, Search, RefreshCw, AlertCircle, Copy, Check, Link2, Loader2, Send, X } from "lucide-react";
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
    
    // Submit to lender modal
    const [submitModalOpen, setSubmitModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<UploadedInvoice | null>(null);
    const [lenders, setLenders] = useState<LenderListItem[]>([]);
    const [selectedLenderId, setSelectedLenderId] = useState("");
    const [submitting, setSubmitting] = useState(false);

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

    // Fetch lenders for submit modal
    useEffect(() => {
        const token = localStorage.getItem("oneflow-token");
        if (!token || token.startsWith("mock.")) return;
        authAPI.getLenders(token)
            .then(res => setLenders(res.data))
            .catch(() => { /* optional */ });
    }, []);

    const handleOpenSubmitModal = (inv: UploadedInvoice) => {
        setSelectedInvoice(inv);
        setSelectedLenderId("");
        setSubmitModalOpen(true);
    };

    const handleSubmitToLender = async () => {
        if (!selectedInvoice || !selectedLenderId) return;
        
        const token = localStorage.getItem("oneflow-token") ?? "";
        if (!token || token.startsWith("mock.")) {
            toast.error("Real account required.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await invoiceAPI.submitToLender(token, selectedInvoice.invoiceId, selectedLenderId);
            toast.success("Invoice submitted!", {
                description: `Sent to ${res.data.lenderOrganization}`,
            });
            setSubmitModalOpen(false);
            // Refresh invoices to show updated submittedTo list
            fetchInvoices();
        } catch (err: unknown) {
            let msg = "Submission failed";
            if (err instanceof APIError && err.errorCode === "DUPLICATE_LENDER_SUBMISSION") {
                msg = "This invoice was already submitted to this lender.";
            } else if (err instanceof Error) {
                msg = err.message;
            }
            toast.error("Submission failed", { description: msg });
        } finally {
            setSubmitting(false);
        }
    };

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
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <p className="mg-label mb-1.5">MSME Portal</p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-mg-silver tracking-tight">
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
                                <th className="text-left">Invoice ID</th>
                                <th className="text-left hidden sm:table-cell">Description</th>
                                <th className="text-left">Amount</th>
                                <th className="text-left">Date</th>
                                <th className="text-left">Status</th>
                                <th className="text-left hidden lg:table-cell">Submitted To</th>
                                <th className="text-left hidden md:table-cell">CID</th>
                                <th className="text-left hidden md:table-cell">IPFS</th>
                                <th className="text-left hidden sm:table-cell">On-Chain</th>
                                <th className="text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={10} className="py-16 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-7 h-7 rounded-full border-2 border-mg-dim border-t-mg-lavender animate-spin" />
                                        <span className="text-xs text-mg-dim animate-pulse">Fetching invoices…</span>
                                    </div>
                                </td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={10} className="py-16 text-center">
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
                                    <td className="text-mg-muted text-sm max-w-[180px] truncate hidden sm:table-cell">
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
                                    <td className="hidden lg:table-cell">
                                        {inv.submittedTo && inv.submittedTo.length > 0 ? (
                                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                {inv.submittedTo.map(lender => (
                                                    <span key={lender._id}
                                                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-mg-cosmic/10 text-mg-lavender border border-mg-lavender/20"
                                                        title={lender.organization}>
                                                        {lender.name}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-mg-dim italic">None</span>
                                        )}
                                    </td>
                                    <td className="hidden md:table-cell">
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
                                    <td className="hidden md:table-cell">
                                        {inv.ipfsCID ? (
                                            <a href={`https://ipfs.io/ipfs/${inv.ipfsCID}`}
                                                target="_blank" rel="noopener noreferrer"
                                                title={inv.ipfsCID}
                                                className="p-1.5 rounded-md hover:bg-mg-elevated text-mg-dim hover:text-mg-lavender transition-colors inline-flex">
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        ) : <span className="text-mg-dim text-xs">—</span>}
                                    </td>
                                    <td className="hidden sm:table-cell">
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
                                    <td>
                                        <button
                                            onClick={() => handleOpenSubmitModal(inv)}
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all hover:bg-mg-cosmic/10 hover:text-mg-lavender border border-mg-lavender/20 hover:border-mg-lavender/40 text-mg-muted whitespace-nowrap">
                                            <Send className="w-3 h-3" /> Submit to Lender
                                        </button>
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

            {/* Submit to Lender Modal */}
            <AnimatePresence>
                {submitModalOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSubmitModalOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />
                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
                            <div className="mg-card rounded-2xl p-6 space-y-4">
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-mg-silver">Submit to Lender</h3>
                                        <p className="text-xs text-mg-dim mt-1">
                                            Invoice: {selectedInvoice?.invoiceId}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setSubmitModalOpen(false)}
                                        className="p-1.5 rounded-lg hover:bg-mg-elevated transition-colors text-mg-dim hover:text-mg-silver">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Already submitted list */}
                                {selectedInvoice?.submittedTo && selectedInvoice.submittedTo.length > 0 && (
                                    <div className="p-3 rounded-lg bg-mg-elevated/50 border border-mg-lavender/10">
                                        <p className="text-[10px] uppercase tracking-widest font-semibold text-mg-dim mb-2">
                                            Already Submitted To
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedInvoice.submittedTo.map(lender => (
                                                <span key={lender._id}
                                                    className="inline-flex items-center px-2 py-1 rounded text-[10px] font-semibold bg-mg-cosmic/15 text-mg-lavender">
                                                    {lender.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Lender selection */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-mg-silver">
                                        Select Lender
                                    </label>
                                    <select
                                        value={selectedLenderId}
                                        onChange={e => setSelectedLenderId(e.target.value)}
                                        disabled={submitting}
                                        className="w-full px-3 py-2 rounded-lg bg-mg-elevated border border-mg-lavender/10 text-mg-silver text-sm focus:outline-none focus:border-mg-cosmic transition-colors disabled:opacity-50">
                                        <option value="">— Select a lender —</option>
                                        {lenders
                                            .filter(l => !selectedInvoice?.submittedTo?.some(s => s._id === l._id))
                                            .map(l => (
                                                <option key={l._id} value={l._id}>
                                                    {l.name}{l.organization ? ` — ${l.organization}` : ""}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setSubmitModalOpen(false)}
                                        disabled={submitting}
                                        className="flex-1 px-4 py-2 rounded-lg border border-mg-lavender/20 text-mg-muted font-semibold text-sm hover:border-mg-lavender/40 transition-colors disabled:opacity-50">
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmitToLender}
                                        disabled={!selectedLenderId || submitting}
                                        className="flex-1 px-4 py-2 rounded-lg bg-mg-cosmic text-white font-semibold text-sm hover:bg-mg-cosmic/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                        {submitting ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                                        ) : (
                                            <><Send className="w-4 h-4" /> Submit</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
