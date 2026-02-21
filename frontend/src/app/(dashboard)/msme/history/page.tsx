"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { mockAuditTimeline, AuditEvent } from "@/lib/mock/mockStats";
import { Invoice } from "@/lib/mock/mockInvoices";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Info, History, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const eventIcon = { success: CheckCircle, warning: XCircle, info: Info };
const eventClass = {
    success: "text-status-success bg-status-success/8 border-status-success/25",
    warning: "text-status-danger bg-status-danger/8 border-status-danger/25",
    info:    "text-mg-cosmic bg-mg-cosmic/8 border-mg-cosmic/20",
};

export default function MSMEHistoryPage() {
    const [invoices, setInvoices]   = useState<Invoice[]>([]);
    const [timeline, setTimeline]   = useState<AuditEvent[]>([]);
    const [loading, setLoading]     = useState(true);

    useEffect(() => {
        Promise.all([api.invoices.getAll(), api.audit.getTimeline()]).then(([inv, tl]) => {
            setInvoices(inv);
            setTimeline(tl);
            setLoading(false);
        });
    }, []);

    return (
        <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <p className="mg-label mb-1.5">MSME Portal</p>
                <h1 className="text-3xl font-bold text-mg-silver tracking-tight">Activity <span className="mg-accent-text">History</span></h1>
                <p className="text-sm text-mg-muted mt-1">Complete log of all actions on your account and invoices</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Invoice history */}
                <div className="lg:col-span-2 mg-card rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-mg-lavender/10 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: "rgba(74,78,143,0.09)", border: "1px solid rgba(74,78,143,0.18)" }}>
                            <History className="w-4 h-4 text-mg-lavender" />
                        </div>
                        <p className="font-semibold text-mg-silver text-sm">Invoice History</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full mg-table">
                            <thead><tr>{["Invoice","Amount","Status","Date"].map(h => <th key={h} className="text-left">{h}</th>)}</tr></thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={4} className="py-12 text-center">
                                        <div className="w-6 h-6 rounded-full border-2 border-mg-dim border-t-mg-lavender animate-spin mx-auto" />
                                    </td></tr>
                                ) : invoices.map((inv, i) => (
                                    <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                                        <td>
                                            <p className="font-medium text-mg-silver text-sm">{inv.id}</p>
                                            <p className="text-xs text-mg-dim max-w-[120px] truncate">{inv.description}</p>
                                        </td>
                                        <td className="font-semibold text-mg-silver">{formatCurrency(inv.amount)}</td>
                                        <td><StatusBadge status={inv.status} /></td>
                                        <td className="text-mg-muted text-sm">{formatDate(inv.timestamp)}</td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* System events */}
                <div className="mg-card rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-mg-lavender/10 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: "rgba(74,78,143,0.09)", border: "1px solid rgba(74,78,143,0.18)" }}>
                            <Activity className="w-4 h-4 text-mg-lavender" />
                        </div>
                        <p className="font-semibold text-mg-silver text-sm">System Events</p>
                    </div>
                    <div className="p-4 space-y-3">
                        {timeline.map((ev, i) => {
                            const Icon = eventIcon[ev.status];
                            return (
                                <motion.div key={ev.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                                    className={cn("flex gap-3 p-3 rounded-xl border text-sm", eventClass[ev.status])}>
                                    <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-mg-silver leading-snug">{ev.event}</p>
                                        <p className="text-xs text-mg-dim mt-0.5">{ev.time}</p>
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
