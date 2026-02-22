"use client";

import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard, FileUp, FileText, History, User, CheckCircle,
    Clock, XCircle, AlertTriangle, Search, Layers, IndianRupee,
    FileSearch, Flag, CreditCard, Activity, Shield, ShieldCheck,
    BarChart3, ClipboardList, Hourglass, LogOut, X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const roleAccent: Record<string, { active: string; icon: string; dot: string; tag: string }> = {
    msme:    { active: "bg-mg-cosmic/15 text-mg-lavender border-mg-lavender/30",               icon: "text-mg-lavender",   dot: "bg-mg-lavender",    tag: "MSME"    },
    lender:  { active: "bg-status-success/10 text-status-success border-status-success/30",    icon: "text-status-success", dot: "bg-status-success", tag: "LENDER"  },
    auditor: { active: "bg-violet-500/10 text-violet-700 border-violet-400/30",                icon: "text-violet-700",    dot: "bg-violet-500",     tag: "AUDITOR" },
};

type NavItem = { label: string; icon: React.ElementType; href: string };
type NavSection = { section: string; items: NavItem[] };

const menuItems: Record<string, NavSection[]> = {
    msme: [
        {
            section: "Overview",
            items: [
                { label: "Dashboard",       icon: LayoutDashboard, href: "/msme/dashboard"    },
                { label: "Profile",         icon: User,            href: "/msme/profile"       },
                { label: "Lenders",         icon: CreditCard,      href: "/msme/lenders"       },
            ],
        },
        {
            section: "Invoices",
            items: [
                { label: "All Invoices",    icon: FileText,        href: "/msme/invoices"      },
                { label: "Upload Invoice",  icon: FileUp,          href: "/msme/invoices/upload"},
                { label: "Financed",        icon: CheckCircle,     href: "/msme/financed"      },
                { label: "Pending",         icon: Clock,           href: "/msme/pending"       },
                { label: "Rejected",        icon: XCircle,         href: "/msme/rejected"      },
                { label: "Fraud Alerts",    icon: AlertTriangle,   href: "/msme/fraud-alert"   },
            ],
        },
        {
            section: "Activity",
            items: [
                { label: "History",         icon: History,         href: "/msme/history"       },
            ],
        },
    ],
    lender: [
        {
            section: "Overview",
            items: [
                { label: "Dashboard",       icon: LayoutDashboard, href: "/lender/dashboard"   },
                { label: "Profile",         icon: User,            href: "/lender/profile"     },
            ],
        },
        {
            section: "Operations",
            items: [
                { label: "Verify Hash",     icon: Search,          href: "/lender/verify-hash" },
                { label: "Disbursement",    icon: IndianRupee,      href: "/lender/disbursement"},
                { label: "Report Fraud",    icon: Flag,            href: "/lender/report-fraud"},
            ],
        },
        {
            section: "Loans",
            items: [
                { label: "Active Loans",    icon: Layers,          href: "/lender/active-loans"},
                { label: "All Loans",       icon: BarChart3,       href: "/lender/loans"       },
                { label: "History",         icon: History,         href: "/lender/history"     },
            ],
        },
    ],
    auditor: [
        {
            section: "Overview",
            items: [
                { label: "Dashboard",       icon: LayoutDashboard, href: "/auditor/dashboard"  },
                { label: "Profile",         icon: User,            href: "/auditor/profile"    },
            ],
        },
        {
            section: "Invoices",
            items: [
                { label: "All Invoices",    icon: FileSearch,      href: "/auditor/invoices"   },
                { label: "Pending Review",  icon: Hourglass,       href: "/auditor/invoices/pending"   },
                { label: "Completed",       icon: ShieldCheck,     href: "/auditor/invoices/completed" },
                { label: "Audit File",      icon: ClipboardList,   href: "/auditor/invoices/audit"     },
            ],
        },
        {
            section: "Monitoring",
            items: [
                { label: "Audit Trail",     icon: Activity,        href: "/auditor/dashboard"  },
            ],
        },
    ],
};

interface SidebarProps {
    open?: boolean;
    onClose?: () => void;
}

interface SidebarContentProps {
    sections: NavSection[];
    pathname: string;
    accent: { active: string; icon: string; dot: string; tag: string };
    role: string | null;
    logout: () => void;
    onClose?: () => void;
    isMobile: boolean;
}

