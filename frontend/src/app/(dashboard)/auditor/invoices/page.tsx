"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Invoice } from "@/lib/mock/mockInvoices";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import { FileText, Search, ExternalLink } from "lucide-react";
import Link from "next/link";

const STATUSES = ["ALL", "PENDING", "VERIFIED", "FINANCED", "FRAUD_ALERT"] as const;

export default function AuditorInvoices() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [query, setQuery]       = useState("");
    const [filter, setFilter]     = useState<string>("ALL");
    const [loading, setLoading]   = useState(true);

    useEffect(() => {
        api.invoices.getAll().then(data => { setInvoices(data); setLoading(false); });
    }, []);

    const filtered = invoices.filter(i => {
        const matchStatus = filter === "ALL" || i.status === filter;
        const matchQuery  = !query || i.id.toLowerCase().includes(query.toLowerCase()) || (i.borrower ?? "").toLowerCase().includes(query.toLowerCase());
        return matchStatus && matchQuery;
    });

    return (
        <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <p className="mg-label mb-1.5">Regulator View</p>
                <h1 className="text-3xl font-bold text-mg-silver tracking-tight">
                    All <span className="mg-accent-text">Invoices</span>
                </h1>
                <p className="text-sm text-mg-muted mt-1">Read-only view of all invoices in the system</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mg-card rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-mg-lavender/10 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                        {STATUSES.map(s => (
                            <button key={s} onClick={() => setFilter(s)}
                                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${filter === s ? "bg-mg-cosmic text-white shadow-[0_0_8px_rgba(74,78,143,0.35)]" : "bg-mg-elevated text-mg-dim hover:text-mg-silver border border-mg-lavender/12"}`}>
                                {s.replace("_", " ")}
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-mg-dim" />
                        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search…" className="mg-input pl-8 text-sm w-52" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    {loading ? <div className="py-16 text-center text-mg-dim text-sm italic">Loading…</div>
                    : filtered.length === 0 ? <div className="py-16 text-center"><FileText className="w-10 h-10 text-mg-dim mx-auto mb-3" /><p className="text-sm text-mg-dim italic">No invoices found</p></div>
                    : (
                        <table className="w-full mg-table">
                            <thead><tr><th>ID</th><th>Company</th><th>Amount</th><th>Date</th><th>Status</th><th>TX</th></tr></thead>
                            <tbody>
                                {filtered.map(inv => (
                                    <tr key={inv.id}>
                                        <td><span className="font-mono font-semibold text-mg-silver">{inv.id}</span></td>
                                        <td>{inv.borrower}</td>
                                        <td><span className="font-bold text-mg-cosmic">{formatCurrency(inv.amount)}</span></td>
                                        <td>{formatDate(inv.timestamp)}</td>
                                        <td><StatusBadge status={inv.status} /></td>
                                        <td>
                                            {inv.ledgerTx
                                                ? <a href={`https://polygonscan.com/tx/${inv.ledgerTx}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-mg-cosmic hover:text-mg-lavender">View <ExternalLink className="w-3 h-3" /></a>
                                                : <span className="text-xs text-mg-dim">—</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
