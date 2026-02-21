"use client";

import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { User, Mail, Building2, Shield, Key, Bell, LogOut, Save, CheckCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const roleDetails: Record<string, { label: string; org: string; email: string; bg: string }> = {
    msme:    { label: "MSME Owner",    org: "TechFlow Pvt. Ltd.",       email: "arjun.msme@techflow.in",   bg: "#4a4e8f" },
    lender:  { label: "Loan Officer",  org: "Global Finance Bank",      email: "sarah.lender@globalfin.in", bg: "#059669" },
    auditor: { label: "Regulator",     org: "RBI Compliance Division",  email: "priya.audit@rbi.in",        bg: "#6d28d9" },
};

export default function ProfilePage() {
    const { role, logout } = useAuth();
    const info = role ? roleDetails[role] ?? roleDetails.msme : roleDetails.msme;
    const [name, setName]        = useState(role === "msme" ? "Arjun Mehta" : role === "lender" ? "Sarah Smith" : "Priya Sharma");
    const [org, setOrg]          = useState(info.org);
    const [notifs, setNotifs]    = useState(true);
    const [saved, setSaved]      = useState(false);

    const handleSave = () => {
        setSaved(true);
        toast.success("Profile updated", { description: "Changes have been saved." });
        setTimeout(() => setSaved(false), 2500);
    };

    return (
        <div className="space-y-8 max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <p className="mg-label mb-1.5">{role?.toUpperCase()} Portal</p>
                <h1 className="text-3xl font-bold text-mg-silver tracking-tight">My <span className="mg-accent-text">Profile</span></h1>
                <p className="text-sm text-mg-muted mt-1">Manage your account details and preferences</p>
            </motion.div>

            {/* Avatar card */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mg-card rounded-2xl p-6 flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0"
                    style={{ background: `linear-gradient(135deg, ${info.bg}, ${info.bg}aa)` }}>
                    {name[0]}
                </div>
                <div>
                    <p className="font-bold text-mg-silver text-lg">{name}</p>
                    <p className="text-sm text-mg-muted">{info.email}</p>
                    <span className={cn("mt-1 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full",
                        role === "msme" ? "bg-mg-cosmic/10 text-mg-cosmic border border-mg-cosmic/20" :
                        role === "lender" ? "bg-status-success/10 text-status-success border border-status-success/20" :
                        "bg-violet-500/10 text-violet-700 border border-violet-400/20")}>
                        <Shield className="w-3 h-3" /> {info.label}
                    </span>
                </div>
            </motion.div>

            {/* Edit form */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="mg-card rounded-2xl p-6 space-y-5">
                <p className="mg-label mb-1">Personal Information</p>

                <div>
                    <label className="mg-label block mb-1.5">Full Name</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mg-dim" />
                        <input value={name} onChange={e => setName(e.target.value)} className="mg-input pl-9" />
                    </div>
                </div>

                <div>
                    <label className="mg-label block mb-1.5">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mg-dim" />
                        <input defaultValue={info.email} disabled className="mg-input pl-9 opacity-60 cursor-not-allowed" />
                    </div>
                    <p className="text-xs text-mg-dim mt-1">Email cannot be changed. Contact support to update.</p>
                </div>

                <div>
                    <label className="mg-label block mb-1.5">Organisation</label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mg-dim" />
                        <input value={org} onChange={e => setOrg(e.target.value)} className="mg-input pl-9" />
                    </div>
                </div>

                <div className="flex items-center justify-between py-2 border-t border-mg-lavender/08 pt-4">
                    <div className="flex items-center gap-3">
                        <Bell className="w-4 h-4 text-mg-dim" />
                        <div>
                            <p className="text-sm font-medium text-mg-silver">Email Notifications</p>
                            <p className="text-xs text-mg-muted">Receive alerts for invoice status changes</p>
                        </div>
                    </div>
                    <button onClick={() => setNotifs(!notifs)}
                        className={cn("relative w-11 h-6 rounded-full transition-colors", notifs ? "bg-mg-cosmic" : "bg-mg-surface border border-mg-lavender/20")}>
                        <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                            notifs ? "translate-x-5.5 left-0" : "left-0.5")} />
                    </button>
                </div>

                <button onClick={handleSave} className="mg-btn-primary w-full justify-center gap-2">
                    {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
                </button>
            </motion.div>

            {/* Security section */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.20 }} className="mg-card rounded-2xl p-6 space-y-4">
                <p className="mg-label mb-1">Security</p>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Key className="w-4 h-4 text-mg-dim" />
                        <div>
                            <p className="text-sm font-medium text-mg-silver">Password</p>
                            <p className="text-xs text-mg-muted">Last changed 30 days ago</p>
                        </div>
                    </div>
                    <button onClick={() => toast.info("Password reset link sent to your email.")}
                        className="text-sm font-medium text-mg-cosmic hover:text-mg-lavender transition-colors">
                        Change
                    </button>
                </div>
                <div className="mg-divider" />
                <button onClick={logout} className="flex items-center gap-3 w-full text-left p-3 rounded-xl hover:bg-status-danger/5 border border-transparent hover:border-status-danger/15 transition-all group">
                    <LogOut className="w-4 h-4 text-mg-dim group-hover:text-status-danger" />
                    <div>
                        <p className="text-sm font-medium text-mg-silver group-hover:text-status-danger transition-colors">Sign out</p>
                        <p className="text-xs text-mg-muted">End your current session</p>
                    </div>
                </button>
            </motion.div>
        </div>
    );
}
