"use client";

import { useState, useEffect } from "react";
import { Search, ShieldCheck, ShieldAlert, ShieldX, Cpu, X,
         BadgeCheck, User, Building2, DollarSign, Hash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { lenderAPI, LenderVerifyResult } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

type ResultState = {
    kind: "verified" | "financed" | "not_found" | "error";
    data?: LenderVerifyResult;
    message?: string;
};

export const HashVerifier = () => {
    const searchParams  = useSearchParams();
    const [query, setQuery]        = useState(() => searchParams.get("hash") ?? "");
    const [isVerifying, setVerify] = useState(false);
    const [result, setResult]      = useState<ResultState | null>(null);

    // Auto-verify when arriving from the invoice table Verify button
    useEffect(() => {
        const h = searchParams.get("hash");
        if (h) {
            setQuery(h);
            // Trigger verify after state settles
            const id = setTimeout(() => handleVerifyFor(h), 100);
            return () => clearTimeout(id);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleVerifyFor = async (q: string) => {
        const token = localStorage.getItem("finovax-token") ?? "";
        if (!token || token.startsWith("mock.")) {
            toast.error("Lender account required", { description: "Log in with a real lender account to verify invoices." });
            return;
        }
        setVerify(true);
        setResult(null);
        try {
            const res = await lenderAPI.verifyInvoice(token, q);
            const d   = res.data;
            
            // Safety check for data structure
            if (!d || !d.verification) {
                throw new Error("Invalid response format from server");
            }
            
            // Handle NOT_FOUND case
            if (d.verification.status === 'NOT_FOUND' || !d.invoice) {
                setResult({ kind: "not_found" });
                toast.warning("Hash not found", { description: "No invoice with this ID or hash exists on the ledger." });
                return;
            }
            
            if (d.verification.duplicate || d.verification.financed) {
                setResult({ kind: "financed", data: d });
                toast.error("Duplicate financing detected", { description: "This invoice is already financed on the ledger." });
            } else {
                setResult({ kind: "verified", data: d });
                toast.success("Invoice authenticated", { description: `Hash verified · Status: ${d.invoice.status || 'Unknown'}` });
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Verification failed";
            if (msg.includes("404") || msg.toLowerCase().includes("not found")) {
                setResult({ kind: "not_found" });
                toast.warning("Hash not found", { description: "No invoice with this ID or hash exists on the ledger." });
            } else {
                setResult({ kind: "error", message: msg });
                toast.error("Verification failed", { description: msg });
            }
        } finally {
            setVerify(false);
        }
    };

    const handleVerify = async () => {
        const q = query.trim();
        if (!q) return;
        await handleVerifyFor(q);
    };

    const ui = result
        ? result.kind === "financed"
            ? { bg: "rgba(220,38,38,0.08)",  border: "rgba(220,38,38,0.28)",  Icon: ShieldX,     iconColor: "#dc2626", title: "Fraud Alert — Already Financed" }
            : result.kind === "verified"
            ? { bg: "rgba(5,150,105,0.08)",   border: "rgba(5,150,105,0.28)",   Icon: ShieldCheck, iconColor: "#059669", title: "Integrity Verified" }
            : result.kind === "not_found"
            ? { bg: "rgba(217,119,6,0.08)",   border: "rgba(217,119,6,0.25)",   Icon: ShieldAlert, iconColor: "#d97706", title: "Hash Not Found" }
            : { bg: "rgba(220,38,38,0.06)",   border: "rgba(220,38,38,0.18)",   Icon: ShieldAlert, iconColor: "#dc2626", title: "Error" }
        : null;

    return (
        <div className="mg-card rounded-2xl overflow-hidden h-full flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-mg-lavender/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #4a4e8f, #6b5ea0)", boxShadow: "0 0 8px rgba(74,78,143,0.22)" }}>
                    <Cpu className="w-4 h-4 text-white" />
                </div>
                <div>
                    <p className="font-semibold text-mg-silver text-sm">Ledger Oracle</p>
                    <p className="text-[10px] text-mg-dim">Verify invoice via ID, hash, or IPFS CID lookup</p>
                </div>
            </div>

            <div className="p-5 flex-1 flex flex-col gap-4">
                {/* Input */}
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mg-dim pointer-events-none" />
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleVerify()}
                        placeholder="Invoice ID, SHA-256 hash, or IPFS CID…"
                        className="mg-input pl-10 pr-10 font-mono text-sm"
                    />
                    {query && (
                        <button onClick={() => { setQuery(""); setResult(null); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-mg-elevated transition-colors">
                            <X className="w-3.5 h-3.5 text-mg-dim hover:text-mg-muted" />
                        </button>
                    )}
                </div>

                {/* Verify button */}
                <button
                    onClick={handleVerify}
                    disabled={isVerifying || !query.trim()}
                    className={cn(
                        "w-full py-2.5 rounded-lg text-sm font-semibold transition-all",
                        isVerifying || !query.trim()
                            ? "bg-mg-elevated text-mg-dim cursor-not-allowed"
                            : "mg-btn-primary justify-center"
                    )}
                >
                    {isVerifying ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="w-3.5 h-3.5 rounded-full border border-mg-dim border-t-mg-lavender animate-spin" />
                            Querying ledger…
                        </span>
                    ) : "Authenticate Hash"}
                </button>

                {/* Result card */}
                <AnimatePresence>
                    {result && ui && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            className="rounded-xl overflow-hidden"
                            style={{ border: `1px solid ${ui.border}` }}
                        >
                            {/* Status banner */}
                            <div className="flex items-center gap-2.5 px-4 py-3"
                                style={{ background: ui.bg }}>
                                <ui.Icon className="w-4 h-4 shrink-0" style={{ color: ui.iconColor }} />
                                <p className="text-sm font-semibold" style={{ color: ui.iconColor }}>
                                    {ui.title}
                                </p>
                            </div>

                            {/* Not-found / error body */}
                            {(result.kind === "not_found" || result.kind === "error") && (
                                <div className="px-4 py-3 bg-mg-elevated/40">
                                    <p className="text-xs text-mg-muted">
                                        {result.kind === "not_found"
                                            ? "No invoice with this ID or hash exists in the FInovaX ledger. Check the source document."
                                            : result.message}
                                    </p>
                                </div>
                            )}

                            {/* Invoice detail rows */}
                            {result.data && (
                                <div className="px-4 py-3 space-y-2.5 bg-mg-elevated/30">
                                    {[
                                        {
                                            icon: BadgeCheck,
                                            label: "Invoice ID",
                                            value: result.data.invoice.invoiceId,
                                            mono: true,
                                        },
                                        {
                                            icon: DollarSign,
                                            label: "Amount",
                                            value: `${result.data.invoice.currency} ${formatCurrency(result.data.invoice.amount)}`,
                                            mono: false,
                                        },
                                        ...(result.data.invoice.uploadedBy ? [{
                                            icon: User,
                                            label: "Uploaded By",
                                            value: `${result.data.invoice.uploadedBy.name} · ${result.data.invoice.uploadedBy.organization}`,
                                            mono: false,
                                        }] : []),
                                        ...(result.data.invoice.financedBy ? [{
                                            icon: Building2,
                                            label: "Financed By",
                                            value: `${result.data.invoice.financedBy.name} · ${result.data.invoice.financedBy.organization}`,
                                            mono: false,
                                        }] : []),
                                        ...(result.data.invoice.financedAt ? [{
                                            icon: BadgeCheck,
                                            label: "Financed At",
                                            value: formatDate(result.data.invoice.financedAt),
                                            mono: false,
                                        }] : []),
                                    ].map(row => (
                                        <div key={row.label} className="flex items-start gap-2.5 text-xs">
                                            <row.icon className="w-3.5 h-3.5 text-mg-dim shrink-0 mt-0.5" />
                                            <span className="text-mg-dim w-20 shrink-0">{row.label}</span>
                                            <span className={cn("text-mg-silver break-all", row.mono && "font-mono text-[10px]")}>
                                                {row.value}
                                            </span>
                                        </div>
                                    ))}

                                    {/* Hash */}
                                    <div className="mt-1 pt-2.5 border-t border-mg-lavender/10 flex items-start gap-2.5 text-xs">
                                        <Hash className="w-3.5 h-3.5 text-mg-dim shrink-0 mt-0.5" />
                                        <span className="text-mg-dim w-20 shrink-0">SHA-256</span>
                                        <span className="font-mono text-[10px] text-mg-lavender/80 break-all">
                                            {result.data.invoice.invoiceHash}
                                        </span>
                                    </div>

                                    {/* On-chain badge */}
                                    <div className="flex items-center gap-1.5 pt-1">
                                        <span
                                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                            style={result.data.verification.registeredOnChain
                                                ? { background: "rgba(5,150,105,0.12)", color: "#059669", border: "1px solid rgba(5,150,105,0.25)" }
                                                : { background: "rgba(217,119,6,0.10)", color: "#d97706", border: "1px solid rgba(217,119,6,0.22)" }
                                            }>
                                            {result.data.verification.registeredOnChain ? "✓ On-chain registered" : "⚠ Not yet on-chain"}
                                        </span>
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                            style={{ background: "rgba(74,78,143,0.10)", color: "#8b8fc8", border: "1px solid rgba(74,78,143,0.22)" }}>
                                            Status: {result.data.invoice.status}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Hint */}
                {!result && !isVerifying && (
                    <div className="mt-auto flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-mg-elevated border border-mg-lavender/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-mg-lavender animate-pulse shrink-0" />
                        <span className="text-[10px] text-mg-dim font-mono">Accepts Invoice ID, SHA-256 hash, or IPFS CID · queries ledger state</span>
                    </div>
                )}
            </div>
        </div>
    );
};
