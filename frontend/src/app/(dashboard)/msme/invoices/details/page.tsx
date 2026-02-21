"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { invoiceAPI, UploadedInvoice } from "@/lib/api";
import { InvoiceTimeline } from "@/components/shared/InvoiceTimeline";
import { AssuranceReportForm } from "@/components/shared/AssuranceReportForm";
import { AssuranceReportViewer } from "@/components/shared/AssuranceReportViewer";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import { FileText, ExternalLink, Copy, Check, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function MSMEInvoiceDetailsPage() {
    const searchParams = useSearchParams();
    const invoiceId = searchParams.get("id");
    
    const [invoice, setInvoice] = useState<UploadedInvoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [showAssuranceForm, setShowAssuranceForm] = useState(false);

    useEffect(() => {
        if (!invoiceId) return;

        const token = localStorage.getItem("oneflow-token");
        if (!token || token.startsWith("mock.")) {
            setLoading(false);
            return;
        }

        const fetchInvoice = async () => {
            try {
                const res = await invoiceAPI.getMyInvoices(token, { limit: 100 });
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
                <Link href="/msme/invoices" className="inline-flex items-center gap-2 text-sm text-mg-muted hover:text-mg-silver transition-colors">
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
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <Link href="/msme/invoices" className="inline-flex items-center gap-2 text-sm text-mg-muted hover:text-mg-silver transition-colors mb-4">
                    <ArrowLeft className="w-4 h-4" /> Back to Invoices
                </Link>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <p className="mg-label mb-1.5">Invoice Details</p>
                        <h1 className="text-2xl sm:text-3xl font-bold text-mg-silver tracking-tight">
                            {invoice.invoiceId}
                        </h1>
                        <p className="text-sm text-mg-muted mt-1">{invoice.description || "No description"}</p>
                    </div>
                    <StatusBadge status={invoice.status} />
                </div>
            </motion.div>

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
                        <div>
                            <p className="text-xs uppercase tracking-widest font-semibold text-mg-dim mb-2">Uploaded</p>
                            <p className="text-sm text-mg-muted">{formatDate(invoice.createdAt)}</p>
                        </div>
                        {invoice.submittedTo && invoice.submittedTo.length > 0 && (
                            <div>
                                <p className="text-xs uppercase tracking-widest font-semibold text-mg-dim mb-2">Submitted To</p>
                                <div className="flex flex-wrap gap-2">
                                    {invoice.submittedTo.map(lender => (
                                        <span key={lender._id} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-mg-cosmic/10 text-mg-lavender border border-mg-lavender/20">
                                            {lender.name}
                                        </span>
                                    ))}
                                </div>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Timeline */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <InvoiceTimeline invoiceId={invoice.invoiceId} />
                </motion.div>

                {/* Assurance Report */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    {showAssuranceForm ? (
                        <AssuranceReportForm 
                            invoiceId={invoice.invoiceId} 
                            onSubmitted={() => setShowAssuranceForm(false)}
                        />
                    ) : (
                        <>
                            <AssuranceReportViewer invoiceId={invoice.invoiceId} />
                            <button
                                onClick={() => setShowAssuranceForm(true)}
                                className="w-full mt-4 py-2.5 rounded-lg border-2 border-dashed border-mg-lavender/30 text-mg-muted hover:border-mg-lavender/50 hover:text-mg-silver transition-colors text-sm font-semibold">
                                + Submit New Report
                            </button>
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
