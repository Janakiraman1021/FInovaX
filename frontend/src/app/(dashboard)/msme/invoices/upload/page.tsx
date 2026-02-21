"use client";

import { InvoiceUploader } from "@/components/finovax/InvoiceUploader";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function InvoiceUploadPage() {
    return (
        <div className="space-y-6 max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <Link href="/msme/invoices" className="inline-flex items-center gap-2 text-sm text-mg-muted hover:text-mg-silver transition-colors mb-4">
                    <ArrowLeft className="w-4 h-4" /> Back to Invoices
                </Link>
                <p className="mg-label mb-1.5">MSME Portal</p>
                <h1 className="text-3xl font-bold text-mg-silver tracking-tight">Upload <span className="mg-accent-text">Invoice</span></h1>
                <p className="text-sm text-mg-muted mt-1">
                    Upload a PDF invoice and anchor its cryptographic hash on Polygon zkEVM.
                    The document itself stays private — only the hash goes on-chain.
                </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
                <InvoiceUploader />
            </motion.div>

            <div className="mg-card rounded-2xl p-5 space-y-2">
                <p className="mg-label mb-2">How it works</p>
                {[
                    { step: "01", text: "Select your invoice PDF (max 10 MB)." },
                    { step: "02", text: "We compute a SHA-256 hash locally on your browser — the file never leaves your device." },
                    { step: "03", text: "The hash is pinned to IPFS and registered on Polygon zkEVM via a smart contract." },
                    { step: "04", text: "Lenders can verify your invoice instantly using the on-chain hash." },
                ].map(h => (
                    <div key={h.step} className="flex gap-3 items-start">
                        <span className="text-xs font-bold font-mono text-mg-cosmic bg-mg-cosmic/10 px-2 py-0.5 rounded-md shrink-0">{h.step}</span>
                        <p className="text-sm text-mg-muted">{h.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
