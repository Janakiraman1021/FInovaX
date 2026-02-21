"use client";

import { useEffect, useState } from "react";
import { HashVerifier } from "@/components/finovax/HashVerifier";
import { api } from "@/lib/api";
import { Invoice } from "@/lib/mock/mockInvoices";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate, generateTxHash, cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Coins, Zap, Ban, AlertTriangle, TrendingUp, ShieldOff, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import BlockchainVisualizer from "@/components/finovax/BlockchainVisualizer";

export default function LenderDashboard() {
    const [invoices, setInvoices]     = useState<Invoice[]>([]);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        api.invoices.getAll().then((data: Invoice[]) =>
            setInvoices(data.filter(i => ["VERIFIED", "FINANCED", "FRAUD_ALERT"].includes(i.status)))
        );
    }, []);

    const handleDisburse = async (inv: Invoice) => {
        setProcessing(inv.id);
        const txHash = generateTxHash();
        try {
            await api.invoices.disburse(inv.id, "Sarah Smith (Lender)", txHash);
            toast.success("Settlement confirmed", { description: `Ref: ${txHash.slice(0, 18)}…` });
            setInvoices(prev => prev.map(i =>
                i.id === inv.id ? { ...i, status: "FINANCED" as any, lender: "Sarah Smith", ledgerTx: txHash } : i
            ));
        } finally { setProcessing(null); }
    };

    const eligible    = invoices.filter(i => i.status === "VERIFIED");
    const financed    = invoices.filter(i => i.status === "FINANCED");
    const fraudAlerts = invoices.filter(i => i.status === "FRAUD_ALERT");

    const statCards = [
        { label: "Active Loans",       value: eligible.length,     icon: ClipboardCheck, from: "#4a4e8f", to: "#6b5ea0" },
        { label: "Volume Disbursed",   value: formatCurrency(financed.reduce((s,i) => s + i.amount, 0)), icon: TrendingUp, from: "#059669", to: "#10b981" },
        { label: "Fraud Blocked",      value: fraudAlerts.length,  icon: ShieldOff,      from: "#dc2626", to: "#ef4444" },
        { label: "Pending Review",     value: eligible.length,     icon: Coins,          from: "#6d28d9", to: "#4f46e5" },
    ];

    return (
        <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
                <div>
                    <p className="mg-label mb-1.5">Lender Console</p>
                    <h1 className="text-3xl font-bold text-mg-silver tracking-tight">
                        Liquidity <span className="mg-accent-text">Terminal</span>
                    </h1>
                    <p className="text-sm text-mg-muted mt-1">Verify invoice hashes and disburse capital to eligible MSMEs</p>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-mg-card border border-status-success/25">
                    <Zap className="w-3 h-3 text-status-success" />
                    <span className="text-[10px] uppercase font-semibold text-status-success tracking-widest">DeFi Ready</span>
                </div>
            </motion.div>

            {/* Stat cards */}
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

            {/* Main 2-col grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <HashVerifier />

                <div className="mg-card rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-mg-lavender/10 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(5,150,105,0.10)", border: "1px solid rgba(5,150,105,0.22)" }}>
                            <Coins className="w-4 h-4 text-status-success" />
                        </div>
                        <div>
                            <p className="font-semibold text-mg-silver text-sm">Eligible for Disbursement</p>
                            <p className="text-[10px] text-mg-dim">{eligible.length} verified invoice{eligible.length !== 1 ? "s" : ""}</p>
                        </div>
                    </div>
                    <div className="p-4 space-y-3 max-h-[340px] overflow-y-auto">
                        {eligible.length === 0 ? (
                            <div className="py-14 text-center">
                                <Coins className="w-8 h-8 text-mg-dim mx-auto mb-3" />
                                <p className="text-sm text-mg-dim italic">No verified invoices pending disbursement</p>
                            </div>
                        ) : eligible.map((inv: Invoice) => (
                            <motion.div layout key={inv.id} className="p-4 rounded-xl bg-mg-elevated border border-mg-lavender/10 hover:border-status-success/25 transition-all flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-mg-silver text-sm">{inv.id}</span>
                                        <StatusBadge status={inv.status} />
                                    </div>
                                    <p className="text-lg font-bold text-status-success">{formatCurrency(inv.amount)}</p>
                                    <p className="font-mono text-[10px] text-mg-dim mt-0.5 truncate">{inv.invoiceHash?.slice(0, 20)}…</p>
                                </div>
                                <button onClick={() => handleDisburse(inv)} disabled={processing === inv.id}
                                    className={cn("shrink-0 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wide transition-all",
                                        processing === inv.id ? "bg-mg-card text-mg-dim cursor-not-allowed" : "text-white hover:-translate-y-0.5")}
                                    style={processing !== inv.id ? { background: "linear-gradient(135deg, #059669, #10b981)", boxShadow: "0 4px 14px rgba(5,150,105,0.20)" } : undefined}>
                                    {processing === inv.id ? <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border border-mg-dim border-t-mg-lavender animate-spin" />Settling…</span> : "Disburse"}
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BlockchainVisualizer />
                <div className="mg-card rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-mg-lavender/10 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.22)" }}>
                            <AlertTriangle className="w-4 h-4 text-status-danger" />
                        </div>
                        <div>
                            <p className="font-semibold text-mg-silver text-sm">Fraud Alerts</p>
                            <p className="text-[10px] text-mg-dim">{fraudAlerts.length} flagged transaction{fraudAlerts.length !== 1 ? "s" : ""}</p>
                        </div>
                    </div>
                    <div className="p-4 space-y-3">
                        {fraudAlerts.length === 0 ? (
                            <div className="py-10 text-center"><Ban className="w-8 h-8 text-mg-dim mx-auto mb-3" /><p className="text-sm text-mg-dim italic">No fraud alerts</p></div>
                        ) : fraudAlerts.map((inv: Invoice) => (
                            <div key={inv.id} className="p-4 rounded-xl border border-status-danger/20 bg-status-danger/5 flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-mg-silver text-sm">{inv.id}</p>
                                    <p className="text-status-danger text-sm font-medium">{formatCurrency(inv.amount)}</p>
                                    <p className="text-[10px] text-mg-dim mt-0.5">{formatDate(inv.timestamp)}</p>
                                </div>
                                <StatusBadge status={inv.status} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
