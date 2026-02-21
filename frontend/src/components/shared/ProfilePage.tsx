"use client";

import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    Shield, Key, Bell, LogOut, Save, CheckCircle, Loader2,
    AlertCircle, Calendar, Phone, MapPin, Briefcase, User,
    Mail, Building2, Lock, ChevronRight, UserCircle2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { msmeProfileAPI, MSMEProfile, MSMEProfilePayload } from "@/lib/api";

const roleConfig: Record<string, { label: string; color: string; bg: string; textClass: string }> = {
    msme:    { label: "MSME Owner",   color: "#4a4e8f", bg: "rgba(74,78,143,0.10)",  textClass: "text-[#4a4e8f]" },
    lender:  { label: "Loan Officer", color: "#059669", bg: "rgba(5,150,105,0.10)",  textClass: "text-[#059669]" },
    auditor: { label: "Regulator",    color: "#6d28d9", bg: "rgba(109,40,217,0.10)", textClass: "text-[#6d28d9]" },
};

type Tab = "personal" | "business" | "security";

function FieldRow({ icon: Icon, label, children, hint }: {
    icon: React.ElementType; label: string; children: React.ReactNode; hint?: string;
}) {
    return (
        <div className="grid grid-cols-[1fr_2fr] items-start gap-6 py-4 border-b border-[rgba(74,78,143,0.07)] last:border-0">
            <div className="flex items-center gap-2 pt-2">
                <Icon className="w-3.5 h-3.5 text-mg-dim shrink-0" />
                <span className="mg-label">{label}</span>
            </div>
            <div>
                {children}
                {hint && <p className="text-xs text-mg-dim mt-1">{hint}</p>}
            </div>
        </div>
    );
}

