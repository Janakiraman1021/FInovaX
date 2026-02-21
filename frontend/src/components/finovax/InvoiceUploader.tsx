"use client";

import { useState } from "react";
import { Upload, FileText, CheckCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, generateSHA256 } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "sonner";

export const InvoiceUploader = () => {
    const [file, setFile]           = useState<File | null>(null);
    const [isUploading, setUploading] = useState(false);
    const [progress, setProgress]   = useState(0);
    const [isDragging, setDragging] = useState(false);

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setProgress(10);
        try {
            const content = `${file.name}-${file.size}-${Date.now()}`;
            const hash    = await generateSHA256(content);
            setProgress(40);
            toast.info("Generating cryptographic hash...");

            await api.invoices.upload({
                id: `INV-${Math.floor(Math.random() * 1000)}`,
                borrower: "TechFlow MSME",
                amount: Math.floor(Math.random() * 50000) + 1000,
                invoiceHash: hash,
                description: "Equipment Purchase",
            });

            setProgress(100);
            toast.success("Invoice sealed on ledger!", { description: `SHA-256: ${hash.slice(0, 12)}...` });
            setTimeout(() => { setUploading(false); setFile(null); setProgress(0); }, 1200);
        } catch {
            toast.error("Upload failed.");
            setUploading(false);
        }
    };

    return (
        <div className="galaxy-card rounded-3xl p-8 shadow-galaxy-md relative overflow-hidden">
            {/* Top-right glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[60px] opacity-30 pointer-events-none" style={{ background: "#7c3aed" }} />

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-galaxy-purple to-galaxy-cyan flex items-center justify-center glow-purple">
                    <Upload className="text-white w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Invoice Porting</h2>
                    <p className="text-white/35 text-xs font-medium">Upload invoices for real-time ledger verification</p>
                </div>
            </div>

            {/* Drop zone */}
            <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
                className={cn(
                    "border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300",
                    isDragging    ? "border-galaxy-lavender/70 bg-galaxy-purple/15 scale-[1.01]" :
                    file          ? "border-galaxy-lavender/50 bg-galaxy-purple/08" :
                                    "border-galaxy-lavender/20 hover:border-galaxy-lavender/40 hover:bg-galaxy-purple/05"
                )}
            >
                <AnimatePresence mode="wait">
                    {!file ? (
                        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-2xl bg-galaxy-purple/10 border border-galaxy-lavender/20 flex items-center justify-center mb-5">
                                <FileText className="text-galaxy-lavender/50 w-8 h-8" />
                            </div>
                            <p className="text-white/40 mb-1 text-sm">Drag & drop your invoice PDF</p>
                            <p className="text-white/20 text-xs mb-6">or click to browse</p>
                            <input type="file" id="invoice-file" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                            <label htmlFor="invoice-file"
                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-galaxy-purple to-galaxy-cyan text-white font-bold text-sm transition-all cursor-pointer glow-purple hover:scale-105 hover:shadow-galaxy-md">
                                Select File
                            </label>
                        </motion.div>
                    ) : (
                        <motion.div key="selected" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-2xl bg-galaxy-cyan/15 border border-galaxy-cyan/30 flex items-center justify-center mb-5 glow-cyan">
                                <CheckCircle className="text-galaxy-cyan w-8 h-8" />
                            </div>
                            <p className="text-white font-bold mb-1 text-sm">{file.name}</p>
                            <p className="text-white/30 text-xs mb-6 uppercase tracking-widest font-bold">{(file.size / 1024).toFixed(2)} KB</p>

                            {!isUploading ? (
                                <div className="flex gap-3">
                                    <button onClick={() => setFile(null)}
                                        className="px-5 py-2.5 rounded-xl glass border border-galaxy-lavender/20 text-white/50 font-bold text-sm hover:text-white hover:border-galaxy-lavender/40 transition-all">
                                        Cancel
                                    </button>
                                    <button onClick={handleUpload}
                                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-galaxy-purple to-galaxy-pink text-white font-bold text-sm glow-purple hover:scale-105 transition-all flex items-center gap-2">
                                        <Sparkles className="w-4 h-4" />
                                        Seal on Ledger
                                    </button>
                                </div>
                            ) : (
                                <div className="w-full space-y-3">
                                    {/* Progress bar */}
                                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }}
                                            className="h-full rounded-full"
                                            style={{ background: "linear-gradient(90deg, #7c3aed, #ec4899, #06b6d4)" }}
                                        />
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-xs text-white/40">
                                        <div className="w-3 h-3 rounded-full border border-galaxy-lavender/30 border-t-galaxy-lavender animate-spin" />
                                        {progress < 40 ? "Generating hash..." : progress < 100 ? "Broadcasting to ledger..." : "Confirmed!"}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Info row */}
            <div className="mt-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-galaxy-void/60 border border-galaxy-lavender/10">
                <div className="w-2 h-2 rounded-full bg-galaxy-lavender animate-pulse" />
                <span className="text-[10px] text-white/30 font-mono">SHA-256 seal applied on client before broadcast</span>
            </div>
        </div>
    );
};
