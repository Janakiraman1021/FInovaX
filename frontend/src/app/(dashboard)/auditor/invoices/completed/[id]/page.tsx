"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { auditorAPI, LenderInvoice, AuditLog } from "@/lib/api";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import {
    ArrowLeft, FileText, Hash, Building2, Coins, Calendar, User,
    Link2, ShieldCheck, Activity, AlertCircle, ExternalLink, Copy, Check,
} from "lucide-react";

const ETHERSCAN = "https://sepolia.etherscan.io/tx/";

const EVENT_META: Record<string, { label: string; color: string }> = {
    invoice_uploaded:            { label: "Invoice Uploaded",    color: "#0891b2" },
    invoice_registered_on_chain: { label: "On-Chain Registered", color: "#059669" },
    InvoiceRegistered:           { label: "On-Chain Registered", color: "#059669" },
    invoice_financed:            { label: "Invoice Financed",    color: "#059669" },
    InvoiceFinanced:             { label: "Invoice Financed",    color: "#059669" },
    invoice_verified:            { label: "Verified",            color: "#7c3aed" },
    finance_blocked_duplicate:   { label: "Duplicate Blocked",   color: "#dc2626" },
    DuplicateFinancingAttempt:   { label: "Duplicate Blocked",   color: "#dc2626" },
};

function CopyBtn({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="shrink-0 p-1 rounded hover:bg-mg-elevated transition-colors">
            {copied ? <Check className="w-3 h-3 text-status-success" /> : <Copy className="w-3 h-3 text-mg-dim hover:text-mg-lavender" />}
        </button>
    );
}

