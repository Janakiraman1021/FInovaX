"use client";

import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/mock/mockUsers";
import { Shield, Banknote, Landmark, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function LoginPage() {
    const { login } = useAuth();
    const [connecting, setConnecting] = useState<UserRole | null>(null);

    const handleLogin = (role: UserRole) => {
        setConnecting(role);
        setTimeout(() => { login(role); }, 1600);
    };

    const roles = [
        {
            id: "msme",
            title: "MSME Portal",
            desc: "Upload and verify invoices for quantum-speed financing",
            icon: Banknote,
            gradFrom: "#7c3aed",
            gradTo:   "#06b6d4",
            borderHover: "hover:border-galaxy-lavender/50",
            glowClass: "glow-purple",
            label: "MSME",
        },
        {
            id: "lender",
            title: "Lender Console",
            desc: "Verify cryptographic hash integrity and disburse capital",
            icon: Landmark,
            gradFrom: "#10b981",
            gradTo:   "#06b6d4",
            borderHover: "hover:border-emerald-500/50",
            glowClass: "glow-cyan",
            label: "LENDER",
        },
        {
            id: "auditor",
            title: "Regulator View",
            desc: "Real-time nebula surveillance of ecosystem health",
            icon: Eye,
            gradFrom: "#ec4899",
            gradTo:   "#a78bfa",
            borderHover: "hover:border-galaxy-pink/50",
            glowClass: "glow-pink",
            label: "AUDITOR",
        },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
            {/* Nebula blobs */}
            <div className="absolute top-1/4 left-1/5 w-96 h-96 rounded-full blur-[140px] animate-pulse pointer-events-none" style={{ background: "rgba(124,58,237,0.18)" }} />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[140px] animate-pulse pointer-events-none" style={{ animation: "pulse 3s ease-in-out infinite", animationDelay: "1s", background: "rgba(236,72,153,0.12)" }} />
            <div className="absolute top-1/2 right-0 w-72 h-72 rounded-full blur-[100px] pointer-events-none" style={{ background: "rgba(6,182,212,0.08)" }} />

            {/* Hex grid bg */}
            <div className="absolute inset-0 pointer-events-none opacity-5">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="hex-login" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
                            <polygon points="30,2 56,16 56,36 30,50 4,36 4,16" fill="none" stroke="rgba(167,139,250,0.8)" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#hex-login)" />
                </svg>
            </div>

            <div className="max-w-5xl w-full z-10">
                {/* Header */}
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="relative inline-flex items-center justify-center w-24 h-24 mb-10"
                    >
                        {/* Orbit rings */}
                        <div className="absolute w-24 h-24 rounded-full border border-galaxy-lavender/25 orbit-ring" />
                        <div className="absolute w-16 h-16 rounded-full border border-galaxy-pink/20" style={{ animation: "orbitSpin 5s linear infinite reverse" }} />
                        {/* Core */}
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-galaxy-purple to-galaxy-pink flex items-center justify-center glow-purple rotate-12">
                            <Shield className="text-white w-7 h-7" />
                        </div>
                    </motion.div>

                    <motion.h1
                        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                        className="text-7xl font-black text-galaxy-gradient tracking-tighter mb-3"
                    >
                        FINOVAX
                    </motion.h1>

                    <motion.p
                        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                        className="text-white/40 text-lg font-medium tracking-tight"
                    >
                        Midnight Galaxy — Hybrid Audit Architecture
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                        className="stat-pill mx-auto mt-5"
                    >
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        All Systems Operational
                    </motion.div>
                </div>

                {/* Role Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {roles.map((role, i) => (
                        <motion.button
                            key={role.id}
                            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.45 + i * 0.12 }}
                            onClick={() => handleLogin(role.id as UserRole)}
                            disabled={!!connecting}
                            className={cn(
                                "group relative p-8 rounded-[32px] glass-dark text-left transition-all duration-500 border",
                                "border-galaxy-lavender/15",
                                role.borderHover,
                                "hover:scale-[1.03] hover:shadow-galaxy-md",
                                connecting === role.id && "scale-[1.03]"
                            )}
                        >
                            {/* Background glow on hover */}
                            <div className="absolute inset-0 rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                style={{ background: `radial-gradient(ellipse at top left, ${role.gradFrom}18 0%, transparent 60%)` }} />

                            {/* Connecting overlay */}
                            {connecting === role.id && (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="absolute inset-0 rounded-[32px] flex items-center justify-center z-20"
                                    style={{ background: "rgba(5,4,20,0.85)", backdropFilter: "blur(8px)" }}
                                >
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="relative w-12 h-12">
                                            <div className="absolute inset-0 rounded-full border-2 border-galaxy-lavender/20" />
                                            <div className="absolute inset-0 rounded-full border-2 border-t-galaxy-lavender border-transparent animate-spin" />
                                        </div>
                                        <span className="text-galaxy-lavender text-xs font-bold uppercase tracking-widest">Authenticating...</span>
                                    </div>
                                </motion.div>
                            )}

                            {/* Icon */}
                            <div
                                className={cn("w-16 h-16 rounded-2xl mb-8 flex items-center justify-center transition-all duration-300 group-hover:scale-110", role.glowClass)}
                                style={{ background: `linear-gradient(135deg, ${role.gradFrom}, ${role.gradTo})` }}
                            >
                                <role.icon className="text-white w-8 h-8" />
                            </div>

                            {/* Label pill */}
                            <div className="stat-pill mb-4" style={{ color: role.gradFrom, borderColor: `${role.gradFrom}40`, background: `${role.gradFrom}15` }}>
                                {role.label}
                            </div>

                            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{role.title}</h3>
                            <p className="text-white/40 text-sm leading-relaxed">{role.desc}</p>

                            {/* Bottom glow line */}
                            <div className="mt-8 h-px rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                style={{ background: `linear-gradient(90deg, ${role.gradFrom}, ${role.gradTo}, transparent)` }} />
                        </motion.button>
                    ))}
                </div>

                {/* Footer note */}
                <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
                    className="text-center text-white/20 text-xs font-bold uppercase tracking-[0.2em] mt-12"
                >
                    Demo Mode — Select any role to enter the terminal
                </motion.p>
            </div>
        </div>
    );
}
