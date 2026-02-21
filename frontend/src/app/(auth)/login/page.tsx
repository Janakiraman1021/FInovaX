"use client";

import { useAuth } from "@/context/AuthContext";
import {
    Shield, Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle,
    Layers, Cpu, FileCheck, ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";

const DEMO_PASSWORD = "Password123!";

const demoAccounts = [
    { email: "msme@fintrust.com",    password: DEMO_PASSWORD, role: "msme",    label: "MSME" },
    { email: "lenderA@fintrust.com", password: DEMO_PASSWORD, role: "lender",  label: "Lender" },
    { email: "auditor@fintrust.com", password: DEMO_PASSWORD, role: "auditor", label: "Auditor" },
];

const features = [
    {
        icon: Layers,
        title: "On-chain Invoice Registry",
        desc: "Every invoice hash is immutably anchored to the blockchain for tamper-proof provenance.",
    },
    {
        icon: Cpu,
        title: "Automated Risk Scoring",
        desc: "AI-assisted credit models surface real-time risk signals across your receivables portfolio.",
    },
    {
        icon: FileCheck,
        title: "Regulatory Audit Trail",
        desc: "Full event history with cryptographic proofs satisfies RBI & SEBI compliance requirements.",
    },
];

export default function LoginPage() {
    const { loginWithCredentials } = useAuth();
    const [email, setEmail]       = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw]     = useState(false);
    const [error, setError]       = useState("");
    const [loading, setLoading]   = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!email.trim() || !password.trim()) {
            setError("Please enter your email and password.");
            return;
        }
        setLoading(true);
        try {
            await loginWithCredentials(email.trim(), password);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Invalid credentials. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex" style={{ background: "var(--mg-base)" }}>

            {/* ── Left brand panel ── */}
            <motion.aside
                initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className="hidden lg:flex lg:w-[46%] xl:w-[42%] flex-col justify-between relative overflow-hidden"
                style={{
                    background: "linear-gradient(145deg, #1a1640 0%, #2d2660 40%, #3d306e 70%, #4a3880 100%)",
                }}>

                {/* grid overlay */}
                <div className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
                        backgroundSize: "30px 30px",
                    }} />

                {/* glow blobs */}
                <div className="absolute top-1/4 -left-16 w-72 h-72 rounded-full blur-[120px]"
                    style={{ background: "rgba(107,94,160,0.30)" }} />
                <div className="absolute bottom-1/4 right-0 w-56 h-56 rounded-full blur-[100px]"
                    style={{ background: "rgba(74,78,143,0.25)" }} />

                {/* top logo */}
                <div className="relative z-10 pt-10 px-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }}>
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-white font-bold text-xl tracking-tight">OneFlow</span>
                    </div>
                </div>

                {/* centre copy */}
                <div className="relative z-10 px-10 py-6 flex-1 flex flex-col justify-center">
                    <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}>
                        <p className="text-xs font-bold uppercase tracking-widest mb-4"
                            style={{ color: "rgba(167,152,255,0.8)" }}>
                            Blockchain-Powered Trade Finance
                        </p>
                        <h2 className="text-3xl xl:text-4xl font-bold leading-snug text-white mb-4">
                            Finance your receivables<br />
                            <span style={{ color: "#b8a8ff" }}>with full transparency.</span>
                        </h2>
                        <p className="text-sm leading-relaxed mb-10" style={{ color: "rgba(203,196,255,0.75)" }}>
                            OneFlow bridges MSMEs, lenders and regulators on a single verifiable ledger — turning unpaid invoices into instant liquidity.
                        </p>
                    </motion.div>

                    <div className="space-y-5">
                        {features.map((f, i) => (
                            <motion.div key={f.title}
                                initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.35 + i * 0.1 }}
                                className="flex items-start gap-4">
                                <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-0.5"
                                    style={{ background: "rgba(167,152,255,0.15)", border: "1px solid rgba(167,152,255,0.22)" }}>
                                    <f.icon className="w-4 h-4" style={{ color: "#c4b5ff" }} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white mb-0.5">{f.title}</p>
                                    <p className="text-xs leading-relaxed" style={{ color: "rgba(203,196,255,0.65)" }}>{f.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* bottom tagline */}
                <div className="relative z-10 pb-8 px-10">
                    <div className="h-px mb-6" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)" }} />
                    <p className="text-xs" style={{ color: "rgba(203,196,255,0.45)" }}>
                        &copy; {new Date().getFullYear()} OneFlow. All rights reserved.
                    </p>
                </div>
            </motion.aside>

            {/* ── Right form panel ── */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative overflow-y-auto">

                {/* subtle background blobs */}
                <div className="pointer-events-none absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full blur-[120px] opacity-20"
                    style={{ background: "radial-gradient(ellipse, rgba(74,78,143,0.25) 0%, transparent 70%)" }} />

                <motion.div
                    initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15, duration: 0.5 }}
                    className="relative z-10 w-full max-w-[420px]">

                    {/* mobile logo */}
                    <div className="lg:hidden flex items-center gap-2 mb-8">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: "linear-gradient(135deg, #4a4e8f, #6b5ea0)" }}>
                            <Shield className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-lg mg-gradient-text">OneFlow</span>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-mg-silver tracking-tight mb-1">Welcome back</h1>
                        <p className="text-sm text-mg-muted">
                            Sign in to your account or{" "}
                            <Link href="/register" className="text-mg-cosmic font-semibold hover:text-mg-lavender transition-colors">
                                create one
                            </Link>
                        </p>
                    </div>

                    {/* form card */}
                    <form onSubmit={handleSubmit} className="mg-card rounded-2xl p-7 space-y-5">

                        <div>
                            <label className="mg-label block mb-1.5">Email Address</label>
                            <div className="relative">
                                {/* <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mg-dim" /> */}
                                <input type="email" value={email}
                                    onChange={e => { setEmail(e.target.value); setError(""); }}
                                    placeholder="you@example.com"
                                    className="mg-input pl-9" autoComplete="email" />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="mg-label">Password</label>
                                <button type="button" className="text-[11px] text-mg-cosmic hover:text-mg-lavender font-medium transition-colors">
                                    Forgot password?
                                </button>
                            </div>
                            <div className="relative">
                                {/* <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mg-dim" /> */}
                                <input type={showPw ? "text" : "password"} value={password}
                                    onChange={e => { setPassword(e.target.value); setError(""); }}
                                    placeholder="••••••••"
                                    className="mg-input pl-9 pr-10" autoComplete="current-password" />
                                <button type="button" onClick={() => setShowPw(p => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-mg-dim hover:text-mg-muted transition-colors">
                                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 p-3 rounded-xl text-sm text-status-danger"
                                style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.18)" }}>
                                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                            </motion.div>
                        )}

                        <button type="submit" disabled={loading} className="mg-btn-primary w-full justify-center gap-2">
                            {loading
                                ? <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />Signing in&hellip;</>
                                : <>Sign In <ArrowRight className="w-4 h-4" /></>}
                        </button>
                    </form>

                    {/* demo accounts */}
                    <div className="mt-5 mg-card rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="h-px flex-1" style={{ background: "rgba(74,78,143,0.12)" }} />
                            <p className="mg-label text-center whitespace-nowrap">Demo Accounts — password: Password123!</p>
                            <div className="h-px flex-1" style={{ background: "rgba(74,78,143,0.12)" }} />
                        </div>
                        <div className="space-y-2">
                            {demoAccounts.map(a => (
                                <button key={a.role} type="button"
                                    onClick={() => { setEmail(a.email); setPassword(a.password); setError(""); }}
                                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group"
                                    style={{
                                        background: "var(--mg-elevated)",
                                        border: "1px solid rgba(74,78,143,0.10)",
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(74,78,143,0.25)")}
                                    onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(74,78,143,0.10)")}>
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-bold ${
                                            a.role === "msme"    ? "bg-mg-cosmic/10 text-mg-cosmic" :
                                            a.role === "lender"  ? "bg-status-success/10 text-status-success" :
                                            "bg-violet-500/10 text-violet-600"}`}>
                                            {a.label[0]}
                                        </div>
                                        <span className="text-xs font-mono text-mg-muted group-hover:text-mg-silver transition-colors">{a.email}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                            a.role === "msme"    ? "bg-mg-cosmic/10 text-mg-cosmic" :
                                            a.role === "lender"  ? "bg-status-success/10 text-status-success" :
                                            "bg-violet-500/10 text-violet-600"}`}>
                                            {a.label}
                                        </span>
                                        <ChevronRight className="w-3 h-3 text-mg-dim opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
