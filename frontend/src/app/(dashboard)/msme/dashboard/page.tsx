"use client";

import { useEffect, useState, useCallback } from "react";
import { InvoiceUploader } from "@/components/oneflow/InvoiceUploader";
import { TrustScoreCard } from "@/components/shared/TrustScoreCard";
import { invoiceAPI, UploadedInvoice } from "@/lib/api";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import { ExternalLink, Database, TrendingUp, FileCheck, Clock, Wallet } from "lucide-react";
import Link from "next/link";

export default function MSMEDashboardPage() {
    const [invoices, setInvoices] = useState<UploadedInvoice[]>([]);
    const [loading, setLoading]   = useState(true);

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("oneflow-token") ?? "";
            if (!token || token.startsWith("mock.")) { setLoading(false); return; }
            const res = await invoiceAPI.getMyInvoices(token, { limit: 20 });
            setInvoices(res.data.invoices);
        } catch {
            // silently ignore — table will stay empty
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInvoices();
        const t = setInterval(fetchInvoices, 30_000);
        return () => clearInterval(t);
    }, [fetchInvoices]);

    const stats = [
        { label: "Portfolio Value", value: formatCurrency(invoices.reduce((s, i) => s + i.amount, 0)), icon: Wallet,     from: "#4a4e8f", to: "#6b5ea0" },
        { label: "Financed",        value: invoices.filter(i => i.status === "FINANCED").length,        icon: TrendingUp, from: "#059669", to: "#10b981" },
        { label: "Uploaded",        value: invoices.filter(i => i.status === "UPLOADED").length,        icon: FileCheck,  from: "#4a4e8f", to: "#4f46e5" },
        { label: "Blocked",         value: invoices.filter(i => i.status === "BLOCKED").length,         icon: Clock,      from: "#6d28d9", to: "#6b5ea0" },
    ];

    return (
        <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <p className="mg-label mb-1.5">MSME Portal</p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-mg-silver tracking-tight">Portfolio <span className="mg-accent-text">Overview</span></h1>
                    <p className="text-sm text-mg-muted mt-1">Manage your verified receivables and financing status</p>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-mg-card border border-status-success/25 self-start sm:self-auto">
                    <div className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse shadow-[0_0_6px_rgba(5,150,105,0.5)]" />
                    <span className="text-[10px] uppercase font-semibold text-status-success tracking-widest">Ledger Live</span>
                </div>
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="mg-stat-card group">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105"
                            style={{ background: `linear-gradient(135deg, ${s.from}, ${s.to})`, boxShadow: `0 0 12px ${s.from}50` }}>
                            <s.icon className="w-4 h-4 text-white" />
                        </div>
                        <p className="mg-label mb-1">{s.label}</p>
                        <p className="text-2xl font-bold text-mg-silver">{s.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: "All Invoices",  href: "/msme/invoices",       color: "bg-mg-cosmic/10 text-mg-cosmic border-mg-cosmic/20" },
                    { label: "Upload New",    href: "/msme/invoices/upload", color: "bg-status-success/10 text-status-success border-status-success/20" },
                    { label: "Fraud Alerts",  href: "/msme/fraud-alert",    color: "bg-status-danger/10 text-status-danger border-status-danger/20" },
                    { label: "History",       href: "/msme/history",         color: "bg-violet-500/10 text-violet-700 border-violet-400/20" },
                ].map(l => (
                    <Link key={l.href} href={l.href} className={`mg-card rounded-xl p-4 text-center text-sm font-semibold border transition-all hover:-translate-y-0.5 ${l.color}`}>
                        {l.label}
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 mg-card rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 flex items-center justify-between border-b border-mg-lavender/10">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ background: "rgba(74,78,143,0.09)", border: "1px solid rgba(74,78,143,0.20)" }}>
                                <Database className="w-4 h-4 text-mg-lavender" />
                            </div>
                            <div>
                                <p className="font-semibold text-mg-silver text-sm">Recent Invoices</p>
                                <p className="text-[10px] text-mg-dim font-mono">{invoices.length} records on ledger</p>
                            </div>
                        </div>
                        <Link href="/msme/invoices" className="text-xs text-mg-cosmic hover:text-mg-lavender font-medium transition-colors">View all →</Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full mg-table">
                            <thead><tr>{["Invoice ID","Amount","Issued","Status",""].map(h => <th key={h} className="text-left">{h}</th>)}</tr></thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5} className="py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-7 h-7 rounded-full border-2 border-mg-dim border-t-mg-lavender animate-spin" />
                                            <span className="text-xs text-mg-dim animate-pulse">Syncing with ledger…</span>
                                        </div>
                                    </td></tr>
                                ) : invoices.slice(0, 5).map((inv, i) => (
                                    <motion.tr key={inv.invoiceId} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                                        <td>
                                            <p className="font-medium text-mg-silver text-sm">{inv.invoiceId}</p>
                                            <p className="font-mono text-[10px] text-mg-dim mt-0.5 truncate max-w-[140px]">{inv.invoiceHash?.slice(0, 14)}…</p>
                                        </td>
                                        <td className="font-semibold text-mg-silver">{formatCurrency(inv.amount)}</td>
                                        <td className="text-mg-muted text-sm">
                                            <span>{formatDate(inv.createdAt)}</span>
                                            {inv.status === "SUBMITTED" && (
                                                <span className="block text-[10px] text-mg-dim mt-0.5 italic">
                                                    Verification in progress with lenders
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="flex flex-col gap-1">
                                                <StatusBadge status={inv.status} />
                                                {inv.status === "FINANCED" && (
                                                    <span className="text-[10px] text-status-success font-medium">Financed by a lender</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            {inv.ipfsCID && (
                                                <a href={`https://gateway.pinata.cloud/ipfs/${inv.ipfsCID}`} target="_blank" rel="noopener noreferrer"
                                                    className="p-1.5 rounded-md hover:bg-mg-elevated text-mg-dim hover:text-mg-lavender transition-colors inline-flex">
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                        {invoices.filter(i => i.status === "FINANCED").length > 0 && (
                            <div className="px-6 py-3 border-t border-mg-lavender/10 bg-status-success/5">
                                <p className="text-[10px] text-status-success font-medium">
                                    💡 Financed invoices respect cross-lender privacy. Other lender details are not visible.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="space-y-6">
                    <TrustScoreCard detailed />
                    <InvoiceUploader />
                </div>
            </div>
        </div>
    );
}
