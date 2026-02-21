"use client";

import { useState } from "react";
import { Upload, FileText, CheckCircle, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, generateSHA256 } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "sonner";

export const InvoiceUploader = () => {
    const [file, setFile]             = useState<File | null>(null);
    const [isUploading, setUploading] = useState(false);
    const [progress, setProgress]     = useState(0);
    const [isDragging, setDragging]   = useState(false);

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setProgress(10);
        try {
            const content = `${file.name}-${file.size}-${Date.now()}`;
            const hash    = await generateSHA256(content);
            setProgress(40);
            toast.info("Generating cryptographic hash…");

            await api.invoices.upload({
                id: `INV-${Math.floor(Math.random() * 1000)}`,
                borrower: "TechFlow MSME",
                amount: Math.floor(Math.random() * 50000) + 1000,
                invoiceHash: hash,
                description: "Equipment Purchase",
            });

            setProgress(100);
            toast.success("Invoice sealed on ledger!", { description: `SHA-256: ${hash.slice(0, 12)}…` });
            setTimeout(() => { setUploading(false); setFile(null); setProgress(0); }, 1200);
        } catch {
            toast.error("Upload failed.");
            setUploading(false);
        }
    };

    return (
        <div className="mg-card rounded-2xl overflow-hidden h-full flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-mg-lavender/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #4a4e8f, #6b5ea0)", boxShadow: "0 0 8px rgba(74,78,143,0.22)" }}>
                    <Upload className="w-4 h-4 text-white" />
                </div>
                <div>
                    <p className="font-semibold text-mg-silver text-sm">Invoice Upload</p>
                    <p className="text-[10px] text-mg-dim">Seal documents on the ledger</p>
                </div>
            </div>

            <div className="p-5 flex-1 flex flex-col gap-4">
                {/* Drop zone */}
                <div
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
                    className={cn(
                        "flex-1 border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 min-h-[180px] flex flex-col items-center justify-center",
                        isDragging    ? "border-mg-lavender/60 bg-mg-cosmic/15 scale-[1.01]" :
                        file          ? "border-mg-lavender/40 bg-mg-cosmic/08" :
                                        "border-mg-lavender/18 hover:border-mg-lavender/35 hover:bg-mg-card/40"
                    )}>
                    <AnimatePresence mode="wait">
                        {!file ? (
                            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-xl bg-mg-elevated border border-mg-lavender/18 flex items-center justify-center mb-4">
                                    <FileText className="w-6 h-6 text-mg-dim" />
                                </div>
                                <p className="text-sm text-mg-muted mb-1">Drop your invoice PDF here</p>
                                <p className="text-xs text-mg-dim mb-5">or click to browse</p>
                                <input type="file" id="invoice-file" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                                <label htmlFor="invoice-file"
                                    className="mg-btn-primary text-xs py-2 px-4 cursor-pointer">
                                    Choose File
                                </label>
                            </motion.div>
                        ) : (
                            <motion.div key="selected" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center w-full">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                                    style={{ background: "rgba(5,150,105,0.10)", border: "1px solid rgba(5,150,105,0.22)" }}>
                                    <CheckCircle className="w-6 h-6 text-status-success" />
                                </div>
                                <p className="font-medium text-mg-silver text-sm mb-0.5 text-center truncate max-w-full">{file.name}</p>
                                <p className="text-xs text-mg-dim mb-5">{(file.size / 1024).toFixed(2)} KB</p>

                                {!isUploading ? (
                                    <div className="flex gap-2">
                                        <button onClick={() => setFile(null)}
                                            className="mg-btn-ghost border border-mg-lavender/15 text-xs px-4 py-2 rounded-lg flex items-center gap-1.5">
                                            <X className="w-3.5 h-3.5" /> Cancel
                                        </button>
                                        <button onClick={handleUpload}
                                            className="mg-btn-primary text-xs flex items-center gap-1.5">
                                            <Sparkles className="w-3.5 h-3.5" /> Seal on Ledger
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-full space-y-2.5">
                                        <div className="h-1.5 rounded-full overflow-hidden bg-mg-elevated">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                                transition={{ duration: 0.5 }}
                                                className="h-full rounded-full"
                                                style={{ background: "linear-gradient(90deg, #4a4e8f, #6b5ea0)" }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-center gap-2 text-xs text-mg-muted">
                                            <div className="w-3 h-3 rounded-full border border-mg-dim border-t-mg-lavender animate-spin" />
                                            {progress < 40 ? "Generating hash…" : progress < 100 ? "Broadcasting to ledger…" : "Confirmed!"}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Info */}
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-mg-elevated border border-mg-lavender/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-mg-lavender animate-pulse" />
                    <span className="text-[10px] text-mg-dim font-mono">SHA-256 digest applied on client before ledger broadcast</span>
                </div>
            </div>
        </div>
    );
};
