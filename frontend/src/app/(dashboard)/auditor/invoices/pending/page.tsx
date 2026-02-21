"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Invoice } from "@/lib/mock/mockInvoices";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import { Clock, Search } from "lucide-react";
import Link from "next/link";

export default function AuditorPendingInvoices() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [query, setQuery]       = useState("");
    const [loading, setLoading]   = useState(true);

    useEffect(() => {
        api.invoices.getAll().then(data => {
            setInvoices(data.filter(i => i.status === "PENDING"));
            setLoading(false);
        });
    }, []);

    const filtered = invoices.filter(i =>
        !query || i.id.toLowerCase().includes(query.toLowerCase()) || (i.borrower ?? "").toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <p className="mg-label mb-1.5">Regulator View</p>
                <h1 className="text-3xl font-bold text-mg-silver tracking-tight">
                    Pending <span className="mg-accent-text">Review</span>
                </h1>
                <p className="text-sm text-mg-muted mt-1">Invoices awaiting regulatory audit and verification</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mg-card rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-mg-lavender/10 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(234,179,8,0.10)", border: "1px solid rgba(234,179,8,0.22)" }}>
                            <Clock className="w-4 h-4 text-status-warning" />
                        </div>
                        <div>
                            <p className="font-semibold text-mg-silver text-sm">Pending Invoices</p>
                            <p className="text-[10px] text-mg-dim">{filtered.length} awaiting review</p>
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-mg-dim" />
                        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search…" className="mg-input pl-8 text-sm w-48" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    {loading ? <div className="py-16 text-center text-mg-dim text-sm italic">Loading…</div>
                    : filtered.length === 0 ? <div className="py-16 text-center"><Clock className="w-10 h-10 text-mg-dim mx-auto mb-3" /><p className="text-sm text-mg-dim italic">No pending invoices</p></div>
                    : (
                        <table className="w-full mg-table">
                            <thead><tr><th>Invoice ID</th><th>Company</th><th>Amount</th><th>Submitted</th><th>Status</th><th>Review</th></tr></thead>
                            <tbody>
                                {filtered.map(inv => (
                                    <tr key={inv.id}>
                                        <td><span className="font-mono font-semibold text-mg-silver">{inv.id}</span></td>
                                        <td>{inv.borrower}</td>
                                        <td><span className="font-bold text-mg-cosmic">{formatCurrency(inv.amount)}</span></td>
                                        <td>{formatDate(inv.timestamp)}</td>
                                        <td><StatusBadge status={inv.status} /></td>
                                        <td>
                                            <Link href={`/auditor/invoices/pending/${inv.id}`}
                                                className="px-3 py-1 rounded-lg text-xs font-semibold bg-mg-elevated border border-mg-lavender/15 text-mg-cosmic hover:border-mg-cosmic/30 transition-colors">
                                                Review →
                                            </Link>
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
