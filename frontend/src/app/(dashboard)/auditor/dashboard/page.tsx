"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { mockStats, mockAuditTimeline, AuditEvent } from "@/lib/mock/mockStats";
import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, Users, FileCheck, Activity,
         History, TrendingUp, Radio, CheckCircle, XCircle, Info } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function AuditorDashboard() {
    const [stats,    setStats]    = useState(mockStats);
    const [timeline, setTimeline] = useState<AuditEvent[]>([]);

    useEffect(() => {
        const fetch = async () => {
            const [s, t] = await Promise.all([api.audit.getStats(), api.audit.getTimeline()]);
            setStats(s);
            setTimeline(t);
        };
        fetch();
    }, []);

    const statCards = [
        { label: "Total Financing Volume", value: formatCurrency(stats.totalVolume),  icon: TrendingUp,   from: "#4a4e8f", to: "#6b5ea0" },
        { label: "Fraud Attempts Blocked", value: stats.fraudAttemptsBlocked,          icon: AlertTriangle, from: "#dc2626", to: "#ef4444" },
        { label: "Active Counterparties",  value: stats.activeMSMEs,                   icon: Users,         from: "#6d28d9", to: "#6b5ea0" },
        { label: "Ledger-Verified Assets", value: stats.totalInvoices,                 icon: FileCheck,     from: "#4a4e8f", to: "#4f46e5" },
    ];

    const eventStyle: Record<string, { border: string; bg: string; icon: typeof CheckCircle; iconClass: string }> = {
        success: { border: "border-status-success/25",  bg: "bg-status-success/8",  icon: CheckCircle,  iconClass: "text-status-success"  },
        warning: { border: "border-status-danger/25",   bg: "bg-status-danger/8",   icon: XCircle,      iconClass: "text-status-danger"   },
        info:    { border: "border-mg-lavender/25",      bg: "bg-mg-cosmic/10",      icon: Info,         iconClass: "text-mg-lavender"     },
    };

    const systemChecks = [
        { label: "Oracle Consensus",      pct: 98,  color: "#059669" },
        { label: "zkProof Validation",    pct: 94,  color: "#6b5ea0" },
        { label: "IPFS Node Health",      pct: 99,  color: "#4a4e8f" },
        { label: "Smart Contract Uptime", pct: 100, color: "#4f46e5" },
    ];

    return (
        <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
                <div>
                    <p className="mg-label mb-1.5">Regulator View</p>
                    <h1 className="text-3xl font-bold text-mg-silver tracking-tight">
                        Audit <span className="mg-accent-text">Surveillance</span>
                    </h1>
                    <p className="text-sm text-mg-muted mt-1">Real-time oversight of the invoice financing ecosystem</p>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-mg-card border border-status-success/25">
                    <Radio className="w-3 h-3 text-status-success animate-pulse" />
                    <span className="text-[10px] uppercase font-semibold text-status-success tracking-widest">Systems Operational</span>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((c, i) => (
                    <motion.div key={c.label} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="mg-stat-card group">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-105"
                            style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})`, boxShadow: `0 0 14px ${c.from}45` }}>
                            <c.icon className="w-5 h-5 text-white" />
                        </div>
                        <p className="mg-label mb-1.5">{c.label}</p>
                        <p className="text-2xl font-bold text-mg-silver">{c.value}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 mg-card rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-mg-lavender/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(74,78,143,0.09)", border: "1px solid rgba(74,78,143,0.20)" }}>
                                <History className="w-4 h-4 text-mg-lavender" />
                            </div>
                            <div>
                                <p className="font-semibold text-mg-silver text-sm">Live Audit Trail</p>
                                <p className="text-[10px] text-mg-dim font-mono">{timeline.length} blockchain events</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse shadow-[0_0_6px_rgba(5,150,105,0.5)]" />
                            <span className="text-[10px] text-status-success uppercase font-semibold tracking-widest">Live</span>
                        </div>
                    </div>
                    <div className="p-5 space-y-3 max-h-[380px] overflow-y-auto">
                        {timeline.length === 0 ? (
                            <div className="py-12 text-center text-mg-dim text-sm italic">Loading events…</div>
                        ) : timeline.map((ev: AuditEvent, i: number) => {
                            const s = eventStyle[ev.status] ?? eventStyle.info;
                            const IconComp = s.icon;
                            return (
                                <motion.div key={ev.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.07 }}
                                    className={`flex items-start gap-3 p-4 rounded-xl border ${s.border} ${s.bg}`}>
                                    <IconComp className={`w-4 h-4 shrink-0 mt-0.5 ${s.iconClass}`} />
                                    <p className="text-sm font-semibold text-mg-silver flex-1">{ev.event}</p>
                                    <span className="shrink-0 text-[10px] text-mg-dim font-mono">{ev.time}</span>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                <div className="mg-card rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-mg-lavender/10 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(74,78,143,0.09)", border: "1px solid rgba(74,78,143,0.20)" }}>
                            <Activity className="w-4 h-4 text-mg-lavender" />
                        </div>
                        <p className="font-semibold text-mg-silver text-sm">System Health</p>
                    </div>
                    <div className="p-5 space-y-5">
                        {systemChecks.map((c, i) => (
                            <motion.div key={c.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.1 }}>
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-xs font-medium text-mg-muted">{c.label}</span>
                                    <span className="text-xs font-bold" style={{ color: c.color }}>{c.pct}%</span>
                                </div>
                                <div className="h-1.5 rounded-full overflow-hidden bg-mg-elevated">
                                    <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${c.pct}%` }} transition={{ delay: 0.5 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                                        style={{ background: `linear-gradient(90deg, ${c.color}90, ${c.color})` }} />
                                </div>
                            </motion.div>
                        ))}
                        <div className="mt-6 pt-4 border-t border-mg-lavender/10">
                            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-status-success/8 border border-status-success/20">
                                <ShieldCheck className="w-5 h-5 text-status-success shrink-0" />
                                <div>
                                    <p className="text-xs font-semibold text-mg-silver">Cryptographic Integrity</p>
                                    <p className="text-[10px] text-mg-muted">All hashes verified — no tampering detected</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
