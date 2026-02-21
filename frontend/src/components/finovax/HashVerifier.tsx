"use client";

import { useState } from "react";
import { Search, ShieldCheck, ShieldAlert, Cpu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const HashVerifier = () => {
    const [hash, setHash]          = useState("");
    const [isVerifying, setVerify] = useState(false);
    const [result, setResult]      = useState<any>(null);

    const handleVerify = async () => {
        if (!hash.trim()) return;
        setVerify(true);
        setResult(null);
        try {
            const data = await api.invoices.verify(hash);
            setResult(data);
            if (data.exists && data.financedBy) {
                toast.error("Duplicate financing detected", { description: "This hash is already registered on the ledger." });
            } else if (data.exists) {
                toast.success("Invoice authenticated", { description: "Hash match found. Security check passed." });
            } else {
                toast.warning("Hash not found", { description: "This invoice has not been broadcast to the network." });
            }
        } catch {
            toast.error("Verification failed");
        } finally {
            setVerify(false);
        }
    };

    const rv = result
        ? result.exists && result.financedBy
            ? { bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.28)", icon: ShieldAlert, iconColor: "#f87171", title: "Fraud Alert",        body: `Double financing detected. Previously funded by: ${result.financedBy}.` }
            : result.exists
            ? { bg: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.28)",  icon: ShieldCheck, iconColor: "#34d399", title: "Integrity Verified", body: "Invoice matched against the distributed ledger. No prior financing records found." }
            : { bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.25)",  icon: ShieldAlert, iconColor: "#fbbf24", title: "Hash Not Found",     body: "This hash does not exist in the FInovaX audit trail. Verify the source document." }
        : null;

    return (
        <div className="mg-card rounded-2xl overflow-hidden h-full flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-mg-lavender/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #4a4e8f, #a490c2)", boxShadow: "0 0 10px rgba(74,78,143,0.35)" }}>
                    <Cpu className="w-4 h-4 text-white" />
                </div>
                <div>
                    <p className="font-semibold text-mg-silver text-sm">Ledger Oracle</p>
                    <p className="text-[10px] text-mg-dim">Verify invoice integrity via hash lookup</p>
                </div>
            </div>

            <div className="p-5 flex-1 flex flex-col gap-4">
                {/* Input */}
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mg-dim pointer-events-none" />
                    <input
                        type="text"
                        value={hash}
                        onChange={e => setHash(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleVerify()}
                        placeholder="Paste SHA-256 invoice hash…"
                        className="mg-input pl-10 pr-10 font-mono text-sm"
                    />
                    {hash && (
                        <button onClick={() => { setHash(""); setResult(null); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-mg-elevated transition-colors">
                            <X className="w-3.5 h-3.5 text-mg-dim hover:text-mg-muted" />
                        </button>
                    )}
                </div>

                {/* Verify button */}
                <button
                    onClick={handleVerify}
                    disabled={isVerifying || !hash.trim()}
                    className={cn(
                        "w-full py-2.5 rounded-lg text-sm font-semibold transition-all",
                        isVerifying || !hash.trim()
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

                {/* Result */}
                <AnimatePresence>
                    {rv && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            className="p-4 rounded-xl flex items-start gap-3"
                            style={{ background: rv.bg, border: `1px solid ${rv.border}` }}
                        >
                            <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
                                style={{ background: rv.bg, border: `1px solid ${rv.border}` }}>
                                <rv.icon className="w-4 h-4" style={{ color: rv.iconColor }} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold mb-1" style={{ color: rv.iconColor }}>{rv.title}</p>
                                <p className="text-xs text-mg-muted leading-relaxed">{rv.body}</p>
                                {result?.txHash && (
                                    <p className="mt-2.5 text-[10px] font-mono text-mg-lavender/80 bg-mg-elevated px-2.5 py-1.5 rounded-lg border border-mg-lavender/12 break-all">
                                        TX: {result.txHash}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Hint */}
                {!result && !isVerifying && (
                    <div className="mt-auto flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-mg-elevated border border-mg-lavender/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-mg-lavender animate-pulse shrink-0" />
                        <span className="text-[10px] text-mg-dim font-mono">Hash queries run against the Polygon zkEVM state</span>
                    </div>
                )}
            </div>
        </div>
    );
};
