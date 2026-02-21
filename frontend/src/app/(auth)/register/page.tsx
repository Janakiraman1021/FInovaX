"use client";

import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/mock/mockUsers";
import { Shield, ArrowRight, User, Mail, Building2, Lock, Eye, EyeOff, ChevronDown, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";
import Link from "next/link";

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
        if (!form.name.trim())                             errs.name       = "Name is required";
        if (!form.email.trim())                            errs.email      = "Email is required";
        else if (!/^\S+@\S+\.\S+$/.test(form.email))      errs.email      = "Invalid email";
        if (!form.org.trim())                              errs.org        = "Organisation is required";
        if (!selectedRole)                                 errs.role       = "Please select a role";
        if (form.password.length < 8)                      errs.password   = "At least 8 characters";
        if (form.password !== form.confirmPw)              errs.confirmPw  = "Passwords do not match";
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
        <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden"
            style={{ background: "var(--mg-base)" }}>

            <div className="pointer-events-none absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full blur-[130px] opacity-12"
                style={{ background: "radial-gradient(ellipse, rgba(74,78,143,0.30) 0%, transparent 70%)" }} />
            <div className="pointer-events-none absolute bottom-1/3 right-1/4 w-[300px] h-[300px] rounded-full blur-[100px] opacity-10"
                style={{ background: "radial-gradient(ellipse, rgba(107,94,160,0.25) 0%, transparent 70%)" }} />

            <div className="relative z-10 w-full max-w-md">
                <div className="text-center mb-10">
                    <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 220 }}
                        className="inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-4"
                        style={{ background: "linear-gradient(135deg, #4a4e8f, #6b5ea0)", boxShadow: "0 0 24px rgba(74,78,143,0.25)" }}>
                        <Shield className="w-7 h-7 text-white" />
                    </motion.div>
                    <motion.h1 initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
                        className="text-4xl font-bold mg-gradient-text tracking-tight mb-2">Create Account</motion.h1>
                    <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.22 }}
                        className="text-mg-muted text-sm">
                        Already have an account?{" "}
                        <Link href="/login" className="text-mg-cosmic font-semibold hover:text-mg-lavender transition-colors">Sign in</Link>
                    </motion.p>
                </div>

                <motion.form onSubmit={handleSubmit} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }} className="mg-card rounded-2xl p-8 space-y-4">

                    {/* Full Name */}
                    <div>
                        <label className="mg-label block mb-1.5">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mg-dim" />
                            <input value={form.name} onChange={e => handleField("name", e.target.value)}
                                placeholder="Arjun Mehta"
                                className={cn("mg-input pl-9", errors.name && "border-status-danger")} />
                        </div>
                        {errors.name && <p className="text-xs text-status-danger mt-1"><AlertCircle className="inline w-3 h-3 mr-1" />{errors.name}</p>}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="mg-label block mb-1.5">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mg-dim" />
                            <input type="email" value={form.email} onChange={e => handleField("email", e.target.value)}
                                placeholder="arjun@company.in"
                                className={cn("mg-input pl-9", errors.email && "border-status-danger")} />
                        </div>
                        {errors.email && <p className="text-xs text-status-danger mt-1"><AlertCircle className="inline w-3 h-3 mr-1" />{errors.email}</p>}
                    </div>

                    {/* Organisation */}
                    <div>
                        <label className="mg-label block mb-1.5">Organisation</label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mg-dim" />
                            <input value={form.org} onChange={e => handleField("org", e.target.value)}
                                placeholder="TechFlow Pvt. Ltd."
                                className={cn("mg-input pl-9", errors.org && "border-status-danger")} />
                        </div>
                        {errors.org && <p className="text-xs text-status-danger mt-1"><AlertCircle className="inline w-3 h-3 mr-1" />{errors.org}</p>}
                    </div>

                    {/* Role */}
                    <div>
                        <label className="mg-label block mb-1.5">Access Role</label>
                        <div className="relative">
                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mg-dim" />
                            <select value={selectedRole}
                                onChange={e => { setSelectedRole(e.target.value as UserRole | ""); setErrors(err => ({ ...err, role: "" })); }}
                                className={cn("mg-input appearance-none pr-9 cursor-pointer", errors.role && "border-status-danger")}>
                                <option value="">Select your role&hellip;</option>
                                <option value="msme">MSME — Upload &amp; finance trade receivables</option>
                                <option value="lender">Lender — Verify hashes &amp; disburse capital</option>
                                <option value="auditor">Auditor — Surveillance &amp; regulatory oversight</option>
                            </select>
                        </div>
                        {errors.role && <p className="text-xs text-status-danger mt-1"><AlertCircle className="inline w-3 h-3 mr-1" />{errors.role}</p>}
                    </div>

                    {/* Password */}
                    <div>
                        <label className="mg-label block mb-1.5">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mg-dim" />
                            <input type={showPw ? "text" : "password"} value={form.password} onChange={e => handleField("password", e.target.value)}
                                placeholder="Min. 8 characters"
                                className={cn("mg-input pl-9 pr-10", errors.password && "border-status-danger")} />
                            <button type="button" onClick={() => setShowPw(!showPw)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-mg-dim hover:text-mg-muted transition-colors">
                                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {errors.password && <p className="text-xs text-status-danger mt-1"><AlertCircle className="inline w-3 h-3 mr-1" />{errors.password}</p>}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="mg-label block mb-1.5">Confirm Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mg-dim" />
                            <input type={showCPw ? "text" : "password"} value={form.confirmPw} onChange={e => handleField("confirmPw", e.target.value)}
                                placeholder="Repeat your password"
                                className={cn("mg-input pl-9 pr-10", errors.confirmPw && "border-status-danger")} />
                            <button type="button" onClick={() => setShowCPw(!showCPw)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-mg-dim hover:text-mg-muted transition-colors">
                                {showCPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {errors.confirmPw && <p className="text-xs text-status-danger mt-1"><AlertCircle className="inline w-3 h-3 mr-1" />{errors.confirmPw}</p>}
                    </div>

                    <p className="text-xs text-mg-dim pt-1">
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
                </motion.form>
            </div>
        </div>
    );
}
