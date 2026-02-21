"use client";

import { useEffect, useState, useCallback } from "react";
import { auditorAPI, AuditLog } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import {
    ClipboardCheck, Download, Search, RefreshCw, AlertCircle,
    ChevronLeft, ChevronRight, ExternalLink, FileText,
    ShieldCheck, ShieldAlert, Link2, Ban,
} from "lucide-react";
import { toast } from "sonner";

const INVOICE_EVENT_TYPES = [
    "invoice_uploaded",
    "invoice_registered_on_chain",
    "invoice_financed",
    "invoice_verified",
    "finance_blocked_duplicate",
    "InvoiceRegistered",
    "InvoiceFinanced",
    "DuplicateFinancingAttempt",
] as const;

const EVENT_FILTERS = [
    "ALL",
    ...INVOICE_EVENT_TYPES,
] as const;

type EventFilter = typeof EVENT_FILTERS[number];

const EVENT_META: Record<string, { label: string; color: string; Icon: React.FC<{ className?: string }> }> = {
    invoice_uploaded:              { label: "Invoice Uploaded",        color: "#0891b2", Icon: FileText      },
    invoice_registered_on_chain:   { label: "On-Chain Registered",     color: "#059669", Icon: Link2         },
    InvoiceRegistered:             { label: "On-Chain Registered",     color: "#059669", Icon: Link2         },
    invoice_financed:              { label: "Invoice Financed",        color: "#059669", Icon: ShieldCheck   },
    InvoiceFinanced:               { label: "Invoice Financed",        color: "#059669", Icon: ShieldCheck   },
    invoice_verified:              { label: "Invoice Verified",        color: "#7c3aed", Icon: ShieldCheck   },
    finance_blocked_duplicate:     { label: "Duplicate Blocked",       color: "#dc2626", Icon: Ban           },
    DuplicateFinancingAttempt:     { label: "Duplicate Blocked",       color: "#dc2626", Icon: ShieldAlert   },
};

const DEFAULT_META = { label: "System Event", color: "#888", Icon: ClipboardCheck };

const PAGE_SIZE = 25;

