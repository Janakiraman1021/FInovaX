"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { Shield, ArrowRight, Lock, PieChart, Zap, GitBranch, CheckCircle } from "lucide-react";
import Link from "next/link";

const features = [
    { icon: Shield,    title: "Blockchain Verification",  desc: "Every invoice is hashed and sealed on Polygon zkEVM — tamper-proof by design."     },
    { icon: Lock,      title: "Zero-Knowledge Privacy",   desc: "IPFS-stored documents with cryptographic proofs protect sensitive trade data."       },
    { icon: PieChart,  title: "Automated Underwriting",   desc: "ML-driven risk models assess creditworthiness in real-time, enabling instant offer."  },
    { icon: Zap,       title: "Instant Disbursement",     desc: "Smart contracts settle verified invoices in under 60 seconds, no manual approval."   },
    { icon: GitBranch, title: "Tri-Party Audit Trail",    desc: "MSME, Lender and Regulator each hold a cryptographically-linked record of every event."},
    { icon: CheckCircle, title: "Regulatory Compliance",  desc: "Designed around RBI and SEBI guidelines with full KYC/AML controls built in."        },
];

const stats = [
    { value: "₹2.4B+", label: "Financed to date" },
    { value: "14,800", label: "Invoices on-chain" },
    { value: "99.8%",  label: "Fraud detection rate" },
    { value: "<60s",   label: "Settlement time" },
];

export default function LandingPage() {
    const { isAuthenticated, role } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated && role) router.push(`/${role}`);
    }, [isAuthenticated, role, router]);

    return (
        <div className="min-h-screen text-mg-silver overflow-hidden" style={{ background: "var(--mg-base)" }}>
            {/* ── Nav bar ── */}
            <header className="mg-navbar sticky top-0 z-50 h-14 px-8 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #4a4e8f, #a490c2)", boxShadow: "0 0 12px rgba(74,78,143,0.40)" }}>
                        <Shield className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="font-bold text-mg-silver tracking-tight">
                        Fino<span className="text-mg-lavender">vaX</span>
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/login" className="text-sm font-medium text-mg-muted hover:text-mg-silver transition-colors">Sign in</Link>
                    <Link href="/login" className="mg-btn-primary text-sm py-2 px-4 rounded-lg">
                        Get Started
                    </Link>
                </div>
            </header>

            {/* ── Hero ── */}
            <section className="relative pt-28 pb-20 px-8 text-center max-w-5xl mx-auto">
                {/* Ambient glow behind hero */}
                <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px] opacity-25"
                    style={{ background: "radial-gradient(ellipse, rgba(74,78,143,0.50) 0%, transparent 70%)" }} />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55 }}
                    className="relative"
                >
                    <span className="mg-pill mb-6 inline-flex">
                        <span className="w-1.5 h-1.5 rounded-full bg-mg-lavender animate-pulse" />
                        Built on Polygon zkEVM · IPFS · Smart Contracts
                    </span>

                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] mb-6 text-mg-silver">
                        Invoice Finance<br />
                        <span className="mg-gradient-text">Reimagined.</span>
                    </h1>

                    <p className="text-lg text-mg-muted max-w-2xl mx-auto mb-10 leading-relaxed">
                        FInovaX connects MSMEs and lenders on a trustless blockchain layer —
                        reducing fraud, accelerating liquidity, and bringing full transparency to trade finance.
                    </p>

                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        <Link href="/login" className="mg-btn-primary gap-2 text-sm">
                            Launch App
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link href="#features"
                            className="mg-btn-ghost border border-mg-lavender/20 text-mg-muted hover:text-mg-silver text-sm px-5 py-2.5 rounded-lg">
                            Learn more
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* ── Stats strip ── */}
            <section className="max-w-5xl mx-auto px-8 pb-20">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-4"
                >
                    {stats.map((s, i) => (
                        <div key={s.label}
                            className="mg-card rounded-2xl p-6 text-center"
                            style={{ animationDelay: `${i * 80}ms` }}>
                            <div className="text-3xl font-bold mg-accent-text mb-1">{s.value}</div>
                            <div className="mg-label">{s.label}</div>
                        </div>
                    ))}
                </motion.div>
            </section>

            {/* ── Divider ── */}
            <div className="max-w-5xl mx-auto px-8">
                <div className="mg-divider" />
            </div>

            {/* ── Features ── */}
            <section id="features" className="max-w-5xl mx-auto px-8 py-20">
                <div className="text-center mb-14">
                    <span className="mg-label block mb-3">Platform Capabilities</span>
                    <h2 className="text-3xl font-bold text-mg-silver tracking-tight">
                        Everything you need for <span className="mg-accent-text">secure trade finance</span>
                    </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {features.map((f, i) => (
                        <motion.div
                            key={f.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.08 }}
                            className="mg-card rounded-2xl p-6 group"
                        >
                            <div className="w-10 h-10 rounded-xl mb-4 flex items-center justify-center"
                                style={{ background: "rgba(74,78,143,0.25)", border: "1px solid rgba(164,144,194,0.18)" }}>
                                <f.icon className="w-5 h-5 text-mg-lavender" />
                            </div>
                            <h3 className="font-semibold text-mg-silver mb-2">{f.title}</h3>
                            <p className="text-sm text-mg-muted leading-relaxed">{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="max-w-3xl mx-auto px-8 py-16 text-center">
                <div className="mg-card rounded-3xl p-12 relative overflow-hidden">
                    <div className="pointer-events-none absolute inset-0 rounded-3xl"
                        style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(74,78,143,0.18) 0%, transparent 70%)" }} />
                    <div className="relative">
                        <h2 className="text-3xl font-bold text-mg-silver mb-4 tracking-tight">
                            Ready to transform your receivables?
                        </h2>
                        <p className="text-mg-muted mb-8 text-sm">Join 800+ MSMEs and 50+ lenders already on the FInovaX network.</p>
                        <Link href="/login" className="mg-btn-primary text-sm inline-flex gap-2">
                            Start for Free
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="border-t border-mg-lavender/10 py-8 px-8 text-center">
                <p className="text-xs text-mg-dim">
                    © 2026 FInovaX · Built on <span className="text-mg-lavender">Polygon zkEVM</span> · All rights reserved
                </p>
            </footer>
        </div>
    );
}
