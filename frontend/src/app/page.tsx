"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { Shield, ArrowRight, Lock, PieChart, Zap, Star, Hexagon, GitBranch } from "lucide-react";
import Link from "next/link";

/* -- Floating Particle ----------------------- */
function Particle({ x, y, size, delay, color }: { x: number; y: number; size: number; delay: number; color: string }) {
    return (
        <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, background: color }}
            animate={{ y: [0, -40, 0], opacity: [0.2, 0.8, 0.2], scale: [1, 1.4, 1] }}
            transition={{ duration: 5 + delay, repeat: Infinity, delay, ease: "easeInOut" }}
        />
    );
}

/* -- Hex Grid ------------------------------- */
function HexGrid() {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="hex" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
                        <polygon points="30,2 56,16 56,36 30,50 4,36 4,16" fill="none" stroke="rgba(167,139,250,0.5)" strokeWidth="0.5" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#hex)" />
            </svg>
        </div>
    );
}

const particles = [
    { x: 10, y: 20, size: 4, delay: 0,   color: "rgba(167,139,250,0.8)" },
    { x: 85, y: 15, size: 3, delay: 1.5, color: "rgba(236,72,153,0.7)"  },
    { x: 60, y: 75, size: 5, delay: 0.8, color: "rgba(6,182,212,0.8)"   },
    { x: 30, y: 55, size: 3, delay: 2.0, color: "rgba(167,139,250,0.6)" },
    { x: 75, y: 40, size: 4, delay: 1.2, color: "rgba(139,92,246,0.7)"  },
    { x: 20, y: 85, size: 3, delay: 0.5, color: "rgba(6,182,212,0.6)"   },
    { x: 92, y: 68, size: 4, delay: 1.8, color: "rgba(236,72,153,0.6)"  },
    { x: 48, y: 30, size: 2, delay: 0.3, color: "rgba(255,255,255,0.8)" },
    { x: 15, y: 45, size: 2, delay: 2.5, color: "rgba(255,255,255,0.6)" },
    { x: 68, y: 88, size: 3, delay: 1.0, color: "rgba(167,139,250,0.5)" },
];

