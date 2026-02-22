"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { lenderAPI, LenderInvoice } from "@/lib/api";
import { InvoiceTimeline } from "@/components/shared/InvoiceTimeline";
import { AssuranceReportViewer } from "@/components/shared/AssuranceReportViewer";
import { TrustScoreCard } from "@/components/shared/TrustScoreCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { InteroperabilityBadge } from "@/components/shared/InteroperabilityBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import { FileText, ExternalLink, Copy, Check, ArrowLeft, Loader2, Building2, Lock } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ConfidenceBadge, ConfidenceLevel } from "@/components/shared/ConfidenceBadge";
import { RiskFlagBadge } from "@/components/shared/RiskFlagBadge";

export default function LenderInvoiceDetailsPage() {
    const searchParams = useSearchParams();
    const invoiceId = searchParams.get("id");
    
    const [invoice, setInvoice] = useState<LenderInvoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    useEffect(() => {
        if (!invoiceId) return;

        const token = localStorage.getItem("oneflow-token");
        if (!token || token.startsWith("mock.")) {
            setLoading(false);
            return;
        }

        const fetchInvoice = async () => {
            try {
                const res = await lenderAPI.getAllInvoices(token, { limit: 100 });
                const inv = res.data.invoices.find(i => i.invoiceId === invoiceId);
                if (inv) setInvoice(inv);
            } catch {
                toast.error("Failed to load invoice");
            } finally {
                setLoading(false);
            }
        };

        fetchInvoice();
    }, [invoiceId]);

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        toast.success("Copied to clipboard");
        setTimeout(() => setCopiedField(null), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-mg-dim" />
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="space-y-6">
                <Link href="/lender/loans" className="inline-flex items-center gap-2 text-sm text-mg-muted hover:text-mg-silver transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Invoices
                </Link>
                <div className="mg-card rounded-2xl p-12 text-center">
                    <p className="text-mg-dim">Invoice not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Interoperability Badge */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <Link href="/lender/loans" className="inline-flex items-center gap-2 text-sm text-mg-muted hover:text-mg-silver transition-colors mb-4">
                    <ArrowLeft className="w-4 h-4" /> Back to Invoices
                </Link>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <p className="mg-label mb-1.5">Invoice Details</p>
                        <h1 className="text-2xl sm:text-3xl font-bold text-mg-silver tracking-tight">
                            {invoice.invoiceId}
                        </h1>
                        <p className="text-sm text-mg-muted mt-1">{invoice.description || "No description"}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <StatusBadge status={invoice.status} />
                        <InteroperabilityBadge />
                    </div>
                </div>
            </motion.div>

            {/* Trust Signals — Upgrade 1 & 2 (non-blocking, informational only) */}
            {(invoice.receivableConfidence || invoice.riskFlag) && invoice.status !== "FINANCED" && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-5 py-3.5 rounded-xl border border-mg-lavender/15 flex flex-wrap items-center gap-3"
                    style={{ background: "rgba(74,78,143,0.05)" }}
                >
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-mg-dim mr-1">Trust Signals</p>
                    {invoice.receivableConfidence && (
                        <ConfidenceBadge confidence={invoice.receivableConfidence as ConfidenceLevel} />
                    )}
                    {invoice.riskFlag && (
                        <RiskFlagBadge riskFlag={invoice.riskFlag} />
                    )}
                </motion.div>
            )}

            {/* Privacy Notice for Financed Receivables */}
            {invoice.status === "FINANCED" && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-xl border flex items-start gap-3"
                    style={{
                        background: "rgba(5,150,105,0.06)",
                        borderColor: "rgba(5,150,105,0.25)",
                    }}
                >
                    <Lock className="w-5 h-5 text-status-success shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-mg-silver">This receivable has already been financed</p>
                        <p className="text-xs text-mg-muted mt-1">
                            Cross-lender privacy rules apply. Only transaction essentials are visible.
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Invoice Details Card */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mg-card rounded-2xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs uppercase tracking-widest font-semibold text-mg-dim mb-2">Amount</p>
                            <p className="text-2xl font-bold text-mg-silver">
                                {formatCurrency(invoice.amount)} <span className="text-sm font-normal text-mg-dim">{invoice.currency}</span>
                            </p>
                        </div>
                        {invoice.status !== "FINANCED" && (
                            <>
                                <div>
                                    <p className="text-xs uppercase tracking-widest font-semibold text-mg-dim mb-2">Uploaded By</p>
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-mg-lavender" />
                                        <div>
                                            <p className="text-sm font-semibold text-mg-silver">{invoice.uploadedBy.organization}</p>
                                            <p className="text-xs text-mg-dim">{invoice.uploadedBy.name}</p>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-widest font-semibold text-mg-dim mb-2">Submitted</p>
                                    <p className="text-sm text-mg-muted">{invoice.submittedAt ? formatDate(invoice.submittedAt) : formatDate(invoice.createdAt)}</p>
                                </div>
                            </>
                        )}
                        {invoice.status === "FINANCED" && (
                            <div>
                                <p className="text-xs uppercase tracking-widest font-semibold text-mg-dim mb-2">Status</p>
                                <p className="text-sm font-semibold text-status-success">Financed by a lender</p>
                            </div>
                        )}
                        {invoice.isReceivableFinanced && invoice.status !== "FINANCED" && (
                            <div className="p-3 rounded-lg bg-status-danger/5 border border-status-danger/20">
                                <p className="text-xs text-status-danger font-semibold">
                                    ⚠️ This receivable is already financed by another lender
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Hashes */}
                    <div className="space-y-4">
                        {invoice.receivableFingerprint && (
                            <div>
                                <p className="text-xs uppercase tracking-widest font-semibold text-mg-dim mb-2">Receivable Fingerprint</p>
                                <button
                                    onClick={() => copyToClipboard(invoice.receivableFingerprint!, "rfp")}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-mg-elevated hover:bg-mg-elevated/70 transition-colors w-full">
                                    <span className="font-mono text-xs text-mg-silver truncate flex-1 text-left">
                                        {invoice.receivableFingerprint}
                                    </span>
                                    {copiedField === "rfp" ? <Check className="w-4 h-4 text-status-success shrink-0" /> : <Copy className="w-4 h-4 text-mg-dim shrink-0" />}
                                </button>
                            </div>
                        )}
                        <div>
                            <p className="text-xs uppercase tracking-widest font-semibold text-mg-dim mb-2">File Hash (SHA-256)</p>
                            <button
                                onClick={() => copyToClipboard(invoice.invoiceHash, "hash")}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-mg-elevated hover:bg-mg-elevated/70 transition-colors w-full">
                                <span className="font-mono text-xs text-mg-silver truncate flex-1 text-left">
                                    {invoice.invoiceHash}
                                </span>
                                {copiedField === "hash" ? <Check className="w-4 h-4 text-status-success shrink-0" /> : <Copy className="w-4 h-4 text-mg-dim shrink-0" />}
                            </button>
                        </div>
                        {invoice.ipfsCID && (
                            <div>
                                <p className="text-xs uppercase tracking-widest font-semibold text-mg-dim mb-2">IPFS Storage</p>
                                <a
                                    href={`https://ipfs.io/ipfs/${invoice.ipfsCID}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-mg-elevated hover:bg-mg-elevated/70 transition-colors">
                                    <FileText className="w-4 h-4 text-mg-lavender shrink-0" />
                                    <span className="font-mono text-xs text-mg-silver truncate flex-1">
                                        {invoice.ipfsCID}
                                    </span>
                                    <ExternalLink className="w-4 h-4 text-mg-dim shrink-0" />
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Trust Score */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <TrustScoreCard msmeId={invoice.uploadedBy._id} detailed />
                </motion.div>

                {/* Timeline */}
                {/* <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <InvoiceTimeline invoiceId={invoice.invoiceId} />
                </motion.div> */}

                {/* Assurance Report */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <AssuranceReportViewer invoiceId={invoice.invoiceId} canAcknowledge />
                </motion.div>
            </div>
        </div>
    );
}
