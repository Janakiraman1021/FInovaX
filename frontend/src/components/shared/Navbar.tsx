"use client";

import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Wallet, Shield, LogOut, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

const roleConfig: Record<string, { label: string; dot: string; accent: string }> = {
    msme:    { label: "MSME Portal",         dot: "bg-mg-lavender",       accent: "text-mg-lavender" },
    lender:  { label: "Lender Console",      dot: "bg-status-success",    accent: "text-status-success" },
    auditor: { label: "Regulator Dashboard", dot: "bg-violet-400",        accent: "text-violet-400" },
};

export const Navbar = () => {
    const { role, logout } = useAuth();
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
                    style={{ background: "linear-gradient(135deg, #4a4e8f 0%, #6b5ea0 100%)", boxShadow: "0 0 12px rgba(74,78,143,0.22)" }}>
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
                    <div className="w-2 h-2 rounded-full bg-status-success shadow-[0_0_6px_rgba(5,150,105,0.5)] animate-pulse" />
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
