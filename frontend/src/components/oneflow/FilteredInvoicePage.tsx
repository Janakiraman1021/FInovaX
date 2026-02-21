"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Invoice, InvoiceStatus } from "@/lib/mock/mockInvoices";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

interface FilteredInvoicePageProps {
    title: string;
    subtitle: string;
    sectionLabel: string;
    status: InvoiceStatus | null;
    emptyMessage: string;
    accentClass?: string;
    icon: React.ReactNode;
    iconBg?: string;
    uploadLink?: boolean;
}

export default function FilteredInvoicePage({
    title, subtitle, sectionLabel, status, emptyMessage, accentClass = "mg-accent-text", icon, iconBg, uploadLink,
}: FilteredInvoicePageProps) {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading]   = useState(true);

    useEffect(() => {
        api.invoices.getAll().then(data => {
            setInvoices(status ? data.filter(i => i.status === status) : data);
            setLoading(false);
        });
    }, [status]);

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <p className="mg-label mb-1.5">{sectionLabel}</p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-mg-silver tracking-tight">
                        {title.split(" ").slice(0, -1).join(" ")}{" "}
                        <span className={accentClass}>{title.split(" ").slice(-1)}</span>
                    </h1>
                    <p className="text-sm text-mg-muted mt-1">{subtitle}</p>
                </div>
                {uploadLink && (
                    <Link href="/msme/invoices/upload" className="mg-btn-primary text-sm gap-2">
                        {icon} Upload Invoice
                    </Link>
                )}
            </motion.div>

            <div className="mg-card rounded-2xl overflow-hidden">
                {invoices.length > 0 && !loading && (
                    <div className="px-6 py-3 border-b border-mg-lavender/10 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: iconBg ?? "rgba(74,78,143,0.09)", border: "1px solid rgba(74,78,143,0.18)" }}>
                            <span className="w-3.5 h-3.5 text-mg-lavender flex items-center justify-center">{icon}</span>
                        </div>
                        <span className="text-sm font-semibold text-mg-silver">{invoices.length} invoice{invoices.length !== 1 ? "s" : ""}</span>
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table className="w-full mg-table">
                        <thead><tr>
                            <th className="text-left">Invoice ID</th>
                            <th className="text-left hidden sm:table-cell">Description</th>
                            <th className="text-left">Amount</th>
                            <th className="text-left">Date</th>
                            <th className="text-left">Status</th>
                            <th className="text-left hidden sm:table-cell">Tx</th>
                        </tr></thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="py-16 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-7 h-7 rounded-full border-2 border-mg-dim border-t-mg-lavender animate-spin" />
                                        <span className="text-xs text-mg-dim animate-pulse">Fetching invoices…</span>
                                    </div>
                                </td></tr>
                            ) : invoices.length === 0 ? (
                                <tr><td colSpan={6} className="py-16 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-mg-surface border border-mg-lavender/12 flex items-center justify-center">
                                            <span className="w-6 h-6 text-mg-dim flex items-center justify-center">{icon}</span>
                                        </div>
                                        <p className="text-sm text-mg-dim italic">{emptyMessage}</p>
                                    </div>
                                </td></tr>
                            ) : invoices.map((inv, i) => (
                                <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                                    <td>
                                        <p className="font-medium text-mg-silver text-sm">{inv.id}</p>
                                        <p className="font-mono text-[10px] text-mg-dim mt-0.5 truncate max-w-[120px]">{inv.invoiceHash?.slice(0, 12)}…</p>
                                    </td>
                                    <td className="text-mg-muted text-sm max-w-[160px] truncate hidden sm:table-cell">{inv.description}</td>
                                    <td className="font-semibold text-mg-silver">{formatCurrency(inv.amount)}</td>
                                    <td className="text-mg-muted text-sm">{formatDate(inv.timestamp)}</td>
                                    <td><StatusBadge status={inv.status} /></td>
                                    <td className="hidden sm:table-cell">
                                        {inv.ledgerTx ? (
                                            <a href={`https://cardona-zkevm.polygonscan.com/tx/${inv.ledgerTx}`} target="_blank" rel="noopener noreferrer"
                                                className="p-1.5 rounded-md hover:bg-mg-elevated text-mg-dim hover:text-mg-lavender transition-colors inline-flex">
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        ) : <span className="text-mg-dim text-xs">—</span>}
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}