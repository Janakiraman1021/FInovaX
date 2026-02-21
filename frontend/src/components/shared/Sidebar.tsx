"use client";

import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
    FileUp,
    History,
    Search,
    Layers,
    BarChart3,
    Activity,
    Settings,
    LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const roleColors = {
    msme:    { active: "text-galaxy-lavender border-galaxy-lavender/30 bg-galaxy-purple/15 shadow-galaxy-sm", dot: "bg-galaxy-lavender" },
    lender:  { active: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]", dot: "bg-emerald-400" },
    auditor: { active: "text-galaxy-pink border-galaxy-pink/30 bg-galaxy-pink/10 shadow-pink-glow", dot: "bg-galaxy-pink" },
};

export const Sidebar = () => {
    const { role } = useAuth();
    const pathname = usePathname();

    const menuItems = {
        msme: [
            { label: "Dashboard",      icon: LayoutDashboard, href: "/msme"         },
            { label: "Upload Invoice", icon: FileUp,          href: "/msme/upload"  },
            { label: "History",        icon: History,         href: "/msme/history" },
        ],
        lender: [
            { label: "Overview",    icon: LayoutDashboard, href: "/lender"       },
            { label: "Verify Hash", icon: Search,          href: "/lender/verify"},
            { label: "Active Loans",icon: Layers,          href: "/lender/loans" },
        ],
        auditor: [
            { label: "Analytics",  icon: BarChart3, href: "/auditor"      },
            { label: "Audit Logs", icon: Activity,  href: "/auditor/logs" },
        ],
    };

    const currentItems = role ? menuItems[role as keyof typeof menuItems] : [];
    const colors = role ? roleColors[role as keyof typeof roleColors] : roleColors.msme;

    return (
        <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="w-64 border-r border-galaxy-lavender/08 glass-dark flex flex-col h-[calc(100vh-64px)] overflow-y-auto relative"
        >
            {/* Side gradient accent */}
            <div className="absolute top-0 bottom-0 right-0 w-px" style={{ background: "linear-gradient(180deg, transparent, rgba(167,139,250,0.25), rgba(236,72,153,0.15), transparent)" }} />

            {/* Nav items */}
            <div className="flex-1 py-8 px-4 space-y-1">
                {currentItems.map((item, i) => {
                    const isActive = pathname === item.href;
                    return (
                        <motion.div
                            key={item.label}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.07 }}
                        >
                            <Link
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group border",
                                    isActive
                                        ? cn("border", colors.active)
                                        : "border-transparent text-white/40 hover:text-white/75 hover:bg-galaxy-purple/08 hover:border-galaxy-lavender/12"
                                )}
                            >
                                {/* Active indicator dot */}
                                {isActive && (
                                    <div className={cn("absolute left-0 w-0.5 h-8 rounded-r-full", colors.dot)} style={{ marginLeft: "-1px" }} />
                                )}
                                <item.icon className={cn(
                                    "w-5 h-5 transition-all",
                                    isActive ? colors.active.split(" ")[0] : "text-white/25 group-hover:text-white/55"
                                )} />
                                <span className="font-semibold text-sm">{item.label}</span>
                                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "currentColor" }} />}
                            </Link>
                        </motion.div>
                    );
                })}
            </div>

            {/* Bottom section */}
            <div className="p-4 border-t border-galaxy-lavender/08">
                {/* Role indicator */}
                <div className="px-4 py-3 mb-2 rounded-xl glass border border-galaxy-lavender/10">
                    <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full animate-pulse", colors.dot)} />
                        <span className="text-[10px] text-white/35 uppercase font-bold tracking-widest">
                            {role?.toUpperCase()} MODE
                        </span>
                    </div>
                </div>
                <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/30 hover:text-white/60 hover:bg-galaxy-purple/08 hover:border-galaxy-lavender/12 border border-transparent w-full transition-all">
                    <Settings className="w-5 h-5" />
                    <span className="font-semibold text-sm">Settings</span>
                </button>
            </div>
        </motion.aside>
    );
};
