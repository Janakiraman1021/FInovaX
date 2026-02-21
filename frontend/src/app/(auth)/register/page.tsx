"use client";

import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/mock/mockUsers";
import {
    Shield, ArrowRight, User, Mail, Building2, Lock,
    Eye, EyeOff, AlertCircle,
    CheckCircle2, TrendingUp, Users,
    Landmark, ShieldCheck, FileText,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";
import Link from "next/link";

const stats = [
    { icon: TrendingUp,   value: "₹2.4 Cr+", label: "Invoices Financed" },
    { icon: Users,        value: "340+",      label: "Active MSMEs"      },
    { icon: CheckCircle2, value: "99.9%",     label: "Audit Accuracy"    },
];

type RoleKey = "msme" | "lender" | "auditor";

const roles: { value: RoleKey; label: string; desc: string; color: string }[] = [
    { value: "msme",    label: "MSME",    desc: "Upload & finance trade receivables", color: "#4a4e8f" },
    { value: "lender",  label: "Lender",  desc: "Verify hashes & disburse capital",   color: "#059669" },
    { value: "auditor", label: "Auditor", desc: "Surveillance & regulatory oversight", color: "#7c3aed" },
];

const RoleIcon = ({ role, className }: { role: RoleKey; className?: string }) => {
    if (role === "msme")    return <FileText    className={className} />;
    if (role === "lender")  return <Landmark    className={className} />;
    if (role === "auditor") return <ShieldCheck className={className} />;
    return null;
};

const StatIcon = ({ icon: Icon, className, style }: { icon: React.ElementType; className?: string; style?: React.CSSProperties }) => (
    <Icon className={className} style={style} />
);

export default function RegisterPage() {
    const { login } = useAuth();
    const [selectedRole, setSelectedRole] = useState<UserRole | "">("");
    const [showPw, setShowPw]             = useState(false);
    const [showCPw, setShowCPw]           = useState(false);
    const [submitting, setSubmitting]     = useState(false);
    const [form, setForm]                 = useState({ name: "", email: "", org: "", password: "", confirmPw: "" });
    const [errors, setErrors]             = useState<Record<string, string>>({});

    const handleField = (k: string, v: string) => {
        setForm(f => ({ ...f, [k]: v }));
        setErrors(e => ({ ...e, [k]: "" }));
    };

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!form.name.trim())                          errs.name      = "Name is required";
        if (!form.email.trim())                         errs.email     = "Email is required";
        else if (!/^\S+@\S+\.\S+$/.test(form.email))   errs.email     = "Invalid email";
        if (!form.org.trim())                           errs.org       = "Organisation is required";
        if (!selectedRole)                              errs.role      = "Please select a role";
        if (form.password.length < 8)                   errs.password  = "At least 8 characters";
        if (form.password !== form.confirmPw)           errs.confirmPw = "Passwords do not match";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate() || !selectedRole) return;
        setSubmitting(true);
        setTimeout(() => login(selectedRole as UserRole), 1600);
    };

    return (
        <div className="min-h-screen flex" style={{ background: "var(--mg-base)" }}>

            {/* ── Left brand panel ── */}
            <motion.aside
                initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className="hidden lg:flex lg:w-[46%] xl:w-[42%] flex-col justify-between relative overflow-hidden"
                style={{ background: "linear-gradient(145deg, #1a1640 0%, #2d2660 40%, #3d306e 70%, #4a3880 100%)" }}
            >
                {/* grid overlay */}
                <div className="absolute inset-0 pointer-events-none"
                    style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />

                {/* glow blobs */}
                <div className="absolute top-1/4 -left-16 w-72 h-72 rounded-full blur-[120px]"
                    style={{ background: "rgba(107,94,160,0.30)" }} />
                <div className="absolute bottom-1/3 right-0 w-56 h-56 rounded-full blur-[100px]"
                    style={{ background: "rgba(74,78,143,0.25)" }} />

                {/* top logo */}
                <div className="relative z-10 pt-10 px-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }}>
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-white font-bold text-xl tracking-tight">FInovaX</span>
                    </div>
                </div>

                {/* centre copy */}
                <div className="relative z-10 px-10 py-6 flex-1 flex flex-col justify-center">
                    <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}>
                        <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "rgba(167,152,255,0.8)" }}>
                            Join the platform
                        </p>
                        <h2 className="text-3xl xl:text-4xl font-bold leading-snug text-white mb-4">
                            Your gateway to<br />
                            <span style={{ color: "#b8a8ff" }}>verified trade finance.</span>
                        </h2>
                        <p className="text-sm leading-relaxed mb-10" style={{ color: "rgba(203,196,255,0.75)" }}>
                            Whether you're an MSME looking to unlock capital, a lender seeking verified assets, or a regulator — FInovaX has a role for you.
                        </p>
                    </motion.div>

                    {/* stats row */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        {stats.map((s, i) => (
                            <motion.div key={s.label}
                                initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.40 + i * 0.09 }}
                                className="rounded-xl p-3 text-center"
                                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}>
                                <StatIcon icon={s.icon} className="w-4 h-4 mx-auto mb-1.5" style={{ color: "#c4b5ff" } as React.CSSProperties} />
                                <p className="text-base font-bold text-white leading-none mb-1">{s.value}</p>
                                <p className="text-[10px] leading-tight" style={{ color: "rgba(203,196,255,0.60)" }}>{s.label}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* role cards */}
                    <div className="space-y-3">
                        {roles.map((r, i) => (
                            <motion.div key={r.value}
                                initial={{ x: -16, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.55 + i * 0.08 }}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                                style={{
                                    background: selectedRole === r.value ? "rgba(167,152,255,0.15)" : "rgba(255,255,255,0.05)",
                                    border: `1px solid ${selectedRole === r.value ? "rgba(167,152,255,0.35)" : "rgba(255,255,255,0.09)"}`,
                                }}>
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                                    style={{ background: `${r.color}55` }}>
                                    <RoleIcon role={r.value} className="w-3.5 h-3.5 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">{r.label}</p>
                                    <p className="text-[11px]" style={{ color: "rgba(203,196,255,0.60)" }}>{r.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* bottom */}
                <div className="relative z-10 pb-8 px-10">
                    <div className="h-px mb-6" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)" }} />
                    <p className="text-xs" style={{ color: "rgba(203,196,255,0.45)" }}>
                        &copy; {new Date().getFullYear()} FInovaX. All rights reserved.
                    </p>
                </div>
            </motion.aside>

            {/* ── Right form panel ── */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 relative overflow-y-auto">

                <div className="pointer-events-none absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full blur-[120px] opacity-20"
                    style={{ background: "radial-gradient(ellipse, rgba(74,78,143,0.25) 0%, transparent 70%)" }} />

                <motion.div
                    initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15, duration: 0.5 }}
                    className="relative z-10 w-full max-w-[440px]">

                    {/* mobile logo */}
                    <div className="lg:hidden flex items-center gap-2 mb-8">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: "linear-gradient(135deg, #4a4e8f, #6b5ea0)" }}>
                            <Shield className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-lg mg-gradient-text">FInovaX</span>
                    </div>

                    <div className="mb-7">
                        <h1 className="text-2xl font-bold text-mg-silver tracking-tight mb-1">Create your account</h1>
                        <p className="text-sm text-mg-muted">
                            Already have an account?{" "}
                            <Link href="/login" className="text-mg-cosmic font-semibold hover:text-mg-lavender transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="mg-card rounded-2xl p-7 space-y-4">
 
                        {/* Name + Organisation */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mg-label block mb-1.5">Full Name</label>
                                <div className="relative">
                                    {/* <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mg-dim" /> */}
                                    <input value={form.name} onChange={e => handleField("name", e.target.value)}
                                        placeholder="Arjun Mehta"
                                        className={cn("mg-input pl-9", errors.name && "border-status-danger")} />
                                </div>
                                {errors.name && <p className="text-[11px] text-status-danger mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name}</p>}
                            </div>
                            <div>
                                <label className="mg-label block mb-1.5">Organisation</label>
                                <div className="relative">
                                    {/* <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mg-dim" /> */}
                                    <input value={form.org} onChange={e => handleField("org", e.target.value)}
                                        placeholder="TechFlow Pvt. Ltd."
                                        className={cn("mg-input pl-9", errors.org && "border-status-danger")} />
                                </div>
                                {errors.org && <p className="text-[11px] text-status-danger mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.org}</p>}
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="mg-label block mb-1.5">Email Address</label>
                            <div className="relative">
                                {/* <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mg-dim" /> */}
                                <input type="email" value={form.email} onChange={e => handleField("email", e.target.value)}
                                    placeholder="arjun@company.in"
                                    className={cn("mg-input pl-9", errors.email && "border-status-danger")} />
                            </div>
                            {errors.email && <p className="text-[11px] text-status-danger mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email}</p>}
                        </div>

                        {/* Role selector */}
                        <div>
                            <label className="mg-label block mb-2">Access Role</label>
                            <div className="grid grid-cols-3 gap-2">
                                {roles.map(r => (
                                    <button key={r.value} type="button"
                                        onClick={() => { setSelectedRole(r.value as UserRole); setErrors(e => ({ ...e, role: "" })); }}
                                        className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-center transition-all"
                                        style={{
                                            background: selectedRole === r.value ? `${r.color}12` : "var(--mg-elevated)",
                                            border: `1.5px solid ${selectedRole === r.value ? r.color + "55" : "rgba(74,78,143,0.12)"}`,
                                        }}>
                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                                            style={{ background: `${r.color}${selectedRole === r.value ? "BB" : "44"}` }}>
                                            <RoleIcon role={r.value} className="w-3.5 h-3.5 text-white" />
                                        </div>
                                        <span className="text-xs font-semibold"
                                            style={{ color: selectedRole === r.value ? r.color : "var(--mg-muted)" }}>
                                            {r.label}
                                        </span>
                                        <span className="text-[9px] leading-tight text-mg-dim">{r.desc.split("&")[0].trim()}</span>
                                    </button>
                                ))}
                            </div>
                            {errors.role && <p className="text-[11px] text-status-danger mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.role}</p>}
                        </div>

                        {/* Password + Confirm */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mg-label block mb-1.5">Password</label>
                                <div className="relative">
                                    {/* <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mg-dim" /> */}
                                    <input type={showPw ? "text" : "password"} value={form.password} onChange={e => handleField("password", e.target.value)}
                                        placeholder="Min. 8 chars"
                                        className={cn("mg-input pl-9 pr-9", errors.password && "border-status-danger")} />
                                    <button type="button" onClick={() => setShowPw(!showPw)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-mg-dim hover:text-mg-muted transition-colors">
                                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-[11px] text-status-danger mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.password}</p>}
                            </div>
                            <div>
                                <label className="mg-label block mb-1.5">Confirm</label>
                                <div className="relative">
                                    {/* <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mg-dim" /> */}
                                    <input type={showCPw ? "text" : "password"} value={form.confirmPw} onChange={e => handleField("confirmPw", e.target.value)}
                                        placeholder="Repeat password"
                                        className={cn("mg-input pl-9 pr-9", errors.confirmPw && "border-status-danger")} />
                                    <button type="button" onClick={() => setShowCPw(!showCPw)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-mg-dim hover:text-mg-muted transition-colors">
                                        {showCPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.confirmPw && <p className="text-[11px] text-status-danger mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.confirmPw}</p>}
                            </div>
                        </div>

                        <p className="text-xs text-mg-dim">
                            By registering you agree to our{" "}
                            <Link href="/terms-and-conditions" className="text-mg-cosmic hover:text-mg-lavender transition-colors">Terms</Link>
                            {" "}and{" "}
                            <Link href="/privacy-policy" className="text-mg-cosmic hover:text-mg-lavender transition-colors">Privacy Policy</Link>.
                        </p>

                        <button type="submit" disabled={submitting}
                            className={cn("mg-btn-primary w-full justify-center gap-2", submitting && "opacity-70 cursor-not-allowed")}>
                            {submitting ? (
                                <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Creating account&hellip;</>
                            ) : (
                                <>Create Account <ArrowRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}