export default function CompletedInvoiceDetail() {
    const { id }    = useParams<{ id: string }>();
    const router    = useRouter();
    const invoiceId = decodeURIComponent(id);

    const [inv, setInv]   = useState<LenderInvoice | null>(null);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState("");

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const token = localStorage.getItem("oneflow-token") ?? "";
            const [invRes, logsRes] = await Promise.all([
                auditorAPI.getAllInvoices(token, { limit: 200 }),
                auditorAPI.getInvoiceLogs(token, invoiceId),
            ]);
            setInv(invRes.data.invoices.find(i => i.invoiceId === invoiceId) ?? null);
            setLogs(logsRes.data.logs);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to load invoice");
        } finally {
            setLoading(false);
        }
    }, [invoiceId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) return <div className="py-24 text-center text-mg-dim text-sm italic">Loading…</div>;
    if (error)   return (
        <div className="py-24 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-status-danger mx-auto" />
            <p className="text-mg-silver font-semibold">{error}</p>
            <button onClick={() => router.back()} className="mg-btn-primary">Go back</button>
        </div>
    );
    if (!inv) return (
        <div className="py-24 text-center space-y-3">
            <p className="text-mg-silver font-semibold">Invoice not found</p>
            <button onClick={() => router.back()} className="mg-btn-primary">Go back</button>
        </div>
    );

    const fields = [
        { icon: FileText,  label: "Invoice ID",   value: inv.invoiceId,                     mono: true },
        { icon: Building2, label: "MSME",         value: inv.uploadedBy?.organization ?? "—"            },
        { icon: User,      label: "Lender",        value: inv.financedBy?.organization ?? "—"            },
        { icon: Coins,     label: "Amount",       value: formatCurrency(inv.amount)                     },
        { icon: Calendar,  label: "Financed At",  value: inv.financedAt ? formatDate(inv.financedAt) : "—" },
    ];

    return (
        <div className="space-y-8 max-w-2xl">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 rounded-xl mg-card border border-mg-lavender/15 hover:border-mg-lavender/30">
                    <ArrowLeft className="w-4 h-4 text-mg-muted" />
                </button>
                <div>
                    <p className="mg-label mb-0.5">Completed Audit</p>
                    <h1 className="text-2xl font-bold text-mg-silver">Invoice <span className="mg-accent-text">{inv.invoiceId}</span></h1>
                </div>
            </motion.div>

            {/* Core Details */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mg-card rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between mb-1">
                    <p className="mg-label">Audit Record</p>
                    <StatusBadge status={inv.status} />
                </div>
                {fields.map(f => (
                    <div key={f.label} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-mg-elevated border border-mg-lavender/10">
                            <f.icon className="w-4 h-4 text-mg-dim" />
                        </div>
                        <div>
                            <p className="mg-label text-[10px] mb-0.5">{f.label}</p>
                            <p className={`text-sm font-medium text-mg-silver ${f.mono ? "font-mono" : ""}`}>{f.value}</p>
                        </div>
                    </div>
                ))}
                {/* Invoice Hash */}
                {inv.invoiceHash && (
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-mg-elevated border border-mg-lavender/10">
                            <Hash className="w-4 h-4 text-mg-dim" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="mg-label text-[10px] mb-0.5">Invoice Hash</p>
                            <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs text-mg-silver break-all">{inv.invoiceHash.slice(0,16)}…{inv.invoiceHash.slice(-8)}</span>
                                <CopyBtn text={inv.invoiceHash} />
                            </div>
                        </div>
                    </div>
                )}
                {/* IPFS CID */}
                {inv.ipfsCID && (
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-mg-elevated border border-mg-lavender/10">
                            <Link2 className="w-4 h-4 text-mg-dim" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="mg-label text-[10px] mb-0.5">IPFS CID</p>
                            <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs text-mg-silver">{inv.ipfsCID.slice(0,20)}…</span>
                                <CopyBtn text={inv.ipfsCID} />
                                <a href={`https://ipfs.io/ipfs/${inv.ipfsCID}`} target="_blank" rel="noopener noreferrer"
                                    className="shrink-0 p-1 rounded hover:bg-mg-elevated transition-colors">
                                    <ExternalLink className="w-3 h-3 text-mg-dim hover:text-mg-cosmic" />
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* On-chain hashes */}
            {(inv.blockchainTxHash || inv.financeTxHash) && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="mg-card rounded-2xl p-6 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck className="w-4 h-4 text-status-success" />
                        <p className="mg-label">On-Chain Records</p>
                    </div>
                    {inv.blockchainTxHash && (
                        <div>
                            <p className="text-[10px] text-mg-dim mb-1">Registration TX</p>
                            <div className="flex items-center gap-2 bg-mg-elevated rounded-xl p-3 border border-mg-lavender/08">
                                <span className="font-mono text-xs text-mg-silver flex-1 break-all">{inv.blockchainTxHash}</span>
                                <CopyBtn text={inv.blockchainTxHash} />
                                <a href={`${ETHERSCAN}${inv.blockchainTxHash}`} target="_blank" rel="noopener noreferrer"
                                    className="shrink-0 p-1 rounded hover:bg-mg-card transition-colors">
                                    <ExternalLink className="w-3.5 h-3.5 text-mg-dim hover:text-mg-cosmic" />
                                </a>
                            </div>
                        </div>
                    )}
                    {inv.financeTxHash && (
                        <div>
                            <p className="text-[10px] text-mg-dim mb-1">Finance TX</p>
                            <div className="flex items-center gap-2 bg-mg-elevated rounded-xl p-3 border border-mg-lavender/08">
                                <span className="font-mono text-xs text-mg-silver flex-1 break-all">{inv.financeTxHash}</span>
                                <CopyBtn text={inv.financeTxHash} />
                                <a href={`${ETHERSCAN}${inv.financeTxHash}`} target="_blank" rel="noopener noreferrer"
                                    className="shrink-0 p-1 rounded hover:bg-mg-card transition-colors">
                                    <ExternalLink className="w-3.5 h-3.5 text-mg-dim hover:text-mg-cosmic" />
                                </a>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Audit Timeline */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mg-card rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-4 h-4 text-mg-lavender" />
                    <p className="mg-label">Audit Timeline</p>
                    <span className="ml-auto text-[10px] text-mg-dim">{logs.length} event{logs.length !== 1 ? "s" : ""}</span>
                </div>
                {logs.length === 0 ? (
                    <p className="text-sm text-mg-dim italic text-center py-6">No audit events recorded</p>
                ) : (
                    <ol className="relative border-l border-mg-lavender/15 space-y-5 ml-2">
                        {logs.map(log => {
                            const meta = EVENT_META[log.eventType];
                            return (
                                <li key={log._id} className="ml-4">
                                    <div className="absolute -left-1.5 w-3 h-3 rounded-full border-2 border-mg-bg"
                                        style={{ background: meta?.color ?? "#888" }} />
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-xs font-semibold text-mg-silver">{meta?.label ?? log.eventType}</p>
                                            {log.performedBy && (
                                                <p className="text-[10px] text-mg-dim mt-0.5">by {log.performedBy.name} ({log.performedBy.role})</p>
                                            )}
                                            {log.txHash && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <span className="font-mono text-[10px] text-mg-dim">{log.txHash.slice(0,16)}…</span>
                                                    <a href={`${ETHERSCAN}${log.txHash}`} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink className="w-2.5 h-2.5 text-mg-dim hover:text-mg-cosmic" />
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-mg-dim shrink-0">{formatDate(log.createdAt)}</span>
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                )}
            </motion.div>
        </div>
    );
}


