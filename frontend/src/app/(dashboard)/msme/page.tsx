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
    const [loading, setLoading]   = useState(true);

    useEffect(() => {
        const fetch = async () => {
            const data = await api.invoices.getAll();
            setInvoices(data);
            setLoading(false);
        };
        fetch();
        const t = setInterval(fetch, 6000);
        return () => clearInterval(t);
    }, []);

    const totalAmount = invoices.reduce((s, i) => s + i.amount, 0);
    const financed    = invoices.filter(i => i.status === "FINANCED").length;
    const verified    = invoices.filter(i => i.status === "VERIFIED").length;
    const pending     = invoices.filter(i => i.status === "PENDING").length;

    const stats = [
        { label: "Portfolio Value",  value: formatCurrency(totalAmount), icon: Wallet,     from: "#4a4e8f", to: "#a490c2" },
        { label: "Financed",         value: financed,                    icon: TrendingUp, from: "#10b981", to: "#34d399" },
        { label: "Ledger Verified",  value: verified,                    icon: FileCheck,  from: "#4a4e8f", to: "#818cf8" },
        { label: "Awaiting Audit",   value: pending,                     icon: Clock,      from: "#7c3aed", to: "#a490c2" },
    ];

    return (
        <div className="space-y-8">
            {/* ── Page header ── */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <p className="mg-label mb-1.5">MSME Portal</p>
                    <h1 className="text-3xl font-bold text-mg-silver tracking-tight">
                        Portfolio <span className="mg-accent-text">Overview</span>
                    </h1>
                    <p className="text-sm text-mg-muted mt-1">Manage your verified receivables and financing status</p>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-mg-card border border-status-success/25">
                    <div className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
                    <span className="text-[10px] uppercase font-semibold text-status-success tracking-widest">Ledger Live</span>
                </div>
            </motion.div>

            {/* ── Stats row ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => (
                    <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="mg-stat-card group"
                    >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105"
                            style={{ background: `linear-gradient(135deg, ${s.from}, ${s.to})`, boxShadow: `0 0 12px ${s.from}50` }}>
                            <s.icon className="w-4 h-4 text-white" />
                        </div>
                        <p className="mg-label mb-1">{s.label}</p>
                        <p className="text-2xl font-bold text-mg-silver">{s.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* ── Main grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Invoice table */}
                <div className="lg:col-span-2 mg-card rounded-2xl overflow-hidden">
                    {/* Table header */}
                    <div className="px-6 py-4 flex items-center justify-between border-b border-mg-lavender/10">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ background: "rgba(74,78,143,0.22)", border: "1px solid rgba(164,144,194,0.18)" }}>
                                <Database className="w-4 h-4 text-mg-lavender" />
                            </div>
                            <div>
                                <p className="font-semibold text-mg-silver text-sm">Verified Invoices</p>
                                <p className="text-[10px] text-mg-dim font-mono">{invoices.length} records on ledger</p>
                            </div>
                        </div>
                        <span className="mg-pill">{loading ? "Syncing…" : "Live"}</span>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full mg-table">
                            <thead>
                                <tr>
                                    {["Invoice ID", "Amount", "Issued", "Status", ""].map(h => (
                                        <th key={h} className="text-left">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="py-16 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-7 h-7 rounded-full border-2 border-mg-dim border-t-mg-lavender animate-spin" />
                                                <span className="text-xs text-mg-dim animate-pulse">Syncing with ledger…</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : invoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-16 text-center text-mg-dim text-sm italic">
                                            No invoices on ledger yet
                                        </td>
                                    </tr>
                                ) : invoices.map((inv: Invoice, i) => (
                                    <motion.tr
                                        key={inv.id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.03 }}
                                    >
                                        <td>
                                            <p className="font-medium text-mg-silver text-sm">{inv.id}</p>
                                            <p className="font-mono text-[10px] text-mg-dim mt-0.5 truncate max-w-[140px]">{inv.invoiceHash?.slice(0, 14)}…</p>
                                        </td>
                                        <td className="font-semibold text-mg-silver">{formatCurrency(inv.amount)}</td>
                                        <td className="text-mg-muted text-sm">{formatDate(inv.timestamp)}</td>
                                        <td><StatusBadge status={inv.status} /></td>
                                        <td>
                                            {inv.ledgerTx && (
                                                <a href={`https://cardona-zkevm.polygonscan.com/tx/${inv.ledgerTx}`}
                                                    target="_blank" rel="noopener noreferrer"
                                                    className="p-1.5 rounded-md hover:bg-mg-elevated text-mg-dim hover:text-mg-lavender transition-colors inline-flex"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Upload panel */}
                <div>
                    <InvoiceUploader />
                </div>
            </div>
        </div>
    );
}
