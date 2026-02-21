"use client";

import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import {
    Shield, Key, Bell,
    LogOut, Save, CheckCircle, Loader2, AlertCircle, Calendar,
    Phone, MapPin, Briefcase, User, Mail,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { msmeProfileAPI, MSMEProfile, MSMEProfilePayload } from "@/lib/api";

const roleConfig: Record<string, { label: string; color: string }> = {
    msme:    { label: "MSME Owner",   color: "#4a4e8f" },
    lender:  { label: "Loan Officer", color: "#059669" },
    auditor: { label: "Regulator",    color: "#6d28d9" },
};

export default function ProfilePage() {
    const { user, role, logout, updateProfile } = useAuth();
    const config = role ? (roleConfig[role] ?? roleConfig.msme) : roleConfig.msme;

    const [name, setName]           = useState("");
    const [org, setOrg]             = useState("");
    const [notifs, setNotifs]       = useState(true);
    const [saving, setSaving]       = useState(false);
    const [saved, setSaved]         = useState(false);
    const [saveError, setSaveError] = useState("");

    // ── MSME Business Profile state ───────────────────────────────────────────
    const [msmeProfile,   setMsmeProfile]   = useState<MSMEProfile | null>(null);
    const [companyName,   setCompanyName]   = useState("");
    const [contactPerson, setContactPerson] = useState("");
    const [bizEmail,      setBizEmail]      = useState("");
    const [phone,         setPhone]         = useState("");
    const [address,       setAddress]       = useState("");
    const [loadingBiz,    setLoadingBiz]    = useState(false);
    const [savingBiz,     setSavingBiz]     = useState(false);
    const [savedBiz,      setSavedBiz]      = useState(false);
    const [bizError,      setBizError]      = useState("");

    // Populate personal fields once backend user resolves
    useEffect(() => {
        if (user) {
            setName(user.name ?? "");
            setOrg(user.organization ?? "");
        }
    }, [user]);

    // Load MSME profile (msme role only)
    useEffect(() => {
        if (role !== "msme") return;
        const token = localStorage.getItem("oneflow-token");
        if (!token || token.startsWith("mock.")) return;
        setLoadingBiz(true);
        msmeProfileAPI.getProfile(token)
            .then(res => {
                const p = res.data;
                setMsmeProfile(p);
                setCompanyName(p.companyName ?? "");
                setContactPerson(p.contactPerson ?? "");
                setBizEmail(p.email ?? "");
                setPhone(p.phone ?? "");
                setAddress(p.address ?? "");
            })
            .catch(() => {
                // 404 — profile not created yet; that's fine
            })
            .finally(() => setLoadingBiz(false));
    }, [role]);

    const handleSave = async () => {
        if (!name.trim()) { setSaveError("Name cannot be empty."); return; }
        setSaving(true);
        setSaveError("");
        try {
            await updateProfile({ name: name.trim(), organization: org.trim() });
            setSaved(true);
            toast.success("Profile updated", { description: "Your changes have been saved." });
            setTimeout(() => setSaved(false), 2500);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to save.";
            setSaveError(msg);
            toast.error("Update failed", { description: msg });
        } finally {
            setSaving(false);
        }
    };

    const handleSaveBiz = async () => {
        if (!companyName.trim()) { setBizError("Company name is required."); return; }
        const token = localStorage.getItem("oneflow-token");
        if (!token || token.startsWith("mock.")) {
            toast.info("Business profile is disabled in demo mode.");
            return;
        }
        setSavingBiz(true);
        setBizError("");
        try {
            const payload: MSMEProfilePayload = {
                companyName:   companyName.trim(),
                contactPerson: contactPerson.trim() || undefined,
                email:         bizEmail.trim()      || undefined,
                phone:         phone.trim()          || undefined,
                address:       address.trim()        || undefined,
            };
            const res = await msmeProfileAPI.createOrUpdate(token, payload);
            setMsmeProfile(res.data);
            setSavedBiz(true);
            toast.success(msmeProfile ? "Business profile updated" : "Business profile created");
            setTimeout(() => setSavedBiz(false), 2500);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to save business profile.";
            setBizError(msg);
            toast.error("Save failed", { description: msg });
        } finally {
            setSavingBiz(false);
        }
    };

    // Loading skeleton while user hasn't arrived from /auth/me yet
    if (!user) {
        return (
            <div className="space-y-8 max-w-2xl">
                <div className="mg-card rounded-2xl p-6 flex items-center gap-5 animate-pulse">
                    <div className="w-16 h-16 rounded-2xl bg-mg-surface shrink-0" />
                    <div className="flex-1 space-y-2.5">
                        <div className="h-4 w-44 bg-mg-surface rounded" />
                        <div className="h-3 w-60 bg-mg-surface rounded" />
                        <div className="h-5 w-24 bg-mg-surface rounded-full" />
                    </div>
                </div>
                <div className="mg-card rounded-2xl p-6 space-y-4 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-11 bg-mg-surface rounded-xl" />)}
                </div>
            </div>
        );
    }

    const initials = name
        ? name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
        : "?";

    const joinedDate = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString("en-IN", {
              year: "numeric", month: "long", day: "numeric",
          })
        : null;

    return (
        <div className="space-y-8 max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <p className="mg-label mb-1.5">{role?.toUpperCase()} Portal</p>
                <h1 className="text-3xl font-bold text-mg-silver tracking-tight">
                    My <span className="mg-accent-text">Profile</span>
                </h1>
                <p className="text-sm text-mg-muted mt-1">Manage your account details and preferences</p>
            </motion.div>

            {/* ── Avatar card ── */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                className="mg-card rounded-2xl p-6 flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0"
                    style={{ background: `linear-gradient(135deg, ${config.color}, ${config.color}aa)` }}>
                    {initials}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-mg-silver text-lg truncate">{user.name}</p>
                    <p className="text-sm text-mg-muted truncate">{user.email}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className={cn(
                            "inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full",
                            role === "msme"    ? "bg-mg-cosmic/10 text-mg-cosmic border border-mg-cosmic/20" :
                            role === "lender"  ? "bg-status-success/10 text-status-success border border-status-success/20" :
                                                 "bg-violet-500/10 text-violet-700 border border-violet-400/20"
                        )}>
                            <Shield className="w-3 h-3" />{config.label}
                        </span>
                        {joinedDate && (
                            <span className="inline-flex items-center gap-1 text-xs text-mg-dim">
                                <Calendar className="w-3 h-3" />Joined {joinedDate}
                            </span>
                        )}
                        {role === "msme" && msmeProfile && (
                            <span className="inline-flex items-center gap-1 text-xs text-status-success">
                                <CheckCircle className="w-3 h-3" />Business profile active
                            </span>
                        )}
                        {role === "msme" && !msmeProfile && !loadingBiz && (
                            <span className="inline-flex items-center gap-1 text-xs text-mg-dim border border-dashed border-mg-lavender/20 rounded-full px-2 py-0.5">
                                Business profile not set up
                            </span>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* ── Edit form ── */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
                className="mg-card rounded-2xl p-6 space-y-5">
                <p className="mg-label mb-1">Personal Information</p>

                <div>
                    <label className="mg-label block mb-1.5">Full Name</label>
                    <div className="relative flex items-center">
                        {/* <User className="absolute left-3 w-4 h-4 text-mg-dim pointer-events-none" /> */}
                        <input value={name} onChange={e => { setName(e.target.value); setSaveError(""); }}
                            placeholder="Your full name" className="mg-input pl-9" />
                    </div>
                </div>

                <div>
                    <label className="mg-label block mb-1.5">Email Address</label>
                    <div className="relative flex items-center">
                        {/* <Mail className="absolute left-3 w-4 h-4 text-mg-dim pointer-events-none" /> */}
                        <input value={user.email} readOnly
                            className="mg-input pl-9 opacity-60 cursor-not-allowed select-none" />
                    </div>
                    <p className="text-xs text-mg-dim mt-1">Email cannot be changed. Contact support to update.</p>
                </div>

                <div>
                    <label className="mg-label block mb-1.5">Organisation</label>
                    <div className="relative flex items-center">
                        {/* <Briefcase className="absolute left-3 w-4 h-4 text-mg-dim pointer-events-none" /> */}
                        <input value={org} onChange={e => setOrg(e.target.value)}
                            placeholder="Your organisation" className="mg-input pl-9" />
                    </div>
                </div>

                <div className="flex items-center justify-between py-2 border-t border-mg-lavender/08 pt-4">
                    <div className="flex items-center gap-3">
                        {/* <Bell className="w-4 h-4 text-mg-dim" /> */}
                        <div>
                            <p className="text-sm font-medium text-mg-silver">Email Notifications</p>
                            <p className="text-xs text-mg-muted">Receive alerts for invoice status changes</p>
                        </div>
                    </div>
                    <button onClick={() => setNotifs(!notifs)}
                        className={cn("relative w-11 h-6 rounded-full transition-colors",
                            notifs ? "bg-mg-cosmic" : "bg-mg-surface border border-mg-lavender/20")}>
                        <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                            notifs ? "translate-x-5.5 left-0" : "left-0.5")} />
                    </button>
                </div>

                {saveError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl text-sm text-status-danger"
                        style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.18)" }}>
                        <AlertCircle className="w-4 h-4 shrink-0" />{saveError}
                    </div>
                )}

                <button onClick={handleSave} disabled={saving}
                    className={cn("mg-btn-primary w-full justify-center gap-2", saving && "opacity-70 cursor-not-allowed")}>
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving&hellip;</> :
                     saved  ? <><CheckCircle className="w-4 h-4" />Saved!</> :
                              <><Save className="w-4 h-4" />Save Changes</>}
                </button>
            </motion.div>

            {/* ── MSME Business Profile ── */}
            {role === "msme" && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.20 }}
                    className="mg-card rounded-2xl p-6 space-y-5">
                    <div className="flex items-center justify-between">
                        <p className="mg-label">Business Profile</p>
                        {loadingBiz && <Loader2 className="w-4 h-4 animate-spin text-mg-dim" />}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="mg-label block mb-1.5">
                                Company Name <span className="text-status-danger">*</span>
                            </label>
                            <div className="relative flex items-center">
                                {/* <Briefcase className="absolute left-3 w-4 h-4 text-mg-dim pointer-events-none" /> */}
                                <input value={companyName} onChange={e => { setCompanyName(e.target.value); setBizError(""); }}
                                    placeholder="e.g. Sharma Industrial Exports Ltd"
                                    className="mg-input pl-9" />
                            </div>
                        </div>
                        <div>
                            <label className="mg-label block mb-1.5">Contact Person</label>
                            <div className="relative flex items-center">
                                {/* <User className="absolute left-3 w-4 h-4 text-mg-dim pointer-events-none" /> */}
                                <input value={contactPerson} onChange={e => setContactPerson(e.target.value)}
                                    placeholder="e.g. Arjun Sharma"
                                    className="mg-input pl-9" />
                            </div>
                        </div>
                        <div>
                            <label className="mg-label block mb-1.5">Business Email</label>
                            <div className="relative flex items-center">
                                {/* <Mail className="absolute left-3 w-4 h-4 text-mg-dim pointer-events-none" /> */}
                                <input type="email" value={bizEmail} onChange={e => setBizEmail(e.target.value)}
                                    placeholder="biz@company.com"
                                    className="mg-input pl-9" />
                            </div>
                        </div>
                        <div>
                            <label className="mg-label block mb-1.5">Phone</label>
                            <div className="relative flex items-center">
                                {/* <Phone className="absolute left-3 w-4 h-4 text-mg-dim pointer-events-none" /> */}
                                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                                    placeholder="+91-9876543210"
                                    className="mg-input pl-9" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="mg-label block mb-1.5">
                            <span className="inline-flex items-center gap-1.5">
                                {/* <MapPin className="w-3.5 h-3.5" /> */}
                                Address
                            </span>
                        </label>
                        <textarea value={address} onChange={e => setAddress(e.target.value)}
                            placeholder="123 Industrial Hub, Mumbai, Maharashtra, 400001"
                            rows={3}
                            className="mg-input resize-none" />
                    </div>

                    {bizError && (
                        <div className="flex items-center gap-2 p-3 rounded-xl text-sm text-status-danger"
                            style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.18)" }}>
                            <AlertCircle className="w-4 h-4 shrink-0" />{bizError}
                        </div>
                    )}

                    <button onClick={handleSaveBiz} disabled={savingBiz}
                        className={cn("mg-btn-primary w-full justify-center gap-2", savingBiz && "opacity-70 cursor-not-allowed")}>
                        {savingBiz ? <><Loader2 className="w-4 h-4 animate-spin" />Saving&hellip;</> :
                         savedBiz  ? <><CheckCircle className="w-4 h-4" />Saved!</> :
                                     <><Save className="w-4 h-4" />{msmeProfile ? "Update Business Profile" : "Create Business Profile"}</>}
                    </button>
                </motion.div>
            )}

            {/* ── Security ── */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: role === "msme" ? 0.26 : 0.20 }}
                className="mg-card rounded-2xl p-6 space-y-4">
                <p className="mg-label mb-1">Security</p>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Key className="w-4 h-4 text-mg-dim" />
                        <div>
                            <p className="text-sm font-medium text-mg-silver">Password</p>
                            <p className="text-xs text-mg-muted">Change your account password</p>
                        </div>
                    </div>
                    <button onClick={() => toast.info("Password reset link sent to your email.")}
                        className="text-sm font-medium text-mg-cosmic hover:text-mg-lavender transition-colors">
                        Change
                    </button>
                </div>
                <div className="mg-divider" />
                <button onClick={logout}
                    className="flex items-center gap-3 w-full text-left p-3 rounded-xl hover:bg-status-danger/5 border border-transparent hover:border-status-danger/15 transition-all group">
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
