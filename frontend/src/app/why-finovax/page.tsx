import PublicShell from "@/components/shared/PublicShell";
import { Shield, Zap, Lock, PieChart, GitBranch, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";

const problems = [
    { icon: AlertTriangle, title: "Invoice Fraud",           text: "Double-financing the same invoice across multiple lenders costs the Indian economy ₹300B+ annually." },
    { icon: Lock,          title: "No Transparency",        text: "Lenders can't verify invoice authenticity. MSMEs wait 45–90 days for capital they urgently need." },
    { icon: GitBranch,     title: "Fragmented Audit Trail", text: "Regulators have no real-time visibility. Compliance is manual, slow, and prone to manipulation." },
];

const solutions = [
    { icon: Shield,    step: "01", title: "Immutable Hash on Polygon zkEVM", text: "Every uploaded invoice is SHA-256 hashed and anchored on-chain, making tampering cryptographically impossible." },
    { icon: Lock,      step: "02", title: "IPFS Document Storage",           text: "Sensitive PDFs live on the InterPlanetary File System. Only the hash is public — privacy by design." },
    { icon: PieChart,  step: "03", title: "ML-Driven Risk Underwriting",     text: "Real-time creditworthiness models factor 60+ signals to generate instant financing offers." },
    { icon: Zap,       step: "04", title: "Smart Contract Settlement",       text: "Capital disbursement executes in under 60 seconds via auditable smart contracts — no manual approval." },
    { icon: CheckCircle, step: "05", title: "Tri-Party Audit Architecture", text: "MSME, Lender and Regulator each hold a cryptographically-linked, tamper-proof record of every event." },
];

const comparison = [
    { feature: "Invoice verification",    traditional: "Manual, days",  finovax: "Blockchain hash, instant" },
    { feature: "Fraud detection",         traditional: "Post-facto",    finovax: "Real-time, 99.8% accuracy" },
    { feature: "Capital disbursement",    traditional: "45–90 days",    finovax: "Under 60 seconds" },
    { feature: "Audit trail",             traditional: "Paper / siloed", finovax: "On-chain, immutable" },
    { feature: "Regulator visibility",    traditional: "Quarterly reports", finovax: "Live dashboard" },
    { feature: "Document privacy",        traditional: "Centralised servers", finovax: "IPFS + zero-knowledge" },
];

export default function WhyFInovaXPage() {
    return (
        <PublicShell>
            {/* Hero */}
            <section className="max-w-4xl mx-auto px-8 pt-20 pb-16 text-center">
                <span className="mg-pill mb-5 inline-flex">
                    <span className="w-1.5 h-1.5 rounded-full bg-mg-lavender animate-pulse" />
                    Why FInovaX?
                </span>
                <h1 className="text-5xl font-bold tracking-tight mb-5 mg-gradient-text leading-tight">
                    The Problem with<br />Traditional Invoice Finance
                </h1>
                <p className="text-lg text-mg-muted max-w-2xl mx-auto leading-relaxed">
                    Today's trade finance ecosystem is broken — opaque, slow, and rife with fraud.
                    FInovaX was built to fix it from the ground up.
                </p>
            </section>

            {/* Problems */}
            <section className="bg-white border-y border-mg-lavender/10 py-14 px-8">
                <div className="max-w-4xl mx-auto">
                    <p className="mg-label text-center mb-4">The Problems</p>
                    <h2 className="text-3xl font-bold text-mg-silver text-center mb-10 tracking-tight">What's broken today</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {problems.map(p => (
                            <div key={p.title} className="mg-card rounded-2xl p-6">
                                <div className="w-10 h-10 rounded-xl bg-status-danger/8 border border-status-danger/20 flex items-center justify-center mb-4">
                                    <p.icon className="w-5 h-5 text-status-danger" />
                                </div>
                                <h3 className="font-bold text-mg-silver mb-2">{p.title}</h3>
                                <p className="text-sm text-mg-muted leading-relaxed">{p.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Solutions */}
            <section className="max-w-4xl mx-auto px-8 py-16">
                <p className="mg-label text-center mb-4">Our Solution</p>
                <h2 className="text-3xl font-bold text-mg-silver text-center mb-10 tracking-tight">How FInovaX solves it</h2>
                <div className="space-y-5">
                    {solutions.map(s => (
                        <div key={s.step} className="mg-card rounded-2xl p-6 flex gap-5">
                            <div className="shrink-0">
                                <div className="w-10 h-10 rounded-xl bg-mg-cosmic/10 border border-mg-cosmic/20 flex items-center justify-center">
                                    <s.icon className="w-5 h-5 text-mg-cosmic" />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-mg-dim font-mono">{s.step}</span>
                                    <h3 className="font-bold text-mg-silver">{s.title}</h3>
                                </div>
                                <p className="text-sm text-mg-muted leading-relaxed">{s.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Comparison table */}
            <section className="bg-white border-t border-mg-lavender/10 py-16 px-8">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold text-mg-silver text-center mb-8 tracking-tight">FInovaX vs Traditional Finance</h2>
                    <div className="mg-card rounded-2xl overflow-hidden">
                        <table className="w-full mg-table">
                            <thead>
                                <tr>
                                    <th className="text-left">Feature</th>
                                    <th className="text-center">Traditional</th>
                                    <th className="text-center">FInovaX</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparison.map(c => (
                                    <tr key={c.feature}>
                                        <td className="font-medium">{c.feature}</td>
                                        <td className="text-center text-status-danger text-sm">{c.traditional}</td>
                                        <td className="text-center text-status-success text-sm font-medium">{c.finovax}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="max-w-3xl mx-auto px-8 py-16 text-center">
                <div className="mg-card rounded-3xl p-10">
                    <h2 className="text-2xl font-bold text-mg-silver mb-3 tracking-tight">Ready to get started?</h2>
                    <p className="text-mg-muted text-sm mb-6">Join the future of invoice financing.</p>
                    <Link href="/register" className="mg-btn-primary inline-flex gap-2">
                        Create your account <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>
        </PublicShell>
    );
}
