"use client";

import { useEffect, useState } from "react";
import { HashVerifier } from "@/components/finovax/HashVerifier";
import { api } from "@/lib/api";
import { Invoice } from "@/lib/mock/mockInvoices";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate, generateTxHash, cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Coins, Zap, Ban, AlertTriangle } from "lucide-react";
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

    const eligible   = invoices.filter(i => i.status === "VERIFIED");
    const fraudAlerts = invoices.filter(i => i.status === "FRAUD_ALERT");

    return (
        <div className="space-y-8">
            {/* ── Header ── */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
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

            {/* ── Main 2-col grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Hash Verifier */}
                <HashVerifier />

                {/* Eligible invoices */}
                <div className="mg-card rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-mg-lavender/10 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.25)" }}>
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
                                <div className="w-11 h-11 rounded-xl bg-mg-elevated border border-mg-lavender/12 flex items-center justify-center mx-auto mb-3">
                                    <Coins className="w-5 h-5 text-mg-dim" />
                                </div>
                                <p className="text-sm text-mg-dim italic">No verified invoices pending disbursement</p>
                            </div>
                        ) : eligible.map((inv: Invoice) => (
                            <motion.div
                                layout key={inv.id}
                                className="p-4 rounded-xl bg-mg-elevated border border-mg-lavender/10 hover:border-status-success/25 transition-all flex items-center justify-between gap-4"
                            >
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-mg-silver text-sm">{inv.id}</span>
                                        <StatusBadge status={inv.status} />
                                    </div>
                                    <p className="text-lg font-bold text-status-success">{formatCurrency(inv.amount)}</p>
                                    <p className="font-mono text-[10px] text-mg-dim mt-0.5 truncate">{inv.invoiceHash?.slice(0, 20)}…</p>
                                </div>
                                <button
                                    onClick={() => handleDisburse(inv)}
                                    disabled={processing === inv.id}
                                    className={cn(
                                        "shrink-0 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wide transition-all",
                                        processing === inv.id
                                            ? "bg-mg-card text-mg-dim cursor-not-allowed"
                                            : "text-white hover:-translate-y-0.5"
                                    )}
                                    style={processing !== inv.id ? {
                                        background: "linear-gradient(135deg, #10b981, #34d399)",
                                        boxShadow: "0 4px 14px rgba(52,211,153,0.30)"
                                    } : undefined}
                                >
                                    {processing === inv.id ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full border border-mg-dim border-t-mg-lavender animate-spin" />
                                            Settling…
                                        </span>
                                    ) : "Disburse"}
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Bottom row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 3D Blockchain */}
                <BlockchainVisualizer />

                {/* Fraud alerts */}
                <div className="mg-card rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-mg-lavender/10 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.25)" }}>
                            <AlertTriangle className="w-4 h-4 text-status-danger" />
                        </div>
                        <div>
                            <p className="font-semibold text-mg-silver text-sm">Fraud Alerts</p>
                            <p className="text-[10px] text-mg-dim">{fraudAlerts.length} flagged transaction{fraudAlerts.length !== 1 ? "s" : ""}</p>
                        </div>
                    </div>
                    <div className="p-4 space-y-3">
                        {fraudAlerts.length === 0 ? (
                            <div className="py-10 text-center">
                                <Ban className="w-8 h-8 text-mg-dim mx-auto mb-3" />
                                <p className="text-sm text-mg-dim italic">No fraud alerts detected</p>
                            </div>
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