export default function ProfilePage() {
    const { user, role, logout, updateProfile } = useAuth();
    const config = role ? (roleConfig[role] ?? roleConfig.msme) : roleConfig.msme;

    const [activeTab, setActiveTab] = useState<Tab>("personal");
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

    useEffect(() => {
        if (user) { setName(user.name ?? ""); setOrg(user.organization ?? ""); }
    }, [user]);

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
            .catch(() => {})
            .finally(() => setLoadingBiz(false));
    }, [role]);

    const handleSave = async () => {
        if (!name.trim()) { setSaveError("Name cannot be empty."); return; }
        setSaving(true); setSaveError("");
        try {
            await updateProfile({ name: name.trim(), organization: org.trim() });
            setSaved(true);
            toast.success("Profile updated", { description: "Your changes have been saved." });
            setTimeout(() => setSaved(false), 2500);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to save.";
            setSaveError(msg);
            toast.error("Update failed", { description: msg });
        } finally { setSaving(false); }
    };

    const handleSaveBiz = async () => {
        if (!companyName.trim()) { setBizError("Company name is required."); return; }
        const token = localStorage.getItem("oneflow-token");
        if (!token || token.startsWith("mock.")) { toast.info("Business profile is disabled in demo mode."); return; }
        setSavingBiz(true); setBizError("");
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
        } finally { setSavingBiz(false); }
    };

    if (!user) {
        return (
            <div className="animate-pulse space-y-0">
                {/* skeleton hero */}
                <div className="rounded-2xl overflow-hidden mb-6">
                    <div className="h-28 bg-mg-surface" />
                    <div className="bg-white border border-[rgba(74,78,143,0.10)] px-8 pt-0 pb-6 flex items-end gap-5">
                        <div className="w-20 h-20 rounded-2xl bg-mg-surface -mt-10 shrink-0 border-4 border-white" />
                        <div className="flex-1 space-y-2 pb-1">
                            <div className="h-4 w-40 bg-mg-surface rounded" />
                            <div className="h-3 w-56 bg-mg-surface rounded" />
                        </div>
                    </div>
                </div>
                <div className="mg-card rounded-2xl p-6 space-y-4">
                    {[1,2,3].map(i => <div key={i} className="h-11 bg-mg-surface rounded-xl" />)}
                </div>
            </div>
        );
    }

    const initials = name
        ? name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
        : "?";

    const joinedDate = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })
        : null;

    const tabs: { id: Tab; label: string; icon: React.ElementType; show?: boolean }[] = [
        { id: "personal" as const,  label: "Personal",         icon: UserCircle2 },
        { id: "business" as const,  label: "Business Profile", icon: Building2,  show: role === "msme" },
        { id: "security" as const,  label: "Security",         icon: Lock },
    ].filter(t => t.show !== false);

    return (
        <div className="w-full space-y-0">

            {/* ═══════════ HERO BANNER ═══════════ */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl overflow-hidden mb-6 shadow-sm border border-[rgba(74,78,143,0.10)]">
                {/* Cover strip */}
                <div className="h-28 relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${config.color}22 0%, ${config.color}10 40%, rgba(107,94,160,0.08) 100%)` }}>
                    {/* Decorative blobs */}
                    <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-20"
                        style={{ background: config.color }} />
                    <div className="absolute right-24 top-4 w-16 h-16 rounded-full opacity-10"
                        style={{ background: config.color }} />
                    <div className="absolute left-1/3 bottom-0 w-24 h-24 rounded-full -mb-12 opacity-[0.07]"
                        style={{ background: config.color }} />
                    {/* Portal label */}
                    <span className="absolute top-4 left-6 mg-label" style={{ color: config.color }}>
                        {role?.toUpperCase()} PORTAL
                    </span>
                </div>

                {/* Identity row */}
                <div className="bg-white px-8 pt-0 pb-6 flex flex-col sm:flex-row sm:items-end gap-4">
                    {/* Avatar */}
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0
                                    -mt-10 border-4 border-white shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${config.color}, ${config.color}bb)` }}>
                        {initials}
                    </div>

                    {/* Name / email / badges */}
                    <div className="flex-1 min-w-0 pb-1">
                        <h1 className="text-xl font-bold text-mg-silver truncate leading-tight">{user.name}</h1>
                        <p className="text-sm text-mg-muted truncate">{user.email}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest
                                             px-2.5 py-1 rounded-full border"
                                style={{ background: config.bg, color: config.color, borderColor: `${config.color}30` }}>
                                <Shield className="w-3 h-3" />{config.label}
                            </span>
                            {joinedDate && (
                                <span className="inline-flex items-center gap-1 text-xs text-mg-dim">
                                    <Calendar className="w-3 h-3" />Joined {joinedDate}
                                </span>
                            )}
                            {role === "msme" && msmeProfile && (
                                <span className="inline-flex items-center gap-1 text-xs text-status-success">
                                    <CheckCircle className="w-3 h-3" />Business verified
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Quick sign-out on desktop */}
                    <button onClick={logout}
                        className="hidden sm:inline-flex items-center gap-2 text-sm text-mg-dim hover:text-status-danger
                                   border border-transparent hover:border-status-danger/20 rounded-xl px-3 py-2 transition-all">
                        <LogOut className="w-4 h-4" />Sign out
                    </button>
                </div>
            </motion.div>

            {/* ═══════════ MAIN BODY — sidebar + content ═══════════ */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }}
                className="flex flex-col lg:flex-row gap-5">

                {/* ── LEFT NAV PANEL ── */}
                <aside className="lg:w-52 shrink-0 space-y-1">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left group",
                                activeTab === tab.id
                                    ? "bg-white border border-[rgba(74,78,143,0.14)] text-mg-silver shadow-sm"
                                    : "text-mg-muted hover:bg-white/60 hover:text-mg-silver"
                            )}>
                            <tab.icon className={cn("w-4 h-4 shrink-0 transition-colors",
                                activeTab === tab.id ? config.textClass : "text-mg-dim group-hover:text-mg-muted")} />
                            <span className="flex-1 truncate">{tab.label}</span>
                            {activeTab === tab.id && <ChevronRight className="w-3.5 h-3.5 text-mg-dim" />}
                        </button>
                    ))}

                    {/* Quick info card */}
                    <div className="mg-card rounded-2xl p-4 mt-4 space-y-3">
                        <p className="mg-label">Account</p>
                        <div className="space-y-2.5">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                                    style={{ background: config.bg }}>
                                    <Shield className="w-3 h-3" style={{ color: config.color }} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-mg-dim leading-none mb-0.5">Role</p>
                                    <p className="text-xs font-semibold text-mg-silver">{config.label}</p>
                                </div>
                            </div>
                            {org && (
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-mg-surface flex items-center justify-center shrink-0">
                                        <Briefcase className="w-3 h-3 text-mg-dim" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] text-mg-dim leading-none mb-0.5">Organisation</p>
                                        <p className="text-xs font-semibold text-mg-silver truncate">{org}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                {/* ── RIGHT CONTENT PANEL ── */}
                <div className="flex-1 min-w-0">
                    <AnimatePresence mode="wait">

                        {/* ─── PERSONAL TAB ─── */}
                        {activeTab === "personal" && (
                            <motion.div key="personal"
                                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                                transition={{ duration: 0.18 }}
                                className="mg-card rounded-2xl overflow-hidden">
                                <div className="px-6 py-4 border-b border-[rgba(74,78,143,0.08)] flex items-center justify-between">
                                    <div>
                                        <h2 className="text-base font-semibold text-mg-silver">Personal Information</h2>
                                        <p className="text-xs text-mg-muted mt-0.5">Update your name and organisation</p>
                                    </div>
                                </div>

                                <div className="px-6">
                                    <FieldRow icon={User} label="Full Name">
                                        <input value={name}
                                            onChange={e => { setName(e.target.value); setSaveError(""); }}
                                            placeholder="Your full name"
                                            className="mg-input" />
                                    </FieldRow>

                                    <FieldRow icon={Mail} label="Email"
                                        hint="Email cannot be changed. Contact support to update.">
                                        <input value={user.email} readOnly
                                            className="mg-input opacity-60 cursor-not-allowed select-none" />
                                    </FieldRow>

                                    <FieldRow icon={Briefcase} label="Organisation">
                                        <input value={org} onChange={e => setOrg(e.target.value)}
                                            placeholder="Your organisation"
                                            className="mg-input" />
                                    </FieldRow>

                                    <FieldRow icon={Bell} label="Notifications">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-mg-muted">Invoice status alerts via email</p>
                                            <button onClick={() => setNotifs(!notifs)}
                                                className={cn("relative w-11 h-6 rounded-full transition-colors shrink-0",
                                                    notifs ? "bg-mg-cosmic" : "bg-mg-surface border border-mg-lavender/20")}>
                                                <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200",
                                                    notifs ? "left-[22px]" : "left-0.5")} />
                                            </button>
                                        </div>
                                    </FieldRow>
                                </div>

                                <div className="px-6 pb-5 pt-2">
                                    {saveError && (
                                        <div className="flex items-center gap-2 p-3 rounded-xl text-sm text-status-danger mb-3"
                                            style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.18)" }}>
                                            <AlertCircle className="w-4 h-4 shrink-0" />{saveError}
                                        </div>
                                    )}
                                    <div className="flex justify-end">
                                        <button onClick={handleSave} disabled={saving}
                                            className={cn("mg-btn-primary gap-2", saving && "opacity-70 cursor-not-allowed")}>
                                            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving&hellip;</> :
                                             saved  ? <><CheckCircle className="w-4 h-4" />Saved!</> :
                                                      <><Save className="w-4 h-4" />Save Changes</>}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ─── BUSINESS TAB (MSME only) ─── */}
                        {activeTab === "business" && role === "msme" && (
                            <motion.div key="business"
                                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                                transition={{ duration: 0.18 }}
                                className="mg-card rounded-2xl overflow-hidden">
                                <div className="px-6 py-4 border-b border-[rgba(74,78,143,0.08)] flex items-center justify-between">
                                    <div>
                                        <h2 className="text-base font-semibold text-mg-silver">Business Profile</h2>
                                        <p className="text-xs text-mg-muted mt-0.5">
                                            {msmeProfile ? "Update your registered business details" : "Set up your business profile to start submitting invoices"}
                                        </p>
                                    </div>
                                    {loadingBiz && <Loader2 className="w-4 h-4 animate-spin text-mg-dim" />}
                                </div>

                                <div className="px-6">
                                    <FieldRow icon={Building2} label="Company Name">
                                        <div>
                                            <input value={companyName}
                                                onChange={e => { setCompanyName(e.target.value); setBizError(""); }}
                                                placeholder="e.g. Sharma Industrial Exports Ltd"
                                                className="mg-input" />
                                            <p className="text-[10px] text-mg-dim mt-1">Required <span className="text-status-danger">*</span></p>
                                        </div>
                                    </FieldRow>

                                    <FieldRow icon={User} label="Contact Person">
                                        <input value={contactPerson}
                                            onChange={e => setContactPerson(e.target.value)}
                                            placeholder="e.g. Arjun Sharma"
                                            className="mg-input" />
                                    </FieldRow>

                                    <FieldRow icon={Mail} label="Business Email">
                                        <input type="email" value={bizEmail}
                                            onChange={e => setBizEmail(e.target.value)}
                                            placeholder="biz@company.com"
                                            className="mg-input" />
                                    </FieldRow>

                                    <FieldRow icon={Phone} label="Phone">
                                        <input type="tel" value={phone}
                                            onChange={e => setPhone(e.target.value)}
                                            placeholder="+91-9876543210"
                                            className="mg-input" />
                                    </FieldRow>

                                    <FieldRow icon={MapPin} label="Address">
                                        <textarea value={address} onChange={e => setAddress(e.target.value)}
                                            placeholder="123 Industrial Hub, Mumbai, Maharashtra, 400001"
                                            rows={3} className="mg-input resize-none" />
                                    </FieldRow>
                                </div>

                                <div className="px-6 pb-5 pt-2">
                                    {bizError && (
                                        <div className="flex items-center gap-2 p-3 rounded-xl text-sm text-status-danger mb-3"
                                            style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.18)" }}>
                                            <AlertCircle className="w-4 h-4 shrink-0" />{bizError}
                                        </div>
                                    )}
                                    <div className="flex justify-end">
                                        <button onClick={handleSaveBiz} disabled={savingBiz}
                                            className={cn("mg-btn-primary gap-2", savingBiz && "opacity-70 cursor-not-allowed")}>
                                            {savingBiz ? <><Loader2 className="w-4 h-4 animate-spin" />Saving&hellip;</> :
                                             savedBiz  ? <><CheckCircle className="w-4 h-4" />Saved!</> :
                                                         <><Save className="w-4 h-4" />{msmeProfile ? "Update Profile" : "Create Profile"}</>}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ─── SECURITY TAB ─── */}
                        {activeTab === "security" && (
                            <motion.div key="security"
                                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                                transition={{ duration: 0.18 }}
                                className="mg-card rounded-2xl overflow-hidden">
                                <div className="px-6 py-4 border-b border-[rgba(74,78,143,0.08)]">
                                    <h2 className="text-base font-semibold text-mg-silver">Security settings</h2>
                                    <p className="text-xs text-mg-muted mt-0.5">Manage password and session</p>
                                </div>

                                <div className="px-6 py-2">
                                    {/* Password row */}
                                    <div className="flex items-center gap-4 py-4 border-b border-[rgba(74,78,143,0.07)]">
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                            style={{ background: config.bg }}>
                                            <Key className="w-4 h-4" style={{ color: config.color }} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-mg-silver">Password</p>
                                            <p className="text-xs text-mg-muted">Last changed — unknown</p>
                                        </div>
                                        <button
                                            onClick={() => toast.info("Password reset link sent to your email.")}
                                            className="text-sm font-semibold px-4 py-1.5 rounded-lg border transition-all
                                                       text-mg-cosmic border-[rgba(74,78,143,0.20)] hover:border-[rgba(74,78,143,0.40)]
                                                       hover:bg-[rgba(74,78,143,0.05)]">
                                            Reset
                                        </button>
                                    </div>

                                    {/* Notifications row */}
                                    <div className="flex items-center gap-4 py-4 border-b border-[rgba(74,78,143,0.07)]">
                                        <div className="w-9 h-9 rounded-xl bg-mg-surface flex items-center justify-center shrink-0">
                                            <Bell className="w-4 h-4 text-mg-dim" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-mg-silver">Email Notifications</p>
                                            <p className="text-xs text-mg-muted">Invoice status and system alerts</p>
                                        </div>
                                        <button onClick={() => setNotifs(!notifs)}
                                            className={cn("relative w-11 h-6 rounded-full transition-colors shrink-0",
                                                notifs ? "bg-mg-cosmic" : "bg-mg-surface border border-mg-lavender/20")}>
                                            <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200",
                                                notifs ? "left-[22px]" : "left-0.5")} />
                                        </button>
                                    </div>
                                </div>

                                {/* Sign out */}
                                <div className="px-6 pb-5 pt-2">
                                    <button onClick={logout}
                                        className="flex items-center gap-3 w-full text-left px-4 py-3.5 rounded-xl
                                                   border border-transparent hover:bg-status-danger/5 hover:border-status-danger/15
                                                   transition-all group">
                                        <div className="w-9 h-9 rounded-xl bg-mg-surface group-hover:bg-status-danger/10 flex items-center justify-center shrink-0 transition-colors">
                                            <LogOut className="w-4 h-4 text-mg-dim group-hover:text-status-danger transition-colors" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-mg-silver group-hover:text-status-danger transition-colors">Sign out</p>
                                            <p className="text-xs text-mg-muted">End your current session</p>
                                        </div>
                                        <ChevronRight className="ml-auto w-4 h-4 text-mg-dim opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
