"use client";

import { motion } from "framer-motion";
import { XCircle } from "lucide-react";
import Link from "next/link";

export default function RejectedPage() {
    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <p className="mg-label mb-1.5">MSME Portal</p>
                <h1 className="text-3xl font-bold text-mg-silver tracking-tight">Rejected <span className="text-status-danger">Invoices</span></h1>
                <p className="text-sm text-mg-muted mt-1">Invoices that were rejected during the verification process</p>
            </motion.div>

            <div className="mg-card rounded-2xl p-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-status-danger/8 border border-status-danger/20 flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-7 h-7 text-status-danger" />
                </div>
                <p className="font-semibold text-mg-silver mb-2">No Rejected Invoices</p>
                <p className="text-sm text-mg-muted max-w-sm mx-auto mb-6">
                    Invoices rejected by lenders due to discrepancies, duplicate detection, or insufficient documentation will appear here.
                </p>
                <Link href="/msme/invoices/upload" className="mg-btn-primary text-sm inline-flex gap-2">
                    <XCircle className="w-4 h-4" /> Upload New Invoice
                </Link>
            </div>

            <div className="mg-card rounded-2xl p-5 space-y-3">
                <p className="mg-label mb-2">Common Rejection Reasons</p>
                {[
                    { title: "Duplicate Invoice",    body: "A matching hash was already registered on-chain. Each invoice can only be financed once." },
                    { title: "Insufficient Details", body: "Missing counterparty information, unclear amounts, or illegible document content." },
                    { title: "Lender Declined",      body: "The lender's underwriting model determined the risk profile didn't meet their criteria." },
                    { title: "Document Mismatch",    body: "The uploaded file hash doesn't match the hash declared in the invoice metadata." },
                ].map(r => (
                    <div key={r.title} className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-status-danger mt-2 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-mg-silver">{r.title}</p>
                            <p className="text-xs text-mg-muted leading-relaxed">{r.body}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