export default function AuditFile() {
    const [logs, setLogs]       = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState("");
    const [query, setQuery]     = useState("");
    const [filter, setFilter]   = useState<EventFilter>("ALL");
    const [page, setPage]       = useState(1);
    const [total, setTotal]     = useState(0);
    const totalPages = Math.ceil(total / PAGE_SIZE);

    const fetchLogs = useCallback(async (pg = 1, ev: EventFilter = "ALL") => {
        setLoading(true);
        setError("");
        try {
            const token = localStorage.getItem("oneflow-token") ?? "";
            const res   = await auditorAPI.getAuditLogs(token, {
                page: pg,
                limit: PAGE_SIZE,
                eventType: ev !== "ALL" ? ev : undefined,
            });
            setLogs(res.data.logs);
            setTotal(res.data.pagination.total);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to load audit logs");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchLogs(page, filter); }, [fetchLogs, page, filter]);

    // Reset to page 1 when filter changes
    const handleFilter = (ev: EventFilter) => {
        setFilter(ev);
        setPage(1);
    };

    const handleExport = () => {
        const rows = [
            ["Timestamp", "Event", "Performed By", "Role", "Invoice ID", "TX Hash", "IP"],
            ...logs.map(l => [
                formatDate(l.createdAt),
                l.eventType,
                l.performedBy?.email ?? l.actorAddress ?? "—",
                l.performedBy?.role ?? "on-chain",
                l.invoiceId?.invoiceId ?? "—",
                l.txHash ?? "—",
                l.ipAddress ?? "—",
            ]),
        ];
        const csv  = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href = url; a.download = `audit-log-${Date.now()}.csv`; a.click();
        URL.revokeObjectURL(url);
        toast.success("Audit log exported");
    };

    const searched = logs
        .filter(l => {
            if (!query) return true;
            const q = query.toLowerCase();
            return (
                l.eventType.toLowerCase().includes(q) ||
                (l.performedBy?.email ?? "").toLowerCase().includes(q) ||
                (l.performedBy?.name ?? "").toLowerCase().includes(q) ||
                (l.invoiceId?.invoiceId ?? "").toLowerCase().includes(q) ||
                (l.txHash ?? "").toLowerCase().includes(q)
            );
        });

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <p className="mg-label mb-1.5">Regulator View</p>
                    <h1 className="text-3xl font-bold text-mg-silver tracking-tight">
                        Audit <span className="mg-accent-text">Trail</span>
                    </h1>
                    <p className="text-sm text-mg-muted mt-1">
                        {loading ? "Loading…" : `${total} event${total !== 1 ? "s" : ""} recorded`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => fetchLogs(page, filter)} disabled={loading}
                        className="mg-btn-ghost border border-mg-lavender/20 px-3 py-2 rounded-xl text-mg-muted hover:text-mg-silver transition-colors flex items-center gap-1.5 text-sm disabled:opacity-40">
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                    <button onClick={handleExport} disabled={logs.length === 0} className="mg-btn-primary gap-2 disabled:opacity-40">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                </div>
            </motion.div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 p-4 rounded-xl text-sm text-status-danger"
                    style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.18)" }}>
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                    <button onClick={() => fetchLogs(page, filter)} className="ml-auto text-xs underline">Retry</button>
                </div>
            )}

            {/* Filters + search */}
            <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                    {EVENT_FILTERS.map(ev => (
                        <button key={ev} onClick={() => handleFilter(ev)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                                filter === ev
                                    ? "bg-mg-cosmic text-white shadow-[0_0_8px_rgba(74,78,143,0.35)]"
                                    : "bg-mg-elevated text-mg-dim hover:text-mg-silver border border-mg-lavender/12"
                            }`}>
                            {ev === "ALL" ? "All" : (EVENT_META[ev]?.label ?? ev.replace(/_/g, " "))}
                        </button>
                    ))}
                </div>
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-mg-dim" />
                    <input value={query} onChange={e => setQuery(e.target.value)}
                        placeholder="Search event, user, invoice ID, tx hash…" className="mg-input pl-8 text-sm" />
                </div>
            </div>

            {/* Table */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="mg-card rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-mg-lavender/10 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(74,78,143,0.09)", border: "1px solid rgba(74,78,143,0.20)" }}>
                        <ClipboardCheck className="w-4 h-4 text-mg-lavender" />
                    </div>
                    <p className="font-semibold text-mg-silver text-sm">
                        {searched.length} event{searched.length !== 1 ? "s" : ""} on this page
                    </p>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="py-16 text-center flex flex-col items-center gap-3">
                            <div className="w-7 h-7 rounded-full border-2 border-mg-dim border-t-mg-lavender animate-spin" />
                            <span className="text-xs text-mg-dim animate-pulse">Fetching audit records…</span>
                        </div>
                    ) : searched.length === 0 ? (
                        <div className="py-16 text-center">
                            <ClipboardCheck className="w-10 h-10 text-mg-dim mx-auto mb-3 opacity-40" />
                            <p className="text-sm text-mg-dim italic">No audit events found</p>
                        </div>
                    ) : (
                        <table className="w-full mg-table">
                            <thead>
                                <tr>
                                    {["Timestamp", "Event", "Performed By", "Invoice", "TX Hash", "IP"].map(h => (
                                        <th key={h} className="text-left">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {searched.map((log, i) => {
                                    const meta = EVENT_META[log.eventType] ?? DEFAULT_META;
                                    const IconComp = meta.Icon;
                                    return (
                                        <motion.tr key={log._id}
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.015 }}>
                                            <td className="text-mg-muted text-xs whitespace-nowrap">
                                                {formatDate(log.createdAt)}
                                            </td>
                                            <td>
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                                                    style={{
                                                        background: `${meta.color}18`,
                                                        border: `1px solid ${meta.color}30`,
                                                        color: meta.color,
                                                    }}>
                                                    <IconComp className="w-3 h-3" />
                                                    {meta.label}
                                                </span>
                                            </td>
                                            <td>
                                                {log.performedBy ? (
                                                    <div>
                                                        <p className="text-mg-silver text-xs font-medium">{log.performedBy.name}</p>
                                                        <p className="text-mg-dim text-[10px]">{log.performedBy.email} · {log.performedBy.role}</p>
                                                    </div>
                                                ) : log.actorAddress ? (
                                                    <span className="font-mono text-[10px] text-mg-dim">{log.actorAddress.slice(0, 10)}…</span>
                                                ) : (
                                                    <span className="text-mg-dim text-xs">—</span>
                                                )}
                                            </td>
                                            <td>
                                                {log.invoiceId ? (
                                                    <div>
                                                        <p className="font-mono text-xs text-mg-silver">{log.invoiceId.invoiceId}</p>
                                                        <p className="text-[10px] text-mg-dim">Status: {log.invoiceId.status}</p>
                                                    </div>
                                                ) : <span className="text-mg-dim text-xs">—</span>}
                                            </td>
                                            <td>
                                                {log.txHash ? (
                                                    <a href={`https://cardona-zkevm.polygonscan.com/tx/${log.txHash}`}
                                                        target="_blank" rel="noopener noreferrer"
                                                        className="flex items-center gap-1 font-mono text-[10px] text-mg-lavender/80 hover:text-mg-lavender transition-colors">
                                                        {log.txHash.slice(0, 10)}…
                                                        <ExternalLink className="w-3 h-3 shrink-0" />
                                                    </a>
                                                ) : <span className="text-mg-dim text-xs">—</span>}
                                            </td>
                                            <td className="font-mono text-[10px] text-mg-dim">
                                                {log.ipAddress ?? "—"}
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="px-6 py-3 border-t border-mg-lavender/08 flex items-center justify-between text-xs text-mg-dim">
                        <span>Page {page} of {totalPages} · {total} total events</span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="p-1.5 rounded-lg hover:bg-mg-elevated disabled:opacity-30 transition-colors">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                className="p-1.5 rounded-lg hover:bg-mg-elevated disabled:opacity-30 transition-colors">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
