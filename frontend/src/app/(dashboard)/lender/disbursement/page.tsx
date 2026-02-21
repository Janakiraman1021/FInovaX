"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Invoice } from "@/lib/mock/mockInvoices";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate, generateTxHash } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Banknote, CheckCircle, ArrowRight, Coins, FileCheck } from "lucide-react";
import { toast } from "sonner";

type Step = "select" | "confirm" | "success";

export default function LenderDisbursement() {
    const [invoices, setInvoices]   = useState<Invoice[]>([]);
    const [selected, setSelected]   = useState<Invoice | null>(null);
    const [step, setStep]           = useState<Step>("select");
    const [txHash, setTxHash]       = useState("");
    const [loading, setLoading]     = useState(false);

    useEffect(() => {
        api.invoices.getAll().then((data: Invoice[]) => setInvoices(data.filter(i => i.status === "VERIFIED")));
    }, []);

    const handleConfirm = async () => {
        if (!selected) return;
        setLoading(true);
        const tx = generateTxHash();
        await api.invoices.disburse(selected.id, "Sarah Smith (Lender)", tx);
        setTxHash(tx);
        setInvoices(prev => prev.filter(i => i.id !== selected.id));
        setLoading(false);
        setStep("success");
        toast.success("Disbursement complete");
    };

    return (
        <div className="space-y-8 max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <p className="mg-label mb-1.5">Lender Console</p>
                <h1 className="text-3xl font-bold text-mg-silver tracking-tight">
                    Disbursement <span className="mg-accent-text">Workflow</span>
                </h1>
                <p className="text-sm text-mg-muted mt-1">Settle verified invoices with on-chain transactions</p>
            </motion.div>

            {/* Progress stepper */}
            <div className="flex items-center gap-3">
                {(["select", "confirm", "success"] as Step[]).map((s, i) => (
                    <div key={s} className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === s ? "bg-mg-cosmic text-white shadow-[0_0_10px_rgba(74,78,143,0.4)]" : i < ["select","confirm","success"].indexOf(step) ? "bg-status-success text-white" : "bg-mg-elevated text-mg-dim border border-mg-lavender/15"}`}>
                            {i < ["select","confirm","success"].indexOf(step) ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                        </div>
                        <span className={`text-xs font-medium capitalize ${step === s ? "text-mg-silver" : "text-mg-dim"}`}>{s}</span>
                        {i < 2 && <ArrowRight className="w-3.5 h-3.5 text-mg-dim" />}
                    </div>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {step === "select" && (
                    <motion.div key="select" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                        className="mg-card rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-mg-lavender/10 flex items-center gap-3">
                            <FileCheck className="w-4 h-4 text-mg-lavender" />
                            <p className="font-semibold text-mg-silver text-sm">Select Invoice to Disburse</p>
                        </div>
                        <div className="p-4 space-y-3 max-h-[380px] overflow-y-auto">
                            {invoices.length === 0 ? (
                                <div className="py-16 text-center"><Coins className="w-10 h-10 text-mg-dim mx-auto mb-3" /><p className="text-sm text-mg-dim italic">No eligible invoices</p></div>
                            ) : invoices.map(inv => (
                                <button key={inv.id} onClick={() => { setSelected(inv); setStep("confirm"); }}
                                    className={`w-full text-left p-4 rounded-xl border transition-all ${selected?.id === inv.id ? "border-mg-cosmic bg-mg-cosmic/5" : "border-mg-lavender/10 bg-mg-elevated hover:border-mg-lavender/25"}`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-mono font-semibold text-mg-silver text-sm">{inv.id}</span>
                                                <StatusBadge status={inv.status} />
                                            </div>
                                            <p className="text-xs text-mg-muted">{inv.borrower} · {formatDate(inv.timestamp)}</p>
                                        </div>
                                        <p className="text-lg font-bold text-status-success">{formatCurrency(inv.amount)}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {step === "confirm" && selected && (
                    <motion.div key="confirm" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                        className="mg-card rounded-2xl p-6 space-y-5">
                        <p className="mg-label mb-1">Confirm Disbursement</p>
                        <div className="bg-mg-elevated rounded-xl border border-mg-lavender/10 p-4 space-y-3">
                            {[["Invoice ID", selected.id, true], ["Borrower", selected.borrower ?? "—", false], ["Amount", formatCurrency(selected.amount), false], ["Date", formatDate(selected.timestamp), false]].map(([k, v, mono]) => (
                                <div key={String(k)} className="flex justify-between items-center">
                                    <span className="text-xs text-mg-muted">{k}</span>
                                    <span className={`text-sm font-semibold text-mg-silver ${mono ? "font-mono" : ""}`}>{v}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setStep("select")} className="flex-1 px-4 py-2.5 rounded-xl border border-mg-lavender/20 text-sm font-medium text-mg-muted hover:text-mg-silver transition-colors">Back</button>
                            <button onClick={handleConfirm} disabled={loading} className="flex-1 mg-btn-primary justify-center gap-2">
                                {loading ? <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />Processing…</> : <><Banknote className="w-4 h-4" />Confirm & Disburse</>}
                            </button>
                        </div>
                    </motion.div>
                )}

                {step === "success" && (
                    <motion.div key="success" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mg-card rounded-2xl p-8 text-center space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-status-success/10 border border-status-success/25 flex items-center justify-center mx-auto">
                            <CheckCircle className="w-8 h-8 text-status-success" />
                        </div>
                        <h2 className="text-xl font-bold text-mg-silver">Disbursement Complete</h2>
                        <p className="text-mg-muted text-sm">Capital has been successfully settled on-chain.</p>
                        <div className="bg-mg-elevated rounded-xl p-3 border border-mg-lavender/10">
                            <p className="text-[10px] text-mg-dim mb-1">TRANSACTION HASH</p>
                            <p className="font-mono text-xs text-mg-silver break-all">{txHash}</p>
                        </div>
                        <a href={`https://polygonscan.com/tx/${txHash}`} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-mg-cosmic hover:text-mg-lavender transition-colors">
                            View on Polygonscan →
                        </a>
                        <div className="pt-2">
                            <button onClick={() => { setStep("select"); setSelected(null); setTxHash(""); }} className="mg-btn-primary gap-2">
                                <Banknote className="w-4 h-4" />New Disbursement
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
