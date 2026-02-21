"use client";

import { useEffect, useState, useCallback } from "react";
import { lenderAPI, auditorAPI, LenderInvoice, AuditLog } from "@/lib/api";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import { History, Activity, CheckCircle, XCircle, Info, Loader2 } from "lucide-react";
import Link from "next/link";

function classifyLog(eventType: string): "success" | "warning" | "info" {
    if (eventType.includes("finance") || eventType.includes("verified") || eventType.includes("register")) return "success";
    if (eventType.includes("block") || eventType.includes("fraud") || eventType.includes("fail")) return "warning";
    return "info";
}

const eventStyle = {
    success: { border: "border-status-success/25", bg: "bg-status-success/8",  icon: CheckCircle, iconClass: "text-status-success" },
    warning: { border: "border-status-danger/25",  bg: "bg-status-danger/8",   icon: XCircle,     iconClass: "text-status-danger"  },
    info:    { border: "border-mg-lavender/25",     bg: "bg-mg-cosmic/10",      icon: Info,        iconClass: "text-mg-lavender"    },
} as const;

export default function LenderHistory() {
    const [invoices, setInvoices]   = useState<LenderInvoice[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading]     = useState(true);

    const fetchData = useCallback(async () => {
        const token = localStorage.getItem("finovax-token") ?? "";
        if (!token || token.startsWith("mock.")) { setLoading(false); return; }
        setLoading(true);
        try {
            const [invRes, logRes] = await Promise.all([
                lenderAPI.getAllInvoices(token, { status: "FINANCED", limit: 100 }),
                auditorAPI.getAuditLogs(token, { limit: 30 }),
            ]);
            setInvoices(invRes.data.invoices);
            setAuditLogs(logRes.data.logs ?? []);
        } catch { /* silently ignore */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    return (
        <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <p className="mg-label mb-1.5">Lender Console</p>
                <h1 className="text-3xl font-bold text-mg-silver tracking-tight">
                    Activity <span className="mg-accent-text">History</span>
                </h1>
                <p className="text-sm text-mg-muted mt-1">Your disbursements and system events</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Loan history table */}
                <div className="lg:col-span-2 mg-card rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-mg-lavender/10 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(74,78,143,0.09)", border: "1px solid rgba(74,78,143,0.20)" }}>
                            <History className="w-4 h-4 text-mg-lavender" />
                        </div>
                        <div>
                            <p className="font-semibold text-mg-silver text-sm">Loan Disbursements</p>
                            <p className="text-[10px] text-mg-dim">{invoices.length} financed</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="py-16 text-center"><Loader2 className="w-8 h-8 text-mg-dim mx-auto animate-spin" /></div>
                        ) : invoices.length === 0 ? (
                            <div className="py-16 text-center text-mg-dim text-sm italic">No disbursements yet</div>
                        ) : (
                            <table className="w-full mg-table">
                                <thead><tr><th>ID</th><th>Company</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
                                <tbody>
                                    {invoices.map(inv => (
                                        <tr key={inv._id}>
                                            <td>
                                                <Link href={`/lender/loan/${inv.invoiceId}`} className="font-mono font-semibold text-mg-cosmic hover:underline">{inv.invoiceId}</Link>
                                            </td>
                                            <td>{inv.uploadedBy?.organization ?? inv.uploadedBy?.name ?? "—"}</td>
                                            <td><span className="font-bold text-status-success">{formatCurrency(inv.amount)}</span></td>
                                            <td>{formatDate(inv.createdAt)}</td>
                                            <td><StatusBadge status={inv.status} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* System events */}
                <div className="mg-card rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-mg-lavender/10 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(74,78,143,0.09)", border: "1px solid rgba(74,78,143,0.20)" }}>
                            <Activity className="w-4 h-4 text-mg-lavender" />
                        </div>
                        <p className="font-semibold text-mg-silver text-sm">System Events</p>
                    </div>
                    <div className="p-4 space-y-3 max-h-[420px] overflow-y-auto">
                        {loading ? (
                            <div className="py-8 text-center"><Loader2 className="w-6 h-6 text-mg-dim mx-auto animate-spin" /></div>
                        ) : auditLogs.length === 0 ? (
                            <p className="text-center text-xs text-mg-dim py-8 italic">No events recorded</p>
                        ) : auditLogs.map((log, i) => {
                            const kind = classifyLog(log.eventType);
                            const s    = eventStyle[kind];
                            const Icon = s.icon;
                            return (
                                <motion.div key={log._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.04 }}
                                    className={`flex items-start gap-3 p-3 rounded-xl border ${s.border} ${s.bg}`}>
                                    <Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${s.iconClass}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-mg-silver leading-snug capitalize">{log.eventType.replace(/_/g, " ")}</p>
                                        <p className="text-[10px] text-mg-dim font-mono">{formatDate(log.createdAt)}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
