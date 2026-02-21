"use client";

import { useEffect, useState } from "react";
import { HashVerifier } from "@/components/finovax/HashVerifier";
import { api } from "@/lib/api";
import { Invoice } from "@/lib/mock/mockInvoices";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate, generateTxHash, cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Coins, CheckCircle2, Ban, Zap } from "lucide-react";
import { toast } from "sonner";
import BlockchainVisualizer from "@/components/finovax/BlockchainVisualizer";

export default function LenderDashboard() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        const fetchInvoices = async () => {
            const data = await api.invoices.getAll();
            setInvoices(data.filter((inv: Invoice) => inv.status === "VERIFIED" || inv.status === "FINANCED" || inv.status === "FRAUD_ALERT"));
        };
        fetchInvoices();
    }, []);

    const handleDisburse = async (inv: Invoice) => {
        setProcessing(inv.id);
        const txHash = generateTxHash();
        try {
            await api.invoices.disburse(inv.id, "Sarah Smith (Lender)", txHash);
            toast.success("Transaction Settled!", { description: `Ref: ${txHash.slice(0, 16)}...` });
            setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status: "FINANCED" as any, lender: "Sarah Smith", ledgerTx: txHash } : i));
        } finally {
            setProcessing(null);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <div className="stat-pill mb-3" style={{ color: "#10b981", borderColor: "rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.1)" }}>
                        Lender Console
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
                        Liquidity <span className="text-cosmic-gradient">Terminal</span>
                    </h1>
                    <p className="text-white/35 text-sm">Secure invoice verification and automated fund disbursement</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-emerald-500/25">
                    <Zap className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-widest">DeFi Ready</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Hash Verifier */}
                <HashVerifier />

                <div className="space-y-6">
                    {/* Eligible invoices */}
                    <div className="galaxy-card rounded-3xl p-6">
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                                <Coins className="w-3.5 h-3.5 text-emerald-400" />
                            </div>
                            Eligible for Disbursement
                        </h3>

                        <div className="space-y-4">
                            {invoices.filter(i => i.status === "VERIFIED").length === 0 ? (
                                <div className="py-12 text-center text-white/20 italic text-sm">
                                    <div className="w-12 h-12 rounded-full bg-galaxy-purple/10 border border-galaxy-lavender/15 flex items-center justify-center mx-auto mb-4">
                                        <Coins className="w-5 h-5 text-white/20" />
                                    </div>
                                    No new verified invoices found on ledger
                                </div>
                            ) : (
                                invoices.filter(i => i.status === "VERIFIED").map((inv: Invoice) => (
                                    <motion.div
                                        layout key={inv.id}
                                        className="p-5 rounded-2xl glass border border-galaxy-lavender/12 hover:border-emerald-500/30 transition-all flex items-center justify-between group"
                                    >
                                        <div>
                                            <div className="flex items-center gap-3 mb-1.5">
                                                <span className="font-bold text-white text-sm">{inv.id}</span>
                                                <StatusBadge status={inv.status} />
                                            </div>
                                            <div className="text-2xl font-black text-emerald-400">{formatCurrency(inv.amount)}</div>
                                            <div className="text-[10px] text-white/25 font-mono mt-1.5 w-44 truncate">
                                                HASH: {inv.invoiceHash}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDisburse(inv)}
                                            disabled={processing === inv.id}
                                            className={cn(
                                                "px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all",
                                                processing === inv.id
                                                    ? "bg-white/5 text-white/20 cursor-not-allowed"
                                                    : "bg-gradient-to-r from-emerald-600 to-galaxy-cyan text-white shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:shadow-[0_0_30px_rgba(16,185,129,0.55)] hover:scale-105"
                                            )}
                                        >
                                            {processing === inv.id ? (
                                                <span className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full border border-white/30 border-t-white animate-spin" />
                                                    Settling...
                                                </span>
                                            ) : "Disburse Funds"}
                                        </button>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* 3D Blockchain Vis */}
                    <BlockchainVisualizer />

                    {/* Fraud history */}
                    <div className="galaxy-card rounded-3xl p-6 relative overflow-hidden">
                        <div className="absolute inset-0 bg-red-600/03 rounded-3xl" />
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2 relative">
                            <div className="w-7 h-7 rounded-lg bg-red-500/15 border border-red-500/25 flex items-center justify-center">
                                <Ban className="w-3.5 h-3.5 text-red-400" />
                            </div>
                            Risk Mitigation Blocked
                        </h3>
                        <div className="space-y-2 relative">
                            {invoices.filter(i => i.status === "FRAUD_ALERT").length === 0 ? (
                                <div className="text-center py-6 text-white/20 text-sm italic">No fraud events recorded</div>
                            ) : (
                                invoices.filter((i: Invoice) => i.status === "FRAUD_ALERT").map((inv: Invoice) => (
                                    <div key={inv.id} className="flex items-center justify-between text-xs py-2.5 border-b border-red-500/08">
                                        <div className="flex items-center gap-2">
                                            <Ban className="w-3 h-3 text-red-500" />
                                            <span className="text-white/50 font-mono">{inv.id}</span>
                                        </div>
                                        <span className="text-red-400/80 font-black text-[10px] tracking-widest uppercase">DOUBLE-FIN BLOCKED</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
