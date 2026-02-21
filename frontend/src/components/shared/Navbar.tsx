"use client";

import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Shield, LogOut, Menu } from "lucide-react";
import { motion } from "framer-motion";

const roleConfig: Record<string, { label: string; dot: string; accent: string }> = {
    msme:    { label: "MSME Portal",         dot: "bg-mg-lavender",       accent: "text-mg-lavender" },
    lender:  { label: "Lender Console",      dot: "bg-status-success",    accent: "text-status-success" },
    auditor: { label: "Regulator Dashboard", dot: "bg-violet-400",        accent: "text-violet-400" },
};

export const Navbar = ({ onToggleSidebar }: { onToggleSidebar?: () => void }) => {
    const { role, logout } = useAuth();
    const cfg = role ? roleConfig[role] : null;

    return (
        <motion.nav
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mg-navbar h-16 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-50"
        >
            {/* ── Left: hamburger + Logo ── */}
            <div className="flex items-center gap-2 sm:gap-3">
                {/* Hamburger — mobile only */}
                <button
                    onClick={onToggleSidebar}
                    className="lg:hidden p-2 rounded-lg text-mg-dim hover:text-mg-silver hover:bg-mg-card border border-transparent hover:border-mg-lavender/15 transition-all duration-150"
                    aria-label="Toggle sidebar"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg, #4a4e8f 0%, #6b5ea0 100%)", boxShadow: "0 0 12px rgba(74,78,143,0.22)" }}>
                    <Shield className="w-4 h-4 text-white" />
                </div>
                <div className="flex items-center gap-2.5">
                    <span className="text-base font-bold tracking-tight text-mg-silver">
                        One<span className="text-mg-lavender">Flow</span>
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

                {/* Logout */}
                {/* <button
                    onClick={logout}
                    className="ml-1 p-2 rounded-lg text-mg-dim hover:text-mg-silver hover:bg-mg-card border border-transparent hover:border-mg-lavender/15 transition-all duration-150"
                    title="Sign out"
                >
                    <LogOut className="w-4 h-4" />
                </button> */}
            </div>
        </motion.nav>
    );
};
