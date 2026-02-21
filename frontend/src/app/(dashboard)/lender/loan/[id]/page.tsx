"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Invoice } from "@/lib/mock/mockInvoices";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, FileText, Hash, Building2, Calendar, Coins, User } from "lucide-react";

export default function LoanDetail() {
    const { id }       = useParams<{ id: string }>();
    const router       = useRouter();
    const [inv, setInv] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.invoices.getAll().then((data: Invoice[]) => {
            setInv(data.find(i => i.id === id) ?? null);
            setLoading(false);
        });
    }, [id]);

    if (loading) return <div className="py-24 text-center text-mg-dim text-sm italic">Loading loan details…</div>;
    if (!inv) return (
        <div className="py-24 text-center space-y-4">
            <FileText className="w-12 h-12 text-mg-dim mx-auto" />
            <p className="text-mg-silver font-semibold">Loan not found</p>
            <button onClick={() => router.back()} className="mg-btn-primary gap-2"><ArrowLeft className="w-4 h-4" />Go back</button>
        </div>
    );

    const fields = [
        { icon: FileText,   label: "Invoice ID",    value: inv.id },
        { icon: Hash,       label: "Invoice Hash",  value: inv.invoiceHash ? inv.invoiceHash.slice(0, 40) + "…" : "—", mono: true },
        { icon: Building2,  label: "Borrower",      value: inv.borrower ?? "—" },
        { icon: Coins,      label: "Amount",        value: formatCurrency(inv.amount) },
        { icon: Calendar,   label: "Date",          value: formatDate(inv.timestamp) },
        { icon: User,       label: "Lender",        value: inv.lender ?? "Not assigned" },
    ];

    return (
        <div className="space-y-8 max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 rounded-xl mg-card border border-mg-lavender/15 hover:border-mg-lavender/30 transition-colors">
                    <ArrowLeft className="w-4 h-4 text-mg-muted" />
                </button>
                <div>
                    <p className="mg-label mb-0.5">Lender Console</p>
                    <h1 className="text-2xl font-bold text-mg-silver">Loan <span className="mg-accent-text">{inv.id}</span></h1>
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mg-card rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between mb-2">
                    <p className="mg-label">Invoice Details</p>
                    <StatusBadge status={inv.status} />
                </div>

                {fields.map(f => (
                    <div key={f.label} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-mg-elevated border border-mg-lavender/10">
                            <f.icon className="w-4 h-4 text-mg-dim" />
                        </div>
                        <div>
                            <p className="mg-label text-[10px] mb-0.5">{f.label}</p>
                            <p className={`text-sm font-medium text-mg-silver ${f.mono ? "font-mono break-all" : ""}`}>{f.value}</p>
                        </div>
                    </div>
                ))}

                {inv.description && (
                    <div>
                        <p className="mg-label text-[10px] mb-1">Description</p>
                        <p className="text-sm text-mg-muted bg-mg-elevated rounded-xl p-3 border border-mg-lavender/08">{inv.description}</p>
                    </div>
                )}
            </motion.div>

            {inv.ledgerTx && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="mg-card rounded-2xl p-6">
                    <p className="mg-label mb-3">On-Chain Transaction</p>
                    <div className="flex items-center justify-between gap-4 bg-mg-elevated rounded-xl p-4 border border-mg-lavender/08">
                        <p className="font-mono text-xs text-mg-silver break-all">{inv.ledgerTx}</p>
                        <a href={`https://polygonscan.com/tx/${inv.ledgerTx}`} target="_blank" rel="noreferrer"
                            className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-mg-cosmic hover:text-mg-lavender transition-colors">
                            Polygonscan <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
