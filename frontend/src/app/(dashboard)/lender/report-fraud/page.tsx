"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Send, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const REASONS = [
    "Duplicate invoice submission",
    "Inflated invoice amount",
    "Non-existent goods/services",
    "Forged seller signature",
    "Invoice hash mismatch",
    "Other",
];

export default function LenderReportFraud() {
    const [invoiceId, setInvoiceId] = useState("");
    const [reason, setReason]       = useState("");
    const [details, setDetails]     = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading]     = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!invoiceId.trim() || !reason) { toast.error("Please fill in all required fields."); return; }
        setLoading(true);
        await new Promise(r => setTimeout(r, 1200));
        setLoading(false);
        setSubmitted(true);
        toast.success("Fraud report submitted", { description: "Regulators have been notified for review." });
    };

    if (submitted) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <div className="w-16 h-16 rounded-2xl bg-status-success/10 border border-status-success/25 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-status-success" />
                </div>
                <h2 className="text-2xl font-bold text-mg-silver">Report Submitted</h2>
                <p className="text-mg-muted mt-2 max-w-sm mx-auto">Your fraud report for <span className="font-semibold text-mg-silver">{invoiceId}</span> has been forwarded to the regulatory auditing team.</p>
                <button onClick={() => { setSubmitted(false); setInvoiceId(""); setReason(""); setDetails(""); }}
                    className="mg-btn-primary mt-6 gap-2">Submit another report</button>
            </motion.div>
        </div>
    );

    return (
        <div className="space-y-8 max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <p className="mg-label mb-1.5">Lender Console</p>
                <h1 className="text-3xl font-bold text-mg-silver tracking-tight">
                    Report <span className="mg-accent-text">Fraud</span>
                </h1>
                <p className="text-sm text-mg-muted mt-1">Flag suspicious invoices for regulatory review</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-status-danger/5 border border-status-danger/20">
                <AlertTriangle className="w-5 h-5 text-status-danger shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-semibold text-mg-silver">Important Notice</p>
                    <p className="text-xs text-mg-muted mt-0.5">Only submit fraud reports for invoices you have reasonable grounds to believe are fraudulent. False reports can result in account suspension.</p>
                </div>
            </motion.div>

            <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                className="mg-card rounded-2xl p-6 space-y-5">
                <p className="mg-label mb-1">Report Details</p>

                <div>
                    <label className="mg-label block mb-1.5">Invoice ID <span className="text-status-danger">*</span></label>
                    <input value={invoiceId} onChange={e => setInvoiceId(e.target.value)} placeholder="e.g. INV-2024-001" className="mg-input" required />
                </div>

                <div>
                    <label className="mg-label block mb-1.5">Reason <span className="text-status-danger">*</span></label>
                    <select value={reason} onChange={e => setReason(e.target.value)} className="mg-input" required>
                        <option value="">Select a reason…</option>
                        {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>

                <div>
                    <label className="mg-label block mb-1.5">Additional Details</label>
                    <textarea value={details} onChange={e => setDetails(e.target.value)} rows={5} placeholder="Describe your concerns in detail…"
                        className="mg-input resize-none" />
                </div>

                <button type="submit" disabled={loading} className="mg-btn-primary w-full justify-center gap-2">
                    {loading ? <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />Submitting…</> : <><Send className="w-4 h-4" />Submit Fraud Report</>}
                </button>
            </motion.form>
        </div>
    );
}
