"use client";

import { useAuth } from "@/context/AuthContext";
import { UserRole, mockUsers } from "@/lib/mock/mockUsers";
import { Shield, Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";

const demoAccounts = [
    { email: "john@techflow.io",        role: "msme",    label: "MSME" },
    { email: "sarah@globalfinance.com",  role: "lender",  label: "Lender" },
    { email: "officer@finreg.gov",       role: "auditor", label: "Auditor" },
];

export default function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail]       = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw]     = useState(false);
    const [error, setError]       = useState("");
    const [loading, setLoading]   = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!email.trim() || !password.trim()) {
            setError("Please enter your email and password.");
            return;
        }
        const user = Object.values(mockUsers).find(
            u => u.email.toLowerCase() === email.trim().toLowerCase()
        );
        if (!user) {
            setError("Invalid credentials. Use one of the demo accounts below.");
            return;
        }
        setLoading(true);
        setTimeout(() => login(user.role as UserRole), 1200);
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden"
            style={{ background: "var(--mg-base)" }}>

            <div className="pointer-events-none absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full blur-[130px] opacity-15"
                style={{ background: "radial-gradient(ellipse, rgba(74,78,143,0.30) 0%, transparent 70%)" }} />
            <div className="pointer-events-none absolute bottom-1/3 right-1/4 w-[300px] h-[300px] rounded-full blur-[100px] opacity-10"
                style={{ background: "radial-gradient(ellipse, rgba(107,94,160,0.25) 0%, transparent 70%)" }} />

            <div className="relative z-10 w-full max-w-md">
                <div className="text-center mb-10">
                    <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 220, damping: 22 }}
                        className="inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-6"
                        style={{ background: "linear-gradient(135deg, #4a4e8f, #6b5ea0)", boxShadow: "0 0 24px rgba(74,78,143,0.25)" }}>
                        <Shield className="w-8 h-8 text-white" />
                    </motion.div>
                    <motion.h1 initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
                        className="text-4xl font-bold tracking-tight mb-2 mg-gradient-text">
                        FInovaX
                    </motion.h1>
                    <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.22 }}
                        className="text-mg-muted text-sm">
                        Sign in to your account
                    </motion.p>
                </div>

                <motion.form onSubmit={handleSubmit} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }} className="mg-card rounded-2xl p-8 space-y-5">

                    <div>
                        <label className="mg-label block mb-1.5">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mg-dim" />
                            <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
                                placeholder="you@example.com" className="mg-input pl-9" autoComplete="email" />
                        </div>
                    </div>

                    <div>
                        <label className="mg-label block mb-1.5">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mg-dim" />
                            <input type={showPw ? "text" : "password"} value={password}
                                onChange={e => { setPassword(e.target.value); setError(""); }}
                                placeholder="••••••••" className="mg-input pl-9 pr-10" autoComplete="current-password" />
                            <button type="button" onClick={() => setShowPw(p => !p)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-mg-dim hover:text-mg-muted transition-colors">
                                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 p-3 rounded-xl bg-status-danger/8 border border-status-danger/20 text-sm text-status-danger">
                            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                        </motion.div>
                    )}

                    <button type="submit" disabled={loading}
                        className="mg-btn-primary w-full justify-center gap-2 mt-1">
                        {loading
                            ? <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />Signing in&hellip;</>
                            : <>Sign In <ArrowRight className="w-4 h-4" /></>}
                    </button>

                    <p className="text-center text-sm text-mg-muted">
                        {"Don't have an account? "}
                        <Link href="/register" className="text-mg-cosmic font-semibold hover:text-mg-lavender transition-colors">Create one</Link>
                    </p>
                </motion.form>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                    className="mt-6 mg-card rounded-2xl p-5">
                    <p className="mg-label mb-3 text-center">Demo Accounts (any password)</p>
                    <div className="space-y-2">
                        {demoAccounts.map(a => (
                            <button key={a.role} type="button"
                                onClick={() => { setEmail(a.email); setPassword("demo1234"); setError(""); }}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-mg-elevated border border-mg-lavender/10 hover:border-mg-lavender/25 transition-all group">
                                <span className="text-xs font-mono text-mg-muted group-hover:text-mg-silver transition-colors">{a.email}</span>
                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                    a.role === "msme"    ? "bg-mg-cosmic/10 text-mg-cosmic" :
                                    a.role === "lender"  ? "bg-status-success/10 text-status-success" :
                                    "bg-violet-500/10 text-violet-700"}`}>
                                    {a.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
