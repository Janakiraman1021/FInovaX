"use client";

import { useEffect, useState } from "react";
import { InvoiceUploader } from "@/components/finovax/InvoiceUploader";
import { api } from "@/lib/api";
import { Invoice } from "@/lib/mock/mockInvoices";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import { ExternalLink, Database, TrendingUp, FileCheck, Clock, Wallet } from "lucide-react";

export default function MSMEDashboard() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvoices = async () => {
            const data = await api.invoices.getAll();
            setInvoices(data);
            setLoading(false);
        };
        fetchInvoices();
        const interval = setInterval(fetchInvoices, 5000);
        return () => clearInterval(interval);
    }, []);

    const totalAmount  = invoices.reduce((s, i) => s + i.amount, 0);
    const financed     = invoices.filter(i => i.status === "FINANCED").length;
    const verified     = invoices.filter(i => i.status === "VERIFIED").length;
    const pending      = invoices.filter(i => i.status === "PENDING").length;

    const stats = [
        { label: "Portfolio Value",    value: formatCurrency(totalAmount), icon: Wallet,     from: "#7c3aed", to: "#a78bfa", glow: "shadow-galaxy-sm" },
        { label: "Financed",           value: financed,                    icon: TrendingUp, from: "#10b981", to: "#06b6d4", glow: "shadow-[0_0_15px_rgba(16,185,129,0.3)]" },
        { label: "Ledger Verified",    value: verified,                    icon: FileCheck,  from: "#06b6d4", to: "#6366f1", glow: "shadow-[0_0_15px_rgba(6,182,212,0.3)]" },
        { label: "Awaiting Audit",     value: pending,                     icon: Clock,      from: "#ec4899", to: "#f97316", glow: "shadow-pink-glow opacity-70" },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <div className="stat-pill mb-3">MSME Portal</div>
                    <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
                        Portfolio <span className="text-galaxy-gradient">Overview</span>
                    </h1>
                    <p className="text-white/35 text-sm font-medium">Manage your verified receivables and financing status</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-emerald-500/20">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                    <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-widest">Ledger Synced</span>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => (
                    <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                        className="galaxy-card rounded-2xl p-5 group"
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${s.glow}`}
                            style={{ background: `linear-gradient(135deg, ${s.from}, ${s.to})` }}>
                            <s.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-xs text-white/35 uppercase font-bold tracking-widest mb-1">{s.label}</div>
                        <div className="text-2xl font-black text-white">{s.value}</div>
                    </motion.div>
                ))}
            </div>

            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Invoice table */}
                <div className="lg:col-span-2">
                    <div className="galaxy-card rounded-3xl overflow-hidden">
                        {/* Table header */}
                        <div className="p-6 border-b border-galaxy-lavender/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-galaxy-purple/20 border border-galaxy-lavender/25 flex items-center justify-center">
                                    <Database className="w-4 h-4 text-galaxy-lavender" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm uppercase tracking-widest">Verified Invoices</h3>
                                    <div className="text-[10px] text-white/30 font-mono">{invoices.length} records on ledger</div>
                                </div>
                            </div>
                            <div className="stat-pill">{loading ? "Syncing..." : "Live"}</div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left border-b border-galaxy-lavender/08">
                                        {["ID / Hash", "Amount", "Issued At", "Status", ""].map(h => (
                                            <th key={h} className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/30">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-16 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full border-2 border-galaxy-lavender/20 border-t-galaxy-lavender animate-spin" />
                                                    <span className="text-white/20 text-sm font-mono animate-pulse">Syncing with ledger...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : invoices.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-16 text-center text-white/20 italic">No invoices on ledger yet</td>
                                        </tr>
                                    ) : (
                                        invoices.map((inv: Invoice, i) => (
                                            <motion.tr
                                                layout
                                                key={inv.id}
                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                                                className="border-b border-galaxy-lavender/06 hover:bg-galaxy-purple/05 transition-colors group"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-white text-sm">{inv.id}</div>
                                                    <div className="text-[10px] font-mono text-white/20 group-hover:text-galaxy-lavender/50 transition-colors w-32 truncate">{inv.invoiceHash}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-black text-galaxy-lavender">{formatCurrency(inv.amount)}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-xs text-white/50">{formatDate(inv.timestamp)}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <StatusBadge status={inv.status} />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button className="p-2 rounded-lg hover:bg-galaxy-purple/20 border border-transparent hover:border-galaxy-lavender/25 text-white/20 hover:text-galaxy-lavender transition-all">
                                                        <ExternalLink className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Uploader */}
                <div>
                    <InvoiceUploader />
                </div>
            </div>
        </div>
    );
}
