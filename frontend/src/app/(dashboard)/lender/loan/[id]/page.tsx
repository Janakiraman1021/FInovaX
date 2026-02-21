"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { lenderAPI, LenderVerifyResult } from "@/lib/api";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, FileText, Hash, Building2, Calendar,
         Coins, User, ShieldCheck, ShieldX, BadgeCheck, Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoanDetail() {
    const { id }    = useParams<{ id: string }>();
    const router    = useRouter();
    const [data,    setData]    = useState<LenderVerifyResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState("");

    useEffect(() => {
        const token = localStorage.getItem("finovax-token") ?? "";
        if (!token || token.startsWith("mock.")) { setLoading(false); setError("Real lender account required."); return; }
        lenderAPI.verifyInvoice(token, decodeURIComponent(id))
            .then(res => setData(res.data))
            .catch(err => setError(err instanceof Error ? err.message : "Failed to load"))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 text-mg-dim mx-auto animate-spin" />
        </div>
    );

    if (error || !data?.invoice) return (
        <div className="py-24 text-center space-y-4">
            <FileText className="w-12 h-12 text-mg-dim mx-auto" />
            <p className="text-mg-silver font-semibold">{error || "Invoice not found"}</p>
            <button onClick={() => router.back()} className="mg-btn-primary gap-2">
                <ArrowLeft className="w-4 h-4" />Go back
            </button>
        </div>
    );

    const inv  = data.invoice;
    const ver  = data.verification;

    const fields = [
        { icon: FileText,   label: "Invoice ID",     value: inv.invoiceId },
        { icon: Hash,       label: "Invoice Hash",   value: inv.invoiceHash ? inv.invoiceHash.slice(0, 40) + "…" : "—", mono: true },
        { icon: Building2,  label: "MSME",           value: inv.uploadedBy?.organization ?? inv.uploadedBy?.name ?? "—" },
        { icon: User,       label: "Contact",        value: inv.uploadedBy?.email ?? "—" },
        { icon: Coins,      label: "Amount",         value: `${formatCurrency(inv.amount)} ${inv.currency}` },
        { icon: Calendar,   label: "Status",         value: inv.status },
        { icon: Building2,  label: "Financed By",    value: inv.financedBy?.organization ?? inv.financedBy?.name ?? "Not financed" },
        { icon: Calendar,   label: "Financed At",    value: inv.financedAt ? formatDate(inv.financedAt) : "—" },
    ];

    return (
        <div className="space-y-8 max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 rounded-xl mg-card border border-mg-lavender/15 hover:border-mg-lavender/30 transition-colors">
                    <ArrowLeft className="w-4 h-4 text-mg-muted" />
                </button>
                <div>
                    <p className="mg-label mb-0.5">Lender Console</p>
                    <h1 className="text-2xl font-bold text-mg-silver">
                        Loan <span className="mg-accent-text">{inv.invoiceId}</span>
                    </h1>
                </div>
            </motion.div>

            {/* Verification badge */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
                className="flex items-center gap-3 p-4 rounded-xl border"
                style={{
                    background: ver.valid ? "rgba(5,150,105,0.06)" : "rgba(220,38,38,0.06)",
                    borderColor: ver.valid ? "rgba(5,150,105,0.25)" : "rgba(220,38,38,0.25)",
                }}>
                {ver.valid
                    ? <ShieldCheck className="w-5 h-5 text-status-success shrink-0" />
                    : <ShieldX     className="w-5 h-5 text-status-danger shrink-0" />}
                <div>
                    <p className="text-sm font-semibold" style={{ color: ver.valid ? "#059669" : "#dc2626" }}>
                        {ver.financed ? "Already Financed" : ver.valid ? "Integrity Verified" : "Verification Failed"}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-0.5">
                        {[
                            { label: "On-Chain",  ok: ver.registeredOnChain },
                            { label: "Valid",      ok: ver.valid },
                            { label: "Duplicate", ok: !ver.duplicate },
                            { label: "Eligible",  ok: data.canFinance },
                        ].map(b => (
                            <span key={b.label} className="inline-flex items-center gap-1 text-[10px] font-medium"
                                style={{ color: b.ok ? "#059669" : "#d97706" }}>
                                <BadgeCheck className="w-3 h-3" />{b.label}
                            </span>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Details */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                className="mg-card rounded-2xl p-6 space-y-5">
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
            </motion.div>

            {/* Finance action — only if eligible */}
            {data.canFinance && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
                    <Link href={`/lender/disbursement`}
                        className="mg-btn-primary w-full justify-center gap-2">
                        <Coins className="w-4 h-4" />Proceed to Disbursement
                    </Link>
                </motion.div>
            )}

            {/* On-chain tx if financed */}
            {inv.financedAt && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
                    className="mg-card rounded-2xl p-6">
                    <p className="mg-label mb-3">On-Chain Record</p>
                    <div className="flex items-center justify-between gap-4 bg-mg-elevated rounded-xl p-4 border border-mg-lavender/08">
                        <p className="font-mono text-xs text-mg-silver break-all">
                            {inv.invoiceHash ?? "—"}
                        </p>
                        <a href={`https://sepolia.etherscan.io/tx/${inv.invoiceHash}`} target="_blank" rel="noreferrer"
                            className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-mg-cosmic hover:text-mg-lavender transition-colors">
                            Etherscan <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    </div>
                </motion.div>
            )}
        </div>
    );
}


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
