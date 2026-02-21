"use client";

import { InvoiceUploader } from "@/components/oneflow/InvoiceUploader";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Lock, Zap, Database } from "lucide-react";
import Link from "next/link";

export default function InvoiceUploadPage() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
                <div>
                    <Link 
                        href="/msme/invoices" 
                        className="inline-flex items-center gap-2 text-sm text-mg-muted hover:text-mg-silver transition-colors mb-3 group"
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        Back to Invoices
                    </Link>
                    <h1 className="text-3xl sm:text-4xl font-bold text-mg-silver mb-2">
                        Upload <span className="mg-accent-text">Invoice</span>
                    </h1>
                    <p className="text-sm text-mg-muted max-w-2xl">
                        Secure your invoice on blockchain with cryptographic proof
                    </p>
                </div>
            </motion.div>

            {/* Main Content */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Upload Section - Takes 2 columns */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2"
                >
                    <InvoiceUploader />
                </motion.div>

                {/* Info Cards - 1 column */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4"
                >
                    {/* How it Works */}
                    <div className="mg-card rounded-xl p-5 space-y-4">
                        <h3 className="text-sm font-semibold text-mg-silver uppercase tracking-wide">How It Works</h3>
                        <div className="space-y-3">
                            {[
                                { icon: Shield, text: "Select your PDF invoice (max 10MB)" },
                                { icon: Lock, text: "Hash computed securely in browser" },
                                { icon: Database, text: "Stored on IPFS & Polygon ETH Sepolia" },
                                { icon: Zap, text: "Ready for instant verification" },
                            ].map((step, idx) => (
                                <div key={idx} className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-mg-cosmic/10 border border-mg-cosmic/20 flex items-center justify-center shrink-0">
                                        <step.icon className="w-4 h-4 text-mg-cosmic" />
                                    </div>
                                    <p className="text-xs text-mg-muted leading-relaxed pt-1.5">{step.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Key Features */}
                    <div className="mg-card rounded-xl p-5 space-y-3">
                        <h3 className="text-sm font-semibold text-mg-silver uppercase tracking-wide mb-4">Key Features</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: "Immutable", value: "Blockchain" },
                                { label: "Private", value: "Hash Only" },
                                { label: "Fast", value: "< 30 sec" },
                                { label: "Secure", value: "ETH Sepolia" },
                            ].map(feature => (
                                <div key={feature.label} className="bg-mg-elevated rounded-lg p-3 border border-mg-lavender/10">
                                    <p className="text-[10px] text-mg-dim uppercase tracking-wider mb-1">
                                        {feature.label}
                                    </p>
                                    <p className="text-sm font-semibold text-mg-silver">{feature.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Privacy Note */}
                    <div className="bg-gradient-to-br from-mg-cosmic/10 to-transparent border border-mg-cosmic/20 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <Lock className="w-4 h-4 text-mg-cosmic shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-semibold text-mg-cosmic mb-1">100% Private</p>
                                <p className="text-[11px] text-mg-muted leading-relaxed">
                                    Your document never leaves your device. Only the cryptographic hash is stored.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
