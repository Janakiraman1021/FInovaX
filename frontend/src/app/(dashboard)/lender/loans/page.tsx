"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Invoice } from "@/lib/mock/mockInvoices";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import { BookOpen, ExternalLink, Search } from "lucide-react";
import Link from "next/link";

export default function LenderLoans() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [query, setQuery]       = useState("");
    const [loading, setLoading]   = useState(true);

    useEffect(() => {
        api.invoices.getAll().then((data: Invoice[]) => {
            setInvoices(data.filter(i => i.status === "FINANCED"));
            setLoading(false);
        });
    }, []);

    const filtered = invoices.filter(i =>
        i.id.toLowerCase().includes(query.toLowerCase()) ||
        (i.borrower ?? "").toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <p className="mg-label mb-1.5">Lender Console</p>
                <h1 className="text-3xl font-bold text-mg-silver tracking-tight">
                    All <span className="mg-accent-text">Loans</span>
                </h1>
                <p className="text-sm text-mg-muted mt-1">Complete history of financed invoices</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mg-card rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-mg-lavender/10 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(74,78,143,0.09)", border: "1px solid rgba(74,78,143,0.20)" }}>
                            <BookOpen className="w-4 h-4 text-mg-lavender" />
                        </div>
                        <p className="font-semibold text-mg-silver text-sm">{filtered.length} loans</p>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-mg-dim" />
                        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by ID or company…" className="mg-input pl-8 text-sm w-56" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="py-16 text-center text-mg-dim text-sm italic">Loading…</div>
                    ) : filtered.length === 0 ? (
                        <div className="py-16 text-center">
                            <BookOpen className="w-10 h-10 text-mg-dim mx-auto mb-3" />
                            <p className="text-sm text-mg-dim italic">No financed loans found</p>
                        </div>
                    ) : (
                        <table className="w-full mg-table">
                            <thead>
                                <tr>
                                    <th>Invoice ID</th><th>Company</th><th>Amount</th><th>Date</th><th>Lender</th><th>Status</th><th>TX</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(inv => (
                                    <tr key={inv.id} className="hover:bg-mg-elevated/50 transition-colors">
                                        <td>
                                            <Link href={`/lender/loan/${inv.id}`} className="font-mono font-semibold text-mg-cosmic hover:text-mg-lavender transition-colors">
                                                {inv.id}
                                            </Link>
                                        </td>
                                        <td>{inv.borrower}</td>
                                        <td><span className="font-bold text-status-success">{formatCurrency(inv.amount)}</span></td>
                                        <td>{formatDate(inv.timestamp)}</td>
                                        <td>{inv.lender ?? "—"}</td>
                                        <td><StatusBadge status={inv.status} /></td>
                                        <td>
                                            {inv.ledgerTx ? (
                                                <a href={`https://polygonscan.com/tx/${inv.ledgerTx}`} target="_blank" rel="noreferrer"
                                                    className="flex items-center gap-1 text-xs text-mg-cosmic hover:text-mg-lavender">
                                                    View <ExternalLink className="w-3 h-3" />
                                                </a>
                                            ) : <span className="text-xs text-mg-dim">—</span>}
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