export default function LandingPage() {
    const { isAuthenticated, role } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated && role) router.push(`/${role}`);
    }, [isAuthenticated, role, router]);

    return (
        <div className="min-h-screen bg-galaxy-void text-white overflow-hidden">

            {/* Ambient nebula blobs */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-galaxy-purple/15 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-galaxy-pink/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1.5s" }} />
                <div className="absolute bottom-0 left-0 w-[600px] h-[400px] rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "0.8s", background: "rgba(109,40,217,0.12)" }} />
            </div>

            {/* Nav */}
            <nav className="relative z-10 flex items-center justify-between px-8 py-6">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-galaxy-purple to-galaxy-pink flex items-center justify-center glow-purple">
                            <Shield className="text-white w-5 h-5" />
                        </div>
                        <div className="absolute -inset-1 rounded-xl border border-galaxy-lavender/30 animate-pulse" />
                    </div>
                    <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-galaxy-lavender">
                        FINOVAX
                    </span>
                </div>
                <Link href="/login" className="px-6 py-2.5 rounded-full glass border border-galaxy-lavender/30 text-galaxy-lavender text-sm font-bold hover:bg-galaxy-purple/20 transition-all">
                    Connect Portal
                </Link>
            </nav>

            {/* Hero */}
            <section className="relative z-10 flex flex-col items-center text-center pt-24 pb-40 px-6">
                <div className="absolute inset-0 pointer-events-none">
                    {particles.map((p, i) => <Particle key={i} {...p} />)}
                </div>
                <HexGrid />

                {/* Status pill */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}
                    className="stat-pill mb-10 glow-purple"
                >
                    <span className="w-2 h-2 rounded-full bg-galaxy-lavender animate-ping" />
                    Quantum Ledger Protocol — Active
                </motion.div>

                {/* Orbit icon */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.1 }}
                    className="relative w-28 h-28 flex items-center justify-center mb-14"
                >
                    <div className="absolute w-28 h-28 rounded-full border border-galaxy-lavender/25 orbit-ring" />
                    <div className="absolute w-20 h-20 rounded-full border border-galaxy-pink/20" style={{ animation: "orbitSpin 6s linear infinite reverse" }} />
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-galaxy-purple via-pink-600/60 to-galaxy-cyan flex items-center justify-center glow-purple shadow-galaxy-md rotate-12">
                        <Shield className="text-white w-8 h-8" />
                    </div>
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.88] mb-8 max-w-5xl"
                >
                    The Future of<br />
                    <span className="text-galaxy-gradient">Invoice Integrity.</span>
                </motion.h1>

                {/* Subline */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                    className="text-white/45 text-xl max-w-2xl mx-auto mb-14 font-medium leading-relaxed"
                >
                    FINOVAX deploys hybrid audit architectures across a distributed quantum ledger
                    to eliminate double-financing fraud in institutional supply chains.
                </motion.p>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                    className="flex flex-col sm:flex-row items-center gap-5"
                >
                    <Link href="/login" className="group relative px-10 py-5 rounded-full overflow-hidden font-bold text-lg text-white flex items-center gap-3 transition-all">
                        <span className="absolute inset-0 bg-gradient-to-r from-galaxy-purple via-pink-600/80 to-galaxy-cyan opacity-90 group-hover:opacity-100 transition-opacity" />
                        <span className="absolute inset-0 border border-galaxy-lavender/30 rounded-full" />
                        <span className="relative">Enter Terminal</span>
                        <ArrowRight className="relative group-hover:translate-x-1 transition-transform w-5 h-5" />
                    </Link>
                    <button className="px-10 py-5 rounded-full glass border border-galaxy-lavender/25 text-galaxy-lavender font-bold text-lg hover:bg-galaxy-purple/15 hover:border-galaxy-lavender/50 transition-all">
                        Read Whitepaper
                    </button>
                </motion.div>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                    className="flex items-center gap-12 mt-20"
                >
                    {[
                        { label: "Invoices Secured", value: "94,210+" },
                        { label: "Fraud Blocked",    value: "$2.1B+"  },
                        { label: "Active MSMEs",     value: "12,300+" },
                    ].map((stat) => (
                        <div key={stat.label} className="text-center space-y-1">
                            <div className="text-3xl font-black text-galaxy-gradient">{stat.value}</div>
                            <div className="text-xs text-white/30 uppercase font-bold tracking-widest">{stat.label}</div>
                        </div>
                    ))}
                </motion.div>
            </section>

            <div className="cosmic-divider mx-10 my-2" />

            {/* Features */}
            <section className="relative z-10 py-28 px-6">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                        className="text-center mb-20"
                    >
                        <div className="stat-pill mx-auto mb-6">Core Architecture</div>
                        <h2 className="text-5xl font-black tracking-tighter text-white mb-4">
                            Built for the <span className="text-nebula-gradient">Quantum Age</span>
                        </h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { title: "Immutable Hashing", desc: "Every invoice is cryptographically sealed using SHA-256 before ledger admission — tamper-proof at the quantum level.", icon: Lock, accentFrom: "#7c3aed", accentTo: "#a78bfa", glow: "glow-purple", delay: 0 },
                            { title: "Instant Liquidity",  desc: "Autonomous disbursement protocols triggered on verified audit confirmation, with sub-second finality.",              icon: Zap,  accentFrom: "#ec4899", accentTo: "#f97316", glow: "glow-pink",   delay: 0.15 },
                            { title: "Auditor Oversight",  desc: "Real-time surveillance dashboard for regulatory transparency, fraud detection, and quantum integrity verification.",  icon: PieChart, accentFrom: "#06b6d4", accentTo: "#6366f1", glow: "glow-cyan", delay: 0.3 },
                        ].map((f) => (
                            <motion.div
                                key={f.title}
                                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: f.delay }}
                                className="galaxy-card group relative rounded-3xl p-10 overflow-hidden"
                            >
                                <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-[60px] opacity-0 group-hover:opacity-40 transition-opacity duration-700" style={{ background: f.accentFrom }} />
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 ${f.glow}`} style={{ background: `linear-gradient(135deg, ${f.accentFrom}, ${f.accentTo})` }}>
                                    <f.icon className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">{f.title}</h3>
                                <p className="text-white/40 leading-relaxed font-medium">{f.desc}</p>
                                <div className="mt-8 h-px rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: `linear-gradient(90deg, ${f.accentFrom}, ${f.accentTo}, transparent)` }} />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Tech stack banner */}
            <section className="relative z-10 py-16 px-6">
                <div className="max-w-4xl mx-auto glass-galaxy rounded-3xl p-10 border-animate">
                    <div className="grid grid-cols-3 gap-8 items-center text-center">
                        {[
                            { icon: GitBranch, label: "Polygon zkEVM",  desc: "L2 Settlement" },
                            { icon: Hexagon,   label: "IPFS Pinning",   desc: "Storage Layer" },
                            { icon: Star,      label: "SHA-256 Proofs", desc: "Crypto Binding" },
                        ].map((t) => (
                            <div key={t.label} className="flex flex-col items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-galaxy-purple/20 border border-galaxy-lavender/25 flex items-center justify-center">
                                    <t.icon className="w-6 h-6 text-galaxy-lavender" />
                                </div>
                                <div className="font-bold text-white">{t.label}</div>
                                <div className="text-xs text-white/35 uppercase font-bold tracking-widest">{t.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 py-16 px-6 border-t border-galaxy-lavender/10 text-center">
                <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-galaxy-purple to-galaxy-pink flex items-center justify-center glow-purple">
                        <Shield className="text-white w-4 h-4" />
                    </div>
                    <span className="text-xl font-black tracking-tighter text-galaxy-gradient">FINOVAX</span>
                </div>
                <p className="text-white/20 text-xs font-bold uppercase tracking-[0.35em]">
                    &copy; 2025 FINOVAX LABS • MIDNIGHT GALAXY PROTOCOL
                </p>
            </footer>
        </div>
    );
}
