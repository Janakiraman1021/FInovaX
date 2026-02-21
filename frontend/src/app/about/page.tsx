import PublicShell from "@/components/shared/PublicShell";
import { Shield, Users, Globe, Award, Zap, Lock, ShieldCheck, Building2, Server, GitBranch } from "lucide-react";

const team = [
    { name: "Arjun Mehta",    role: "CEO & Co-founder",    bg: "#4a4e8f" },
    { name: "Priya Sharma",   role: "CTO & Co-founder",    bg: "#6b5ea0" },
    { name: "Rohan Das",      role: "Head of Blockchain",  bg: "#059669" },
    { name: "Aisha Patel",    role: "Head of Compliance",  bg: "#4f46e5" },
];

const milestones = [
    { year: "2023", text: "OneFlow founded in Bengaluru with seed funding of ₹4.5 Cr." },
    { year: "2024", text: "Launched ETH Sepolia mainnet integration; onboarded 200+ MSMEs." },
    { year: "2025", text: "Crossed ₹2B+ financed volume; RBI Sandbox approval received." },
    { year: "2026", text: "Series A raise of ₹40 Cr; expanding to Southeast Asia." },
];

export default function AboutPage() {
    return (
        <PublicShell>
            {/* ── Hero ── */}
            <section className="max-w-4xl mx-auto px-8 pt-20 pb-16 text-center">
                <span className="mg-pill mb-5 inline-flex">
                    <span className="w-1.5 h-1.5 rounded-full bg-mg-lavender animate-pulse" />
                    About OneFlow
                </span>
                <h1 className="text-5xl font-bold tracking-tight mb-5 mg-gradient-text leading-tight">
                    Redefining Trust in<br />Trade Finance
                </h1>
                <p className="text-lg text-mg-muted max-w-2xl mx-auto leading-relaxed">
                    OneFlow is a blockchain-native invoice financing platform connecting Indian MSMEs with institutional lenders
                    through an immutable, tamper-proof audit architecture built on Polygon ETH Sepolia.
                </p>
            </section>

            {/* ── Mission strip ── */}
            <section className="bg-white border-y border-mg-lavender/10 py-14 px-8">
                <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8 text-center">
                    {[
                        { icon: Shield,  title: "Our Mission",  text: "Eliminate invoice fraud and financing friction for 63 million Indian MSMEs." },
                        { icon: Globe,   title: "Our Vision",   text: "A world where every MSME has transparent, instant access to working capital." },
                        { icon: Award,   title: "Our Values",   text: "Transparency, security, and financial inclusion — not just buzzwords but our core operating principles." },
                    ].map(v => (
                        <div key={v.title} className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-mg-surface flex items-center justify-center border border-mg-lavender/12">
                                <v.icon className="w-6 h-6 text-mg-cosmic" />
                            </div>
                            <h3 className="font-bold text-mg-silver">{v.title}</h3>
                            <p className="text-sm text-mg-muted leading-relaxed">{v.text}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Stats ── */}
            <section className="max-w-4xl mx-auto px-8 py-16">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    {[
                        { value: "₹2.4B+", label: "Financed" },
                        { value: "14,800", label: "Invoices on-chain" },
                        { value: "800+",   label: "MSMEs onboarded" },
                        { value: "50+",    label: "Lender partners" },
                    ].map(s => (
                        <div key={s.label} className="mg-card rounded-2xl p-6 text-center">
                            <div className="text-3xl font-bold mg-accent-text mb-1">{s.value}</div>
                            <div className="mg-label">{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Timeline ── */}
            <section className="max-w-3xl mx-auto px-8 py-10 pb-16">
                <h2 className="text-2xl font-bold text-mg-silver mb-8 text-center tracking-tight">Our Journey</h2>
                <div className="relative">
                    <div className="absolute left-16 top-0 bottom-0 w-px bg-mg-lavender/15" />
                    <div className="space-y-8">
                        {milestones.map(m => (
                            <div key={m.year} className="flex items-start gap-6 relative">
                                <div className="w-12 shrink-0 text-right">
                                    <span className="text-xs font-bold text-mg-cosmic">{m.year}</span>
                                </div>
                                <div className="w-2 h-2 rounded-full bg-mg-lavender mt-1.5 shrink-0 relative z-10" />
                                <p className="text-sm text-mg-muted leading-relaxed">{m.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Interoperability Architecture ── */}
            <section className="max-w-4xl mx-auto px-8 py-16">
                <div className="text-center mb-10">
                    <span className="mg-pill mb-4 inline-flex">
                        <ShieldCheck className="w-3 h-3 text-mg-lavender" />
                        Architecture
                    </span>
                    <h2 className="text-2xl font-bold text-mg-silver tracking-tight mb-3">
                        OneFlow <span className="mg-accent-text">Trust Layer</span>
                    </h2>
                    <p className="text-sm text-mg-muted max-w-xl mx-auto leading-relaxed">
                        Verified via OneFlow Trust Layer — ERP &amp; Core Banking compatible. Designed to integrate with
                        existing enterprise infrastructure without replacing it.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                    {[
                        {
                            icon: Server,
                            title: "ERP Integration",
                            desc: "SAP, Oracle, Tally-compatible adapters ingest invoice data directly. No manual re-entry.",
                            from: "#4a4e8f", to: "#6b5ea0",
                        },
                        {
                            icon: Building2,
                            title: "Core Banking",
                            desc: "Plugs into CBS APIs (Finacle, Temenos, BankingCloud) for real-time disbursement and reconciliation.",
                            from: "#059669", to: "#10b981",
                        },
                        {
                            icon: GitBranch,
                            title: "GST & E-Invoice",
                            desc: "Validates invoice authenticity against GSTIN records and NIC e-invoice portal before on-chain anchoring.",
                            from: "#6d28d9", to: "#4f46e5",
                        },
                    ].map(item => (
                        <div key={item.title} className="mg-card rounded-2xl p-6">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                                style={{ background: `linear-gradient(135deg, ${item.from}, ${item.to})`, boxShadow: `0 0 14px ${item.from}40` }}>
                                <item.icon className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="font-bold text-mg-silver text-sm mb-2">{item.title}</h3>
                            <p className="text-xs text-mg-muted leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
                <div className="p-4 rounded-xl border flex items-center gap-3"
                    style={{ background: "rgba(79,70,229,0.05)", borderColor: "rgba(79,70,229,0.18)" }}>
                    <ShieldCheck className="w-5 h-5 text-mg-cosmic shrink-0" />
                    <p className="text-xs text-mg-muted leading-relaxed">
                        <span className="font-semibold text-mg-silver">Verified via OneFlow Trust Layer</span>
                        {" "}(ERP &amp; Core Banking compatible) — these are backend integration points, not user-configuration screens.
                        Institutions connect via secure API adapters; no data is exposed to the UI.
                    </p>
                </div>
            </section>

            {/* ── Team ── */}
            <section className="bg-white border-t border-mg-lavender/10 py-16 px-8">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold text-mg-silver mb-8 text-center tracking-tight">Leadership Team</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                        {team.map(t => (
                            <div key={t.name} className="mg-card rounded-2xl p-5 text-center">
                                <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-white font-bold text-xl"
                                    style={{ background: `linear-gradient(135deg, ${t.bg}, ${t.bg}99)` }}>
                                    {t.name[0]}
                                </div>
                                <p className="font-semibold text-sm text-mg-silver">{t.name}</p>
                                <p className="text-xs text-mg-muted mt-0.5">{t.role}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </PublicShell>
    );
}
