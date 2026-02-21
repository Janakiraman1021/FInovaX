import PublicShell from "@/components/shared/PublicShell";

const sections = [
    {
        title: "1. Information We Collect",
        body: `We collect information you provide directly: name, email address, organisation name, and role. When you upload invoices we compute and store SHA-256 hashes but never store raw invoice PDFs on our servers (documents are encrypted and stored via IPFS). We also automatically collect logs, IP addresses, and usage analytics for security and performance monitoring.`,
    },
    {
        title: "2. How We Use Your Information",
        body: `Your information is used to: (a) provide and improve our services; (b) authenticate your identity and prevent fraud; (c) register invoice hashes on the blockchain; (d) communicate service updates, security alerts, and product news; (e) comply with legal and regulatory obligations under Indian law including KYC/AML requirements.`,
    },
    {
        title: "3. Blockchain & On-Chain Data",
        body: `Invoice hashes registered on Polygon zkEVM are public and immutable by design. Once written to the blockchain, they cannot be deleted. We do not store personally identifiable information on-chain — only cryptographic hashes and transaction metadata.`,
    },
    {
        title: "4. Data Sharing",
        body: `We do not sell your personal data. We share information with: (a) lenders/auditors on the Platform for invoice verification, as required to deliver our service; (b) cloud infrastructure providers (AWS, Cloudflare) under data processing agreements; (c) law enforcement or regulatory bodies when required by law; (d) acquirers in the event of a merger or acquisition, with appropriate protections.`,
    },
    {
        title: "5. Data Security",
        body: `We employ industry-standard security measures including TLS 1.3 encryption in transit, AES-256 encryption at rest, and role-based access controls. However, no system is completely secure. If a breach occurs that affects your data we will notify you within 72 hours as required under applicable law.`,
    },
    {
        title: "6. Data Retention",
        body: `Account data is retained for the duration of your account plus 7 years for compliance purposes. Invoice hashes on the blockchain are permanent. You may request deletion of your account data; we will process requests within 30 days subject to legal retention requirements.`,
    },
    {
        title: "7. Your Rights",
        body: `Under India's Digital Personal Data Protection Act, 2023, you have the right to: access your personal data; correct inaccuracies; request erasure (where permissible); nominate a representative. Submit requests to privacy@oneflow.in. We will respond within 30 days.`,
    },
    {
        title: "8. Cookies",
        body: `We use essential cookies for authentication and session management. Analytics cookies (privacy-preserving, self-hosted) help us improve the Platform. You can disable non-essential cookies via your browser settings; this may affect functionality.`,
    },
    {
        title: "9. Third-Party Links",
        body: `Our Platform may contain links to third-party websites. We are not responsible for their privacy practices and encourage you to review their policies before sharing any information.`,
    },
    {
        title: "10. Children's Privacy",
        body: `The Platform is not directed to individuals under 18 years of age. We do not knowingly collect personal data from minors. If you believe a minor has provided us data, please contact us immediately.`,
    },
    {
        title: "11. Changes to This Policy",
        body: `We may update this Privacy Policy periodically. Material changes will be communicated via email or an in-Platform notice at least 14 days before they take effect.`,
    },
    {
        title: "12. Contact Us",
        body: `Data Protection Officer: dpo@oneflow.in\nOneFlow Technologies Pvt. Ltd., 3rd Floor, Prestige Tech Park, Outer Ring Road, Bengaluru — 560 103, Karnataka, India.\nGrievance Officer (DPDPA): grievance@oneflow.in`,
    },
];

export default function PrivacyPolicyPage() {
    return (
        <PublicShell>
            <div className="max-w-3xl mx-auto px-8 py-16">
                <div className="mb-10">
                    <span className="mg-pill mb-4 inline-flex">Legal</span>
                    <h1 className="text-4xl font-bold tracking-tight mg-gradient-text mb-3">Privacy Policy</h1>
                    <p className="text-sm text-mg-muted">
                        Effective date: <strong>1 January 2026</strong> · Last updated: <strong>21 February 2026</strong>
                    </p>
                    <p className="text-sm text-mg-muted mt-3 leading-relaxed">
                        OneFlow Technologies Pvt. Ltd. ("OneFlow", "we", "us") is committed to protecting your personal data.
                        This Privacy Policy explains how we collect, use, and protect your information when you use our Platform.
                    </p>
                </div>

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

                <div className="space-y-8">
                    {sections.map(s => (
                        <div key={s.title} id={s.title.replace(/\s+/g, '-').toLowerCase()}>
                            <h2 className="text-lg font-bold text-mg-silver mb-3">{s.title}</h2>
                            <div className="mg-divider mb-3" />
                            <p className="text-sm text-mg-muted leading-relaxed whitespace-pre-line">{s.body}</p>
                        </div>
                    ))}
                </div>
            </div>
        </PublicShell>
    );
}