const SidebarContent = ({ sections, pathname, accent, role, logout, onClose, isMobile }: SidebarContentProps) => {
    return (
        <>
            <nav className="flex-1 py-4 px-3 space-y-5 overflow-y-auto">
                {sections.map((sec) => (
                    <div key={sec.section}>
                        <p className="mg-label px-3 mb-2.5">{sec.section}</p>
                        <div className="space-y-1">
                            {sec.items.map((item, i) => {
                                const isActive = pathname === item.href || (item.href !== `/${role}/dashboard` && pathname.startsWith(item.href + "/"));
                                return (
                                    <motion.div
                                        key={item.label}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: isMobile ? 0 : 0.05 + i * 0.04, ease: "easeOut" }}
                                    >
                                        <Link
                                            href={item.href}
                                            onClick={() => onClose?.()}
                                            className={cn(
                                                "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group border",
                                                isActive
                                                    ? cn("border", accent.active)
                                                    : "border-transparent text-mg-muted hover:text-mg-silver hover:bg-mg-card/60 hover:border-mg-lavender/10"
                                            )}
                                        >
                                            {isActive && (
                                                <span className={cn("absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full", accent.dot)} />
                                            )}
                                            <item.icon className={cn(
                                                "w-[18px] h-[18px] shrink-0 transition-colors",
                                                isActive ? accent.icon : "text-mg-dim group-hover:text-mg-muted"
                                            )} />
                                            <span className="truncate">{item.label}</span>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="mx-3 mg-divider" />

            <div className="p-4 pb-5 space-y-2 shrink-0">
                {/* Role badge */}
                <div className="px-3 py-2.5 rounded-lg bg-mg-card border border-mg-lavender/12">
                    <div className="flex items-center gap-2.5">
                        <div className={cn("w-2 h-2 rounded-full animate-pulse shrink-0", accent.dot)} />
                        <span className="text-xs font-semibold text-mg-muted uppercase tracking-wide">{role}</span>
                        <span className={cn("ml-auto text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0", accent.active)}>
                            {accent.tag}
                        </span>
                    </div>
                </div>
                {/* Logout button */}
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-mg-muted hover:text-status-danger hover:bg-status-danger/5 border border-transparent hover:border-status-danger/15 transition-all duration-150"
                >
                    <LogOut className="w-[18px] h-[18px] shrink-0" />
                    <span>Sign out</span>
                </button>
            </div>
        </>
    );
};

export const Sidebar = ({ open = false, onClose }: SidebarProps) => {
    const { role, logout } = useAuth();
    const pathname  = usePathname();
    const sections  = role ? menuItems[role as keyof typeof menuItems] ?? [] : [];
    const accent    = role ? roleAccent[role as keyof typeof roleAccent] : roleAccent.msme;

    return (
        <>
            {/* Mobile backdrop */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>

            {/* Desktop sidebar - static, always visible */}
            <aside className={cn(
                "hidden lg:flex lg:flex-col lg:w-64 lg:h-[calc(100vh-64px)] lg:shrink-0",
                "mg-sidebar overflow-y-auto"
            )}>
                <SidebarContent 
                    sections={sections} 
                    pathname={pathname} 
                    accent={accent} 
                    role={role} 
                    logout={logout}
                    onClose={onClose}
                    isMobile={false}
                />
            </aside>

            {/* Mobile sidebar - fixed drawer */}
            <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: open ? 0 : "-100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className={cn(
                    "lg:hidden fixed top-0 left-0 bottom-0 z-50 w-[280px] sm:w-80",
                    "mg-sidebar flex flex-col overflow-y-auto shadow-2xl"
                )}
            >
                {/* Mobile header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-mg-lavender/10 shrink-0">
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-mg-lavender" />
                        <span className="text-base font-bold text-mg-silver">OneFlow</span>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 rounded-lg hover:bg-mg-card border border-transparent hover:border-mg-lavender/15 transition-colors"
                        aria-label="Close menu"
                    >
                        <X className="w-4 h-4 text-mg-dim" />
                    </button>
                </div>

                <SidebarContent 
                    sections={sections} 
                    pathname={pathname} 
                    accent={accent} 
                    role={role} 
                    logout={logout}
                    onClose={onClose}
                    isMobile={true}
                />
            </motion.aside>
        </>
    );
};