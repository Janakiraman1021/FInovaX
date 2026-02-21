"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { mockStats, mockAuditTimeline, AuditEvent } from "@/lib/mock/mockStats";
import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, Users, FileCheck, Activity, History, TrendingUp, Fingerprint, Radio } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function AuditorDashboard() {
    const [stats, setStats]     = useState(mockStats);
    const [timeline, setTimeline] = useState<AuditEvent[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const s = await api.audit.getStats();
            const t = await api.audit.getTimeline();
            setStats(s);
            setTimeline(t);
        };
        fetchData();
    }, []);

    const statCards = [
        { label: "Total Financing Volume", value: formatCurrency(stats.totalVolume),     icon: TrendingUp,   from: "#10b981", to: "#06b6d4", glow: "shadow-[0_0_18px_rgba(16,185,129,0.40)]" },
        { label: "Fraud Attempts Blocked", value: stats.fraudAttemptsBlocked,            icon: AlertTriangle, from: "#ef4444", to: "#ec4899", glow: "shadow-[0_0_18px_rgba(239,68,68,0.45)]" },
        { label: "Active Counterparties",  value: stats.activeMSMEs,                     icon: Users,         from: "#7c3aed", to: "#a78bfa", glow: "shadow-galaxy-sm"                      },
        { label: "Ledger-Verified Assets", value: stats.totalInvoices,                   icon: FileCheck,     from: "#06b6d4", to: "#6366f1", glow: "shadow-cyan-glow"                      },
    ];

    const eventColors: Record<string, { bg: string; border: string; shadow: string; dot: string }> = {
        success: { bg: "bg-emerald-500/15", border: "border-emerald-500/30", shadow: "shadow-[0_0_12px_rgba(16,185,129,0.35)]", dot: "bg-emerald-400" },
        warning: { bg: "bg-red-500/15",     border: "border-red-500/30",     shadow: "shadow-glow-red",                          dot: "bg-red-400"     },
        info:    { bg: "bg-galaxy-purple/15",border:"border-galaxy-lavender/30", shadow: "shadow-galaxy-sm",                     dot: "bg-galaxy-lavender" },
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <div className="stat-pill mb-3" style={{ color: "#ec4899", borderColor: "rgba(236,72,153,0.3)", background: "rgba(236,72,153,0.1)" }}>
                        Regulator View
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
                        Audit <span className="text-galaxy-gradient">Surveillance</span>
                    </h1>
                    <p className="text-white/35 text-sm">Real-time oversight of the invoice financing ecosystem</p>
                </div>
                <div className="flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-emerald-500/25">
                    <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-widest">System Operational</span>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        key={card.label}
                        className="galaxy-card rounded-3xl p-6 group relative overflow-hidden"
                    >
                        {/* Hover corner glow */}
                        <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-[40px] opacity-0 group-hover:opacity-50 transition-opacity duration-500"
                            style={{ background: card.from }} />
                        <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${card.glow}`}
                            style={{ background: `linear-gradient(135deg, ${card.from}, ${card.to})` }}
                        >
                            <card.icon className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-white/35 text-[10px] uppercase font-bold tracking-widest mb-1.5">{card.label}</p>
                        <h3 className="text-2xl font-black text-white tracking-tight">{card.value}</h3>
                    </motion.div>
                ))}
            </div>

            {/* Timeline + integrity panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Live Audit Trail */}
                <div className="lg:col-span-2">
                    <div className="galaxy-card rounded-3xl p-8 scan-container relative overflow-hidden">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-galaxy-purple/15 border border-galaxy-lavender/25 flex items-center justify-center">
                                <History className="w-5 h-5 text-galaxy-lavender" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Live Audit Trail</h3>
                                <div className="text-[10px] text-white/30 font-mono">{timeline.length} blockchain events</div>
                            </div>
                            <div className="ml-auto flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                                <span className="text-[10px] text-emerald-400/80 uppercase font-bold">Live</span>
                            </div>
                        </div>

                        <div className="relative space-y-5">
                            {/* Connector line */}
                            <div className="absolute left-[18px] top-2 bottom-2 w-px"
                                style={{ background: "linear-gradient(180deg, rgba(167,139,250,0.3), rgba(236,72,153,0.2), transparent)" }} />

                            {timeline.map((event: AuditEvent, i: number) => {
                                const ec = eventColors[event.status] ?? eventColors.info;
                                return (
                                    <motion.div
                                        initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.15 }}
                                        key={event.id}
                                        className="relative pl-12"
                                    >
                                        {/* Dot */}
                                        <div className={`absolute left-0 top-1 w-9 h-9 rounded-full border-2 border-galaxy-void flex items-center justify-center z-10 ${ec.bg} ${ec.border} ${ec.shadow}`}>
                                            <Activity className={`w-3.5 h-3.5 ${ec.dot === "bg-emerald-400" ? "text-emerald-400" : ec.dot === "bg-red-400" ? "text-red-400" : "text-galaxy-lavender"}`} />
                                        </div>
                                        <div className={`p-4 rounded-2xl ${ec.bg} border ${ec.border} ${ec.shadow}`}>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-white uppercase tracking-tight">{event.event}</span>
                                                <span className="text-[9px] text-white/30 uppercase font-bold">{event.time}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Cryptographic integrity card */}
                <div className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
                        className="galaxy-card rounded-3xl p-8 relative overflow-hidden"
                    >
                        {/* Corner nebula blob */}
                        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-40" style={{ background: "rgba(124,58,237,0.4)" }} />
                        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full blur-[50px] opacity-30" style={{ background: "rgba(236,72,153,0.3)" }} />

                        <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-galaxy-purple to-galaxy-pink flex items-center justify-center mb-6 glow-purple galaxy-float mx-auto">
                                <Fingerprint className="w-7 h-7 text-white" />
                            </div>

                            <h3 className="text-xl font-bold text-white mb-3 text-center">Cryptographic Integrity</h3>
                            <p className="text-white/45 text-sm leading-relaxed mb-6 text-center">
                                Every transaction is cryptographically bonded to its invoice hash.
                                Any document alteration invalidates the audit trail instantly.
                            </p>

                            <div className="px-4 py-3 rounded-2xl bg-galaxy-void/80 border border-galaxy-lavender/20 font-mono text-[10px] text-galaxy-lavender/90 break-all leading-relaxed">
                                CHAIN_VERIFY: 0x82f...a12 — PROVED
                            </div>

                            <div className="mt-4 flex items-center justify-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                                <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-widest">Integrity Confirmed</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* System health mini card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                        className="galaxy-card rounded-2xl p-6"
                    >
                        <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">System Health</h4>
                        <div className="space-y-3">
                            {[
                                { label: "zkEVM Node",    pct: 98, color: "#10b981" },
                                { label: "IPFS Gateway",  pct: 100, color: "#06b6d4" },
                                { label: "Audit Engine",  pct: 97, color: "#7c3aed" },
                            ].map(item => (
                                <div key={item.label}>
                                    <div className="flex justify-between text-[10px] mb-1.5">
                                        <span className="text-white/45 font-medium">{item.label}</span>
                                        <span className="font-bold" style={{ color: item.color }}>{item.pct}%</span>
                                    </div>
                                    <div className="h-1 rounded-full bg-white/5">
                                        <motion.div
                                            initial={{ width: 0 }} animate={{ width: `${item.pct}%` }} transition={{ delay: 0.8, duration: 1 }}
                                            className="h-full rounded-full"
                                            style={{ background: `linear-gradient(90deg, ${item.color}88, ${item.color})` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
