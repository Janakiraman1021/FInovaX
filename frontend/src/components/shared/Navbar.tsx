"use client";

import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Wallet, Shield, LogOut } from "lucide-react";
import { UserRole } from "@/lib/mock/mockUsers";
import { motion } from "framer-motion";

const roleConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
    msme:    { label: "MSME Portal",         color: "text-galaxy-lavender", bg: "bg-galaxy-purple/15",  border: "border-galaxy-lavender/30" },
    lender:  { label: "Lender Console",      color: "text-emerald-400",     bg: "bg-emerald-500/10",    border: "border-emerald-500/25"     },
    auditor: { label: "Regulator Dashboard", color: "text-galaxy-pink",     bg: "bg-galaxy-pink/10",    border: "border-galaxy-pink/25"     },
};

export const Navbar = () => {
    const { role, logout, switchRole, isDemoMode } = useAuth();
    const cfg = role ? roleConfig[role] : null;
    const walletAddress = "0x71C7...f6D2";

    return (
        <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="h-16 border-b border-galaxy-lavender/12 glass-dark px-6 flex items-center justify-between sticky top-0 z-50 relative overflow-hidden"
        >
            {/* Subtle scan line */}
            <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.4), rgba(236,72,153,0.3), transparent)" }} />

            {/* Logo */}
            <div className="flex items-center gap-3">
                <div className="relative">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-galaxy-purple to-galaxy-pink flex items-center justify-center glow-purple">
                        <Shield className="text-white w-4 h-4" />
                    </div>
                    <div className="absolute -inset-0.5 rounded-lg border border-galaxy-lavender/25 animate-pulse" />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-lg font-black tracking-tighter text-galaxy-gradient">FINOVAX</span>
                    {cfg && (
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border", cfg.bg, cfg.color, cfg.border)}>
                            {cfg.label}
                        </span>
                    )}
                </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-5">
                {/* Demo role switcher */}
                {isDemoMode && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-galaxy-lavender/15">
                        <span className="text-[9px] text-white/30 uppercase font-bold tracking-widest">Switch:</span>
                        <div className="flex gap-1">
                            {(["msme", "lender", "auditor"] as UserRole[]).map((r) => (
                                <button
                                    key={r}
                                    onClick={() => switchRole(r)}
                                    className={cn(
                                        "px-2 py-0.5 rounded text-[9px] uppercase font-bold transition-all",
                                        role === r
                                            ? "bg-galaxy-purple/60 text-galaxy-lavender border border-galaxy-lavender/30"
                                            : "text-white/30 hover:text-white/60 hover:bg-white/5"
                                    )}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Wallet */}
                <div className="flex items-center gap-3 pl-5 border-l border-galaxy-lavender/12">
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-white/60">
                            <Wallet className="w-3 h-3 text-galaxy-cyan" />
                            <span className="font-mono">{walletAddress}</span>
                        </div>
                        <span className="text-[9px] text-galaxy-cyan/60 uppercase tracking-widest font-bold">Polygon zkEVM</span>
                    </div>

                    {/* Online dot */}
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse" />

                    {/* Logout */}
                    <button
                        onClick={logout}
                        className="p-2 rounded-full hover:bg-galaxy-pink/10 border border-transparent hover:border-galaxy-pink/25 text-white/30 hover:text-galaxy-pink transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.nav>
    );
};
