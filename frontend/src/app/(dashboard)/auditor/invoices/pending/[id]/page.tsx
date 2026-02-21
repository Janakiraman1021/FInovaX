"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Invoice } from "@/lib/mock/mockInvoices";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck, AlertTriangle, FileText, Hash, Building2, Coins, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function PendingInvoiceDetail() {
    const { id }         = useParams<{ id: string }>();
    const router         = useRouter();
    const [inv, setInv]  = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [acting, setActing]   = useState(false);
    const [notes, setNotes]     = useState("");

    useEffect(() => {
        api.invoices.getAll().then(data => { setInv(data.find(i => i.id === id) ?? null); setLoading(false); });
    }, [id]);

    const handleAction = async (action: "verify" | "fraud") => {
        if (!inv) return;
        setActing(true);
        if (action === "verify") {
            await api.invoices.verify(inv.invoiceHash);
            setInv(prev => prev ? { ...prev, status: "VERIFIED" } : prev);
            toast.success("Invoice verified", { description: "Status updated to VERIFIED." });
        } else {
            setInv(prev => prev ? { ...prev, status: "FRAUD_ALERT" } : prev);
            toast.error("Invoice flagged", { description: "Status updated to FRAUD_ALERT." });
        }
        setActing(false);
    };

    if (loading) return <div className="py-24 text-center text-mg-dim text-sm italic">Loading…</div>;
    if (!inv)    return <div className="py-24 text-center"><p className="text-mg-silver font-semibold">Invoice not found</p><button onClick={() => router.back()} className="mg-btn-primary mt-4">Go back</button></div>;

    const isActioned = inv.status !== "PENDING";
    const fields = [
        { icon: FileText,   label: "Invoice ID",   value: inv.id },
        { icon: Hash,       label: "Hash",         value: inv.invoiceHash ? inv.invoiceHash.slice(0, 44) + "…" : "—", mono: true },
        { icon: Building2,  label: "Borrower",      value: inv.borrower ?? "—" },
        { icon: Coins,      label: "Amount",       value: formatCurrency(inv.amount) },
        { icon: Calendar,   label: "Submitted",    value: formatDate(inv.timestamp) },
    ];

    return (
        <div className="space-y-8 max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 rounded-xl mg-card border border-mg-lavender/15 hover:border-mg-lavender/30">
                    <ArrowLeft className="w-4 h-4 text-mg-muted" />
                </button>
                <div>
                    <p className="mg-label mb-0.5">Pending Review</p>
                    <h1 className="text-2xl font-bold text-mg-silver">Invoice <span className="mg-accent-text">{inv.id}</span></h1>
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mg-card rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between mb-1">
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

            {!isActioned && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="mg-card rounded-2xl p-6 space-y-4">
                    <p className="mg-label mb-1">Auditor Decision</p>
                    <div>
                        <label className="mg-label block mb-1.5">Review Notes</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Optional notes for the audit record…" className="mg-input resize-none" />
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => handleAction("verify")} disabled={acting}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
                            style={{ background: "linear-gradient(135deg, #059669, #10b981)", boxShadow: "0 4px 14px rgba(5,150,105,0.18)" }}>
                            <ShieldCheck className="w-4 h-4" /> Verify Invoice
                        </button>
                        <button onClick={() => handleAction("fraud")} disabled={acting}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
                            style={{ background: "linear-gradient(135deg, #dc2626, #ef4444)", boxShadow: "0 4px 14px rgba(220,38,38,0.18)" }}>
                            <AlertTriangle className="w-4 h-4" /> Flag as Fraud
                        </button>
                    </div>
                </motion.div>
            )}

            {isActioned && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 p-4 rounded-xl bg-mg-elevated border border-mg-lavender/10">
                    <ShieldCheck className="w-4 h-4 text-status-success" />
                    <p className="text-sm text-mg-muted">This invoice has already been actioned — status: <StatusBadge status={inv.status} /></p>
                </motion.div>
            )}
        </div>
    );
}
