"use client";

import { HashVerifier } from "@/components/oneflow/HashVerifier";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

export default function LenderVerifyHash() {
    return (
        <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <p className="mg-label mb-1.5">Lender Console</p>
                <h1 className="text-3xl font-bold text-mg-silver tracking-tight">
                    Verify <span className="mg-accent-text">Invoice Hash</span>
                </h1>
                <p className="text-sm text-mg-muted mt-1">Cryptographically verify invoice authenticity against on-chain records</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <HashVerifier />

                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mg-card rounded-2xl p-6 space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(74,78,143,0.09)", border: "1px solid rgba(74,78,143,0.20)" }}>
                            <ShieldCheck className="w-4 h-4 text-mg-lavender" />
                        </div>
                        <p className="font-semibold text-mg-silver text-sm">How Hash Verification Works</p>
                    </div>

                    {[
                        { step: "01", title: "Invoice Submitted", desc: "MSME uploads invoice; a SHA-256 hash is computed deterministically from the invoice data." },
                        { step: "02", title: "Registered On-Chain", desc: "The hash is anchored to a Polygon smart contract via a blockchain transaction, creating an immutable record." },
                        { step: "03", title: "Verification Request", desc: "You paste the invoice hash here. The tool queries the smart contract to check if the hash was ever registered." },
                        { step: "04", title: "Result Delivered", desc: "A VERIFIED ✓ result proves the invoice is authentic. A FAILED ✗ result indicates tampering or a fraudulent document." },
                    ].map(item => (
                        <div key={item.step} className="flex gap-4">
                            <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: "linear-gradient(135deg, #4a4e8f, #6b5ea0)" }}>
                                {item.step}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-mg-silver">{item.title}</p>
                                <p className="text-xs text-mg-muted mt-0.5">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
