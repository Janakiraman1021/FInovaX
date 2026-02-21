"use client";

import { useState } from "react";
import { Search, ShieldCheck, ShieldAlert, Cpu, ScanLine } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const HashVerifier = () => {
    const [hash, setHash]         = useState("");
    const [isVerifying, setVerify] = useState(false);
    const [result, setResult]     = useState<any>(null);

    const handleVerify = async () => {
        if (!hash) return;
        setVerify(true);
        setResult(null);
        try {
            const data = await api.invoices.verify(hash);
            setResult(data);
            if (data.exists && data.financedBy) {
                toast.error("DUPLICATE FINANCING DETECTED", { description: "This hash is already registered on the ledger." });
            } else if (data.exists) {
                toast.success("INVOICE AUTHENTICATED", { description: "Hash match found. Security check passed." });
            } else {
                toast.warning("HASH NOT FOUND", { description: "This invoice has not been broadcast to the network." });
            }
        } catch {
            toast.error("Verification failed");
        } finally {
            setVerify(false);
        }
    };

    const resultVariant = result
        ? result.exists && result.financedBy
            ? { bg: "bg-red-500/08",     border: "border-red-500/30",     icon: ShieldAlert, iconColor: "text-red-400",      glow: "shadow-[0_0_20px_rgba(239,68,68,0.30)]",       title: "Fraud Alert",        body: `Double financing detected. Previously funded by: ${result.financedBy}. Transaction blocked.` }
            : result.exists
            ? { bg: "bg-emerald-500/08", border: "border-emerald-500/30", icon: ShieldCheck, iconColor: "text-emerald-400",  glow: "shadow-[0_0_20px_rgba(16,185,129,0.30)]",     title: "Integrity Verified", body: "Invoice successfully matched against the distributed ledger. No prior financing records detected." }
            : { bg: "bg-amber-500/08",   border: "border-amber-500/30",   icon: ShieldAlert, iconColor: "text-amber-400",    glow: "shadow-[0_0_20px_rgba(245,158,11,0.30)]",     title: "Hash Not Found",     body: "This hash does not exist in the FINOVAX audit trail. Verify the source document." }
        : null;

    return (
        <div className="galaxy-card rounded-3xl p-8 shadow-galaxy-md h-full relative overflow-hidden">
            {/* Glow */}
            <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full blur-[60px] opacity-25 pointer-events-none" style={{ background: "#06b6d4" }} />

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-galaxy-cyan to-galaxy-purple flex items-center justify-center glow-cyan">
                    <Cpu className="text-white w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Ledger Oracle</h2>
                    <p className="text-white/35 text-xs font-medium">Verify invoice integrity via hash lookup</p>
                </div>
            </div>

            {/* Input */}
            <div className="relative mb-6">
                <input
                    type="text"
                    value={hash}
                    onChange={e => setHash(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleVerify()}
                    placeholder="Paste SHA-256 Invoice Hash..."
                    className="w-full bg-galaxy-void/80 border border-galaxy-lavender/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/18 focus:outline-none focus:ring-2 focus:ring-galaxy-lavender/40 transition-all font-mono text-sm focus:border-galaxy-lavender/50"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 w-5 h-5" />
                {hash && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-galaxy-lavender/20 flex items-center justify-center cursor-pointer hover:bg-galaxy-lavender/40 transition-all"
                        onClick={() => setHash("")}
                    >
                        <span className="text-galaxy-lavender text-xs">?</span>
                    </motion.div>
                )}
            </div>

            {/* Verify btn */}
            <button
                onClick={handleVerify}
                disabled={isVerifying || !hash}
                className={cn(
                    "w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all mb-8 relative overflow-hidden",
                    isVerifying || !hash
                        ? "bg-white/5 text-white/25 cursor-not-allowed"
                        : "bg-gradient-to-r from-galaxy-cyan to-galaxy-purple text-white glow-cyan hover:shadow-galaxy-md hover:scale-[1.01]"
                )}
            >
                {isVerifying ? (
                    <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                        Analyzing Ledger Architecture...
                    </span>
                ) : "Authenticate Hash"}
            </button>

            {/* Result */}
            <AnimatePresence>
                {resultVariant && (
                    <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8 }}
                        className={cn("p-6 rounded-2xl border flex items-start gap-4", resultVariant.bg, resultVariant.border, resultVariant.glow)}
                    >
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", resultVariant.bg, resultVariant.border)}>
                            <resultVariant.icon className={cn("w-5 h-5", resultVariant.iconColor)} />
                        </div>
                        <div>
                            <p className={cn("font-bold text-sm uppercase tracking-tight mb-1.5", resultVariant.iconColor)}>{resultVariant.title}</p>
                            <p className="text-xs text-white/55 leading-relaxed">{resultVariant.body}</p>
                            {result?.txHash && (
                                <p className="mt-3 text-[10px] font-mono bg-galaxy-void/60 p-2.5 rounded-xl border border-galaxy-lavender/15 break-all text-galaxy-lavender/80">
                                    TX: {result.txHash}
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
