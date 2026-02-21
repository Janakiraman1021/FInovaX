"use client";

import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
    FileUp, History, Search, Layers,
    BarChart3, Activity, LayoutDashboard, Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const roleAccent: Record<string, { active: string; icon: string; dot: string; tag: string }> = {
    msme:    { active: "bg-mg-cosmic/20 text-mg-lavender border-mg-lavender/30",   icon: "text-mg-lavender", dot: "bg-mg-lavender",    tag: "MSME"     },
    lender:  { active: "bg-status-success/10 text-status-success border-status-success/30", icon: "text-status-success", dot: "bg-status-success", tag: "LENDER"   },
    auditor: { active: "bg-violet-500/10 text-violet-300 border-violet-400/30",    icon: "text-violet-300",  dot: "bg-violet-400",     tag: "AUDITOR"  },
};

const menuItems = {
    msme: [
        { label: "Overview",       icon: LayoutDashboard, href: "/msme"         },
        { label: "Upload Invoice", icon: FileUp,          href: "/msme/upload"  },
        { label: "History",        icon: History,         href: "/msme/history" },
    ],
    lender: [
        { label: "Overview",      icon: LayoutDashboard, href: "/lender"        },
        { label: "Verify Hash",   icon: Search,          href: "/lender/verify" },
        { label: "Active Loans",  icon: Layers,          href: "/lender/loans"  },
    ],
    auditor: [
        { label: "Analytics",  icon: BarChart3, href: "/auditor"       },
        { label: "Audit Logs", icon: Activity,  href: "/auditor/logs"  },
    ],
};

export const Sidebar = () => {
    const { role } = useAuth();
    const pathname  = usePathname();
    const items     = role ? menuItems[role as keyof typeof menuItems] ?? [] : [];
    const accent    = role ? roleAccent[role as keyof typeof roleAccent] : roleAccent.msme;

    return (
        <motion.aside
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="mg-sidebar w-60 flex flex-col h-[calc(100vh-64px)] overflow-y-auto shrink-0"
        >
            {/* ── Navigation ── */}
            <nav className="flex-1 py-6 px-3 space-y-0.5">
                <p className="mg-label px-3 mb-3">Navigation</p>
                {items.map((item, i) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                        <motion.div
                            key={item.label}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.05 + i * 0.06, ease: "easeOut" }}
                        >
                            <Link
                                href={item.href}
                                className={cn(
                                    "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group border",
                                    isActive
                                        ? cn("border", accent.active)
                                        : "border-transparent text-mg-muted hover:text-mg-silver hover:bg-mg-card/60 hover:border-mg-lavender/10"
                                )}
                            >
                                {/* Active left indicator */}
                                {isActive && (
                                    <span className={cn("absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full", accent.dot)} />
                                )}
                                <item.icon className={cn(
                                    "w-4 h-4 shrink-0 transition-colors",
                                    isActive ? accent.icon : "text-mg-dim group-hover:text-mg-muted"
                                )} />
                                <span className="truncate">{item.label}</span>
                                {isActive && (
                                    <span className={cn("ml-auto w-1.5 h-1.5 rounded-full", accent.dot)} />
                                )}
                            </Link>
                        </motion.div>
                    );
                })}
            </nav>

            {/* ── Divider ── */}
            <div className="mx-3 mg-divider" />

            {/* ── Bottom section ── */}
            <div className="p-3 pb-5 space-y-0.5">
                <p className="mg-label px-3 mb-3">Settings</p>
                <Link
                    href="/settings"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-mg-muted hover:text-mg-silver hover:bg-mg-card/60 border border-transparent hover:border-mg-lavender/10 transition-all duration-150"
                >
                    <Settings className="w-4 h-4 text-mg-dim" />
                    <span>Preferences</span>
                </Link>

                {/* Role badge */}
                <div className="mt-3 mx-1 px-3 py-2.5 rounded-lg bg-mg-card border border-mg-lavender/12">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full animate-pulse", accent.dot)} />
                            <span className="text-xs font-semibold text-mg-muted">{role?.toUpperCase()}</span>
                        </div>
                        <span className={cn("text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full", accent.active)}>
                            {accent.tag}
                        </span>
                    </div>
                </div>
            </div>
        </motion.aside>
    );
};
