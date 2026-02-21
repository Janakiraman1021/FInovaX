"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Invoice, InvoiceStatus } from "@/lib/mock/mockInvoices";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import { ExternalLink, FileText, Search } from "lucide-react";
import Link from "next/link";

export default function MSMEInvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading]   = useState(true);
    const [query, setQuery]       = useState("");
    const [filter, setFilter]     = useState<InvoiceStatus | "ALL">("ALL");

    useEffect(() => {
        api.invoices.getAll().then(d => { setInvoices(d); setLoading(false); });
    }, []);

    const filtered = invoices.filter(inv => {
        const matchStatus = filter === "ALL" || inv.status === filter;
        const matchQuery  = query === "" || inv.id.toLowerCase().includes(query.toLowerCase()) || inv.description.toLowerCase().includes(query.toLowerCase());
        return matchStatus && matchQuery;
    });

    const filters: Array<{ label: string; value: InvoiceStatus | "ALL" }> = [
        { label: "All", value: "ALL" },
        { label: "Pending", value: "PENDING" },
        { label: "Verified", value: "VERIFIED" },
        { label: "Financed", value: "FINANCED" },
        { label: "Fraud Alert", value: "FRAUD_ALERT" },
    ];

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
                <div>
                    <p className="mg-label mb-1.5">MSME Portal</p>
                    <h1 className="text-3xl font-bold text-mg-silver tracking-tight">All <span className="mg-accent-text">Invoices</span></h1>
                    <p className="text-sm text-mg-muted mt-1">{invoices.length} invoice{invoices.length !== 1 ? "s" : ""} on-chain</p>
                </div>
                <Link href="/msme/invoices/upload" className="mg-btn-primary text-sm gap-2">
                    <FileText className="w-4 h-4" /> Upload Invoice
                </Link>
            </motion.div>

            {/* Search & filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mg-dim" />
                    <input value={query} onChange={e => setQuery(e.target.value)}
                        placeholder="Search by ID or description…" className="mg-input pl-9" />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {filters.map(f => (
                        <button key={f.value} onClick={() => setFilter(f.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                filter === f.value
                                    ? "bg-mg-cosmic text-white border-mg-cosmic"
                                    : "bg-mg-card text-mg-muted border-mg-lavender/15 hover:border-mg-lavender/30"
                            }`}>
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mg-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full mg-table">
                        <thead><tr>{["Invoice ID","Description","Amount","Date","Status","Tx"].map(h => <th key={h} className="text-left">{h}</th>)}</tr></thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="py-16 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-7 h-7 rounded-full border-2 border-mg-dim border-t-mg-lavender animate-spin" />
                                        <span className="text-xs text-mg-dim animate-pulse">Fetching invoices…</span>
                                    </div>
                                </td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6} className="py-16 text-center text-mg-dim text-sm italic">No invoices found</td></tr>
                            ) : filtered.map((inv, i) => (
                                <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                                    <td>
                                        <p className="font-medium text-mg-silver text-sm">{inv.id}</p>
                                        <p className="font-mono text-[10px] text-mg-dim mt-0.5 truncate max-w-[140px]">{inv.invoiceHash?.slice(0, 12)}…</p>
                                    </td>
                                    <td className="text-mg-muted text-sm max-w-[160px] truncate">{inv.description}</td>
                                    <td className="font-semibold text-mg-silver">{formatCurrency(inv.amount)}</td>
                                    <td className="text-mg-muted text-sm">{formatDate(inv.timestamp)}</td>
                                    <td><StatusBadge status={inv.status} /></td>
                                    <td>
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
