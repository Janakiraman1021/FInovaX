import PublicShell from "@/components/shared/PublicShell";

const sections = [
    {
        title: "1. Acceptance of Terms",
        body: `By accessing or using the OneFlow platform ("Platform"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree, please do not access or use the Platform. These Terms apply to all users, including MSMEs, lenders, auditors, and other visitors.`,
    },
    {
        title: "2. Eligibility",
        body: `You must be at least 18 years of age and legally authorised to enter into binding contracts under applicable law. By using the Platform you represent that you meet these requirements. MSMEs must be registered entities under Indian law. Lenders must hold appropriate RBI-recognised licences.`,
    },
    {
        title: "3. Platform Description",
        body: `OneFlow provides a blockchain-based invoice financing marketplace. The Platform enables MSMEs to upload invoices, lenders to verify and fund invoices via smart contracts, and auditors to maintain a tamper-proof audit trail. OneFlow does not itself provide lending services and is not a Non-Banking Financial Company (NBFC).`,
    },
    {
        title: "4. User Accounts",
        body: `You are responsible for maintaining the confidentiality of your account credentials. You must notify us immediately at security@oneflow.in if you suspect unauthorised access. OneFlow reserves the right to suspend or terminate accounts that violate these Terms or applicable law.`,
    },
    {
        title: "5. Invoice Upload & Blockchain Registration",
        body: `When you upload an invoice, a SHA-256 hash of the document is calculated and optionally registered on the Polygon zkEVM blockchain. The hash is irreversible and publicly verifiable. You warrant that all invoices uploaded are genuine, accurate, and free from any existing financing arrangements with third parties.`,
    },
    {
        title: "6. Prohibited Activities",
        body: `You agree not to: (a) upload fraudulent or duplicate invoices; (b) attempt to reverse-engineer or exploit our smart contracts; (c) impersonate any person or entity; (d) engage in money laundering, terrorist financing, or any other illegal activity; (e) scrape, crawl, or excessively access our APIs without written authorisation.`,
    },
    {
        title: "7. Intellectual Property",
        body: `All content, software, trademarks, and technology on the Platform are owned by OneFlow Technologies Pvt. Ltd. or its licensors. You may not reproduce, distribute, or create derivative works without prior written consent.`,
    },
    {
        title: "8. Limitation of Liability",
        body: `To the fullest extent permitted by law, OneFlow shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform, including but not limited to loss of profits or data. Our aggregate liability to you shall not exceed the fees paid by you in the six months preceding the claim.`,
    },
    {
        title: "9. Governing Law & Dispute Resolution",
        body: `These Terms are governed by the laws of India. Any disputes shall first be referred to mediation; if unresolved within 30 days, disputes shall be referred to arbitration under the Arbitration and Conciliation Act, 1996, with the seat of arbitration in Bengaluru, Karnataka.`,
    },
    {
        title: "10. Changes to Terms",
        body: `OneFlow reserves the right to modify these Terms at any time. Material changes will be notified via email or prominent Platform notice at least 14 days in advance. Continued use of the Platform after the effective date constitutes acceptance of revised Terms.`,
    },
    {
        title: "11. Contact",
        body: `For questions about these Terms, contact us at legal@oneflow.in or write to: OneFlow Technologies Pvt. Ltd., 3rd Floor, Prestige Tech Park, Outer Ring Road, Bengaluru — 560 103, Karnataka, India.`,
    },
];

export default function TermsPage() {
    return (
        <PublicShell>
            <div className="max-w-3xl mx-auto px-8 py-16">
                {/* Header */}
                <div className="mb-10">
                    <span className="mg-pill mb-4 inline-flex">Legal</span>
                    <h1 className="text-4xl font-bold tracking-tight mg-gradient-text mb-3">Terms and Conditions</h1>
                    <p className="text-sm text-mg-muted">
                        Effective date: <strong>1 January 2026</strong> · Last updated: <strong>21 February 2026</strong>
                    </p>
                    <p className="text-sm text-mg-muted mt-3 leading-relaxed">
                        Please read these Terms carefully before using the OneFlow platform. By using our services you
                        acknowledge that you have read, understood, and agree to be bound by these Terms.
                    </p>
                </div>

                {/* TOC */}
                <div className="mg-card rounded-2xl p-6 mb-8">
                    <p className="mg-label mb-3">Table of Contents</p>
                    <ol className="list-decimal list-inside space-y-1">
                        {sections.map(s => (
                            <li key={s.title}>
                                <a href={`#${s.title.replace(/\s+/g, '-').toLowerCase()}`}
                                    className="text-sm text-mg-cosmic hover:text-mg-lavender transition-colors">
                                    {s.title}
                                </a>
                            </li>
                        ))}
                    </ol>
                </div>

                {/* Sections */}
                <div className="space-y-8">
                    {sections.map(s => (
                        <div key={s.title} id={s.title.replace(/\s+/g, '-').toLowerCase()}>
                            <h2 className="text-lg font-bold text-mg-silver mb-3">{s.title}</h2>
                            <div className="mg-divider mb-3" />
                            <p className="text-sm text-mg-muted leading-relaxed">{s.body}</p>
                        </div>
                    ))}
                </div>
            </div>
        </PublicShell>
    );
}
