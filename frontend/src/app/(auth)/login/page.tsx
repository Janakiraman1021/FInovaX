"use client";

import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/mock/mockUsers";
import { Shield, Banknote, Landmark, Eye, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";

const roles = [
    {
        id: "msme" as UserRole,
        title: "MSME Portal",
        desc: "Upload, verify and finance your trade receivables on-chain.",
        icon: Banknote,
        accentFrom: "#4a4e8f",
        accentTo:   "#a490c2",
        border:  "hover:border-mg-lavender/40",
        textActive: "text-mg-lavender",
        bgActive:   "rgba(74,78,143,0.15)",
    },
    {
        id: "lender" as UserRole,
        title: "Lender Console",
        desc: "Verify hash integrity and disburse capital to vetted MSMEs.",
        icon: Landmark,
        accentFrom: "#10b981",
        accentTo:   "#34d399",
        border:  "hover:border-status-success/40",
        textActive: "text-status-success",
        bgActive:   "rgba(52,211,153,0.10)",
    },
    {
        id: "auditor" as UserRole,
        title: "Regulator View",
        desc: "Real-time surveillance and audit trail of the full ecosystem.",
        icon: Eye,
        accentFrom: "#7c3aed",
        accentTo:   "#a490c2",
        border:  "hover:border-violet-400/40",
        textActive: "text-violet-300",
        bgActive:   "rgba(124,58,237,0.12)",
    },
];

export default function LoginPage() {
    const { login } = useAuth();
    const [connecting, setConnecting] = useState<UserRole | null>(null);
    const [selected, setSelected]     = useState<UserRole | null>(null);

    const handleLogin = (role: UserRole) => {
        setSelected(role);
        setConnecting(role);
        setTimeout(() => login(role), 1400);
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden"
            style={{ background: "var(--mg-base)" }}>

            {/* Ambient glows */}
            <div className="pointer-events-none absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full blur-[130px] opacity-20"
                style={{ background: "radial-gradient(ellipse, rgba(74,78,143,0.60) 0%, transparent 70%)" }} />
            <div className="pointer-events-none absolute bottom-1/3 right-1/4 w-[300px] h-[300px] rounded-full blur-[100px] opacity-15"
                style={{ background: "radial-gradient(ellipse, rgba(164,144,194,0.40) 0%, transparent 70%)" }} />

            <div className="relative z-10 w-full max-w-4xl">

                {/* ── Header ── */}
                <div className="text-center mb-14">
                    <motion.div
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 220, damping: 22 }}
                        className="inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-6"
                        style={{
                            background: "linear-gradient(135deg, #4a4e8f 0%, #a490c2 100%)",
                            boxShadow: "0 0 32px rgba(74,78,143,0.45), 0 0 8px rgba(164,144,194,0.20)"
                        }}
                    >
                        <Shield className="w-8 h-8 text-white" />
                    </motion.div>

                    <motion.h1
                        initial={{ y: 16, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.15 }}
                        className="text-5xl font-bold tracking-tight mb-3 mg-gradient-text">
                        FInovaX
                    </motion.h1>

                    <motion.p
                        initial={{ y: 12, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.22 }}
                        className="text-mg-muted text-base mb-5">
                        Midnight Galaxy · Hybrid Blockchain Audit Architecture
                    </motion.p>

                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.35 }}
                        className="mg-pill"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
                        All Systems Operational
                    </motion.span>
                </div>

                {/* ── Role selection title ── */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-center mg-label mb-6"
                >
                    Select your access role to continue
                </motion.p>

                {/* ── Role cards ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {roles.map((r, i) => {
                        const isConnecting = connecting === r.id;
                        const isSelected   = selected === r.id;
                        return (
                            <motion.button
                                key={r.id}
                                initial={{ y: 24, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.40 + i * 0.10 }}
                                onClick={() => !connecting && handleLogin(r.id)}
                                disabled={!!connecting}
                                className={cn(
                                    "group relative text-left rounded-2xl p-6 border transition-all duration-200",
                                    "bg-mg-card",
                                    isSelected
                                        ? "border-mg-lavender/35 shadow-mg-md"
                                        : cn("border-mg-lavender/12", r.border),
                                    !connecting && "hover:-translate-y-0.5 hover:shadow-mg-md cursor-pointer",
                                    connecting && !isSelected && "opacity-40 cursor-not-allowed",
                                )}
                                style={isSelected ? { background: r.bgActive } : undefined}
                            >
                                {/* Top gradient bar */}
                                <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl"
                                    style={{ background: `linear-gradient(90deg, transparent, ${r.accentFrom}60, ${r.accentTo}50, transparent)` }} />

                                {/* Icon */}
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                                    style={{
                                        background: `linear-gradient(135deg, ${r.accentFrom}30, ${r.accentTo}20)`,
                                        border: `1px solid ${r.accentFrom}35`,
                                    }}>
                                    {isConnecting ? (
                                        <div className="w-5 h-5 rounded-full border-2 border-mg-dim border-t-mg-lavender animate-spin" />
                                    ) : (
                                        <r.icon className={cn("w-5 h-5", r.textActive)} />
                                    )}
                                </div>

                                <h3 className={cn("font-semibold text-base mb-1.5", isSelected ? r.textActive : "text-mg-silver")}>
                                    {r.title}
                                </h3>
                                <p className="text-sm text-mg-muted leading-relaxed mb-5">{r.desc}</p>

                                <div className={cn(
                                    "flex items-center gap-1.5 text-xs font-semibold transition-colors",
                                    isSelected ? r.textActive : "text-mg-dim group-hover:text-mg-muted"
                                )}>
                                    {isConnecting ? "Authenticating..." : "Enter Portal"}
                                    {!isConnecting && <ArrowRight className="w-3.5 h-3.5" />}
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

                {/* ── Footer note ── */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-center text-xs text-mg-dim mt-10">
                    Demo environment · No credentials required · Polygon zkEVM Testnet
                </motion.p>
            </div>
        </div>
    );
}
