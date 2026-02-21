"use client";

import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Wallet, Shield, LogOut, ChevronDown } from "lucide-react";
import { UserRole } from "@/lib/mock/mockUsers";
import { motion } from "framer-motion";

const roleConfig: Record<string, { label: string; dot: string; accent: string }> = {
    msme:    { label: "MSME Portal",         dot: "bg-mg-lavender",       accent: "text-mg-lavender" },
    lender:  { label: "Lender Console",      dot: "bg-status-success",    accent: "text-status-success" },
    auditor: { label: "Regulator Dashboard", dot: "bg-violet-400",        accent: "text-violet-400" },
};

export const Navbar = () => {
    const { role, logout, switchRole, isDemoMode } = useAuth();
    const cfg = role ? roleConfig[role] : null;
    const walletAddress = "0x71C7...f6D2";

    return (
        <motion.nav
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mg-navbar h-16 px-6 flex items-center justify-between sticky top-0 z-50"
        >
            {/* ── Logo ── */}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #4a4e8f 0%, #a490c2 100%)", boxShadow: "0 0 16px rgba(74,78,143,0.40)" }}>
                    <Shield className="w-4 h-4 text-white" />
                </div>
                <div className="flex items-center gap-2.5">
                    <span className="text-base font-bold tracking-tight text-mg-silver">
                        Fino<span className="text-mg-lavender">vaX</span>
                    </span>
                    {cfg && (
                        <span className={cn(
                            "hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider",
                            "bg-mg-card border border-mg-lavender/20",
                            cfg.accent
                        )}>
                            <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", cfg.dot)} />
                            {cfg.label}
                        </span>
                    )}
                </div>
            </div>

            {/* ── Right controls ── */}
            <div className="flex items-center gap-2">

                {/* Demo role switcher */}
                {isDemoMode && (
                    <div className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-mg-card border border-mg-lavender/15">
                        <span className="text-[9px] text-mg-dim uppercase font-bold tracking-widest mr-1">Role:</span>
                        {(["msme", "lender", "auditor"] as UserRole[]).map((r) => (
                            <button
                                key={r}
                                onClick={() => switchRole(r)}
                                className={cn(
                                    "px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide transition-all duration-150",
                                    role === r
                                        ? "bg-mg-cosmic/40 text-mg-lavender border border-mg-lavender/30"
                                        : "text-mg-dim hover:text-mg-silver hover:bg-mg-elevated/50"
                                )}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                )}

                {/* Divider */}
                <div className="w-px h-6 bg-mg-lavender/10 mx-1" />

                {/* Wallet info */}
                <div className="flex items-center gap-2">
                    <div className="hidden sm:flex flex-col items-end leading-none gap-0.5">
                        <div className="flex items-center gap-1.5">
                            <Wallet className="w-3 h-3 text-mg-cosmic" />
                            <span className="text-[11px] font-mono text-mg-muted">{walletAddress}</span>
                        </div>
                        <span className="text-[9px] uppercase tracking-wider font-semibold text-mg-lavender/50">Polygon zkEVM</span>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-status-success shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
                </div>

                {/* Logout */}
                <button
                    onClick={logout}
                    className="ml-1 p-2 rounded-lg text-mg-dim hover:text-mg-silver hover:bg-mg-card border border-transparent hover:border-mg-lavender/15 transition-all duration-150"
                    title="Sign out"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </div>
        </motion.nav>
    );
};
