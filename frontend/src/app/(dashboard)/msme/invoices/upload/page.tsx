"use client";

import { InvoiceUploader } from "@/components/oneflow/InvoiceUploader";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const fadeUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
};

export default function InvoiceUploadPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-mg-card via-mg-elevated to-mg-card">
            {/* Navigation */}
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="mb-12"
            >
                <Link href="/msme/invoices" className="inline-flex items-center gap-2 text-xs text-mg-muted hover:text-mg-silver transition-colors mb-6 group">
                    <span className="transition-transform group-hover:-translate-x-1">←</span> Back
                </Link>
            </motion.div>

            {/* Header Section */}
            <motion.div 
                variants={fadeUp}
                initial="initial"
                animate="animate"
                transition={{ duration: 0.6 }}
                className="mb-16"
            >
                <p className="text-xs tracking-widest text-mg-cosmic uppercase font-semibold mb-3">Invoice Ledger</p>
                <h1 className="text-5xl lg:text-6xl font-black text-mg-silver mb-6 leading-tight">
                    Anchor Your <br />
                    <span className="bg-gradient-to-r from-mg-cosmic via-mg-lavender to-mg-cosmic bg-clip-text text-transparent">Invoice</span>
                </h1>
                <p className="text-base text-mg-muted max-w-3xl leading-relaxed">
                    Upload your PDF invoice and cryptographically seal it on the blockchain. Your document stays private while proof of authenticity lives forever on Polygon zkEVM.
                </p>
            </motion.div>

            {/* Main Grid */}
            <div className="grid lg:grid-cols-12 gap-8 mb-12">
                {/* Left - Form */}
                <motion.div 
                    variants={fadeUp}
                    initial="initial"
                    animate="animate"
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="lg:col-span-7"
                >
                    <InvoiceUploader />
                </motion.div>

                {/* Right - Info Sections */}
                <motion.div 
                    variants={fadeUp}
                    initial="initial"
                    animate="animate"
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="lg:col-span-5 space-y-6"
                >
                    {/* Process Flow */}
                    <div className="space-y-0 border-l-2 border-mg-lavender/20 pl-6">
                        {[
                            { num: "01", title: "Upload PDF", desc: "Select your invoice. Max 10 MB." },
                            { num: "02", title: "Compute Hash", desc: "SHA-256 generated in your browser." },
                            { num: "03", title: "Store Proof", desc: "Hash anchored to IPFS & zkEVM." },
                            { num: "04", title: "Verify Later", desc: "Lenders verify instantly on-chain." },
                        ].map((item, idx) => (
                            <motion.div 
                                key={item.num}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + idx * 0.08 }}
                                className="pb-8 last:pb-0 relative"
                            >
                                <div className="absolute -left-[34px] top-0 w-6 h-6 rounded-full bg-mg-cosmic text-white flex items-center justify-center text-[10px] font-bold">
                                    ✓
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-mg-cosmic uppercase tracking-wide">{item.num}</p>
                                    <p className="font-semibold text-mg-silver">{item.title}</p>
                                    <p className="text-xs text-mg-dim">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-2 gap-3 pt-4">
                        {[
                            { label: "Immutable", value: "On-Chain" },
                            { label: "Private", value: "Hash Only" },
                            { label: "Fast", value: "&lt;30s" },
                            { label: "Cheap", value: "zkEVM" },
                        ].map(feat => (
                            <div key={feat.label} className="p-4 rounded-xl border border-mg-lavender/15 bg-mg-card/50 backdrop-blur-sm hover:border-mg-lavender/30 transition-colors">
                                <p className="text-[10px] text-mg-dim uppercase tracking-wider mb-1">{feat.label}</p>
                                <p className="font-semibold text-mg-silver text-sm">{feat.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Security Highlight */}
                    <div className="p-6 rounded-xl border-l-4 border-mg-cosmic bg-gradient-to-br from-mg-cosmic/5 to-transparent">
                        <p className="text-xs uppercase tracking-widest font-semibold text-mg-cosmic mb-2">Privacy First</p>
                        <p className="text-xs text-mg-muted leading-relaxed">
                            Your document never touches our servers. Hashing happens client-side. Only the cryptographic proof lives on the blockchain.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
