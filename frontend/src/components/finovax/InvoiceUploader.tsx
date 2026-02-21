"use client";

import { useState } from "react";
import { Upload, FileText, CheckCircle, Sparkles, X, AlertCircle,
         DollarSign, AlignLeft, Hash, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { invoiceAPI, UploadedInvoice } from "@/lib/api";
import { toast } from "sonner";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED"] as const;

type Stage = "idle" | "hashing" | "uploading" | "done" | "error";

export const InvoiceUploader = () => {
    const [file, setFile]           = useState<File | null>(null);
    const [isDragging, setDragging] = useState(false);
    const [amount, setAmount]       = useState("");
    const [currency, setCurrency]   = useState<string>("INR");
    const [description, setDesc]    = useState("");
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate]     = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() + 30);
        return date.toISOString().split('T')[0];
    });
    const [stage, setStage]         = useState<Stage>("idle");
    const [progress, setProgress]   = useState(0);
    const [result, setResult]       = useState<UploadedInvoice | null>(null);
    const [errMsg, setErrMsg]       = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!file)                        errs.file   = "Please select a PDF file.";
        if (!amount || parseFloat(amount) <= 0) errs.amount = "Enter a valid amount.";
        if (!description.trim())          errs.desc   = "Description is required.";
        if (!invoiceDate)                 errs.invoiceDate = "Invoice date is required.";
        if (dueDate && new Date(dueDate) < new Date(invoiceDate)) {
            errs.dueDate = "Due date must be after invoice date.";
        }
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const resetForm = () => {
        setFile(null); setAmount(""); setDesc(""); setCurrency("INR");
        setInvoiceDate(new Date().toISOString().split('T')[0]);
        const dueDateDefault = new Date();
        dueDateDefault.setDate(dueDateDefault.getDate() + 30);
        setDueDate(dueDateDefault.toISOString().split('T')[0]);
        setStage("idle"); setProgress(0); setResult(null); setErrMsg(""); setFieldErrors({});
    };

    const handleFile = (f: File | null | undefined) => {
        if (!f) return;
        if (f.type !== "application/pdf") {
            toast.error("Only PDF files are accepted.");
            return;
        }
        if (f.size > 10 * 1024 * 1024) {
            toast.error("File too large. Maximum size is 10 MB.");
            return;
        }
        setFile(f);
        setFieldErrors(e => ({ ...e, file: "" }));
    };

    const handleUpload = async () => {
        if (!validate()) return;

        const token = localStorage.getItem("finovax-token");
        if (!token || token.startsWith("mock.")) {
            toast.error("Please log in with a real account to upload invoices.");
            return;
        }

        setStage("hashing");
        setProgress(15);
        setErrMsg("");

        try {
            toast.info("Securing document…");
            setProgress(35);

            const formData = new FormData();
            formData.append("file", file!);
            formData.append("amount", amount);
            formData.append("currency", currency);
            formData.append("description", description.trim());
            formData.append("invoiceDate", invoiceDate);
            formData.append("dueDate", dueDate);

            setStage("uploading");
            setProgress(60);
            toast.info("Uploading to IPFS and blockchain…");

            const res = await invoiceAPI.upload(token, formData);
            setProgress(100);
            setResult(res.data.invoice);
            setStage("done");
            toast.success("Invoice sealed on ledger!", {
                description: `Hash: ${res.data.invoice.invoiceHash.slice(0, 16)}…`,
            });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Upload failed. Please try again.";
            setErrMsg(msg);
            setStage("error");
            toast.error("Upload failed", { description: msg });
        }
    };

    // ── Success state ──────────────────────────────────────────────────────────
    if (stage === "done" && result) {
        return (
            <div className="mg-card rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-mg-lavender/10 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #059669, #10b981)", boxShadow: "0 0 8px rgba(5,150,105,0.25)" }}>
                        <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <p className="font-semibold text-mg-silver text-sm">Invoice Sealed</p>
                        <p className="text-[10px] text-mg-dim">Anchored on ledger successfully</p>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div className="rounded-xl p-4 space-y-3 bg-status-success/5 border border-status-success/15">
                        {[
                            { label: "Invoice ID",   value: result.invoiceId,   mono: true },
                            { label: "Status",       value: result.status,      mono: false },
                            { label: "Amount",       value: `${result.currency} ${result.amount.toLocaleString("en-IN")}`, mono: false },
                            { label: "IPFS CID",     value: result.ipfsCID,     mono: true, truncate: true },
                            { label: "SHA-256 Hash", value: result.invoiceHash, mono: true, truncate: true },
                        ].map(row => (
                            <div key={row.label} className="flex items-start justify-between gap-3 text-sm">
                                <span className="text-mg-dim text-xs shrink-0 pt-0.5">{row.label}</span>
                                <span className={cn(
                                    "text-mg-silver text-right",
                                    row.mono && "font-mono text-[11px]",
                                    row.truncate && "truncate max-w-[220px]"
                                )}>{row.value}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3">
                        <button onClick={resetForm} className="mg-btn-primary flex-1 justify-center gap-2">
                            <Upload className="w-4 h-4" /> Upload Another
                        </button>
                        <a href={`https://ipfs.io/ipfs/${result.ipfsCID}`} target="_blank" rel="noopener noreferrer"
                            className="mg-btn-ghost border border-mg-lavender/20 flex items-center gap-1.5 px-4 rounded-xl text-sm font-medium text-mg-muted hover:text-mg-silver transition-colors">
                            <ExternalLink className="w-3.5 h-3.5" /> IPFS
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // ── Upload form ────────────────────────────────────────────────────────────
    return (
        <div className="mg-card rounded-2xl overflow-hidden">
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

            <div className="p-5 flex flex-col gap-4">
                {/* Drop zone */}
                <div
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
                    className={cn(
                        "border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 flex flex-col items-center justify-center min-h-[150px]",
                        isDragging           ? "border-mg-lavender/60 bg-mg-cosmic/15 scale-[1.01]" :
                        file                 ? "border-mg-lavender/40 bg-mg-cosmic/08" :
                        fieldErrors.file     ? "border-status-danger/40 bg-status-danger/04" :
                                               "border-mg-lavender/18 hover:border-mg-lavender/35 hover:bg-mg-card/40"
                    )}>
                    <AnimatePresence mode="wait">
                        {!file ? (
                            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="flex flex-col items-center">
                                <div className="w-11 h-11 rounded-xl bg-mg-elevated border border-mg-lavender/18 flex items-center justify-center mb-3">
                                    <FileText className="w-5 h-5 text-mg-dim" />
                                </div>
                                <p className="text-sm text-mg-muted mb-0.5">Drop your invoice PDF here</p>
                                <p className="text-xs text-mg-dim mb-4">PDF only · max 10 MB</p>
                                <input type="file" id="invoice-file" accept="application/pdf" className="hidden"
                                    onChange={e => handleFile(e.target.files?.[0])} />
                                <label htmlFor="invoice-file" className="mg-btn-primary text-xs py-2 px-4 cursor-pointer">
                                    Choose File
                                </label>
                                {fieldErrors.file && (
                                    <p className="text-xs text-status-danger mt-2 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />{fieldErrors.file}
                                    </p>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div key="selected" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center w-full">
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                                    style={{ background: "rgba(5,150,105,0.10)", border: "1px solid rgba(5,150,105,0.22)" }}>
                                    <CheckCircle className="w-5 h-5 text-status-success" />
                                </div>
                                <p className="font-medium text-mg-silver text-sm mb-0.5 truncate max-w-[240px]">{file.name}</p>
                                <p className="text-xs text-mg-dim">{(file.size / 1024).toFixed(1)} KB</p>
                                <button onClick={() => setFile(null)}
                                    className="mt-3 text-xs text-mg-dim hover:text-status-danger transition-colors flex items-center gap-1">
                                    <X className="w-3 h-3" /> Remove
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Amount + Currency */}
                <div className="grid grid-cols-[1fr_auto] gap-3">
                    <div>
                        <label className="mg-label block mb-1.5">Invoice Amount</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-mg-dim" />
                            <input type="number" min="1" step="0.01" value={amount}
                                onChange={e => { setAmount(e.target.value); setFieldErrors(fe => ({ ...fe, amount: "" })); }}
                                placeholder="50000"
                                className={cn("mg-input pl-9", fieldErrors.amount && "border-status-danger")} />
                        </div>
                        {fieldErrors.amount && (
                            <p className="text-[10px] text-status-danger mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />{fieldErrors.amount}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="mg-label block mb-1.5">Currency</label>
                        <select value={currency} onChange={e => setCurrency(e.target.value)}
                            className="mg-input pr-2 appearance-none cursor-pointer">
                            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="mg-label block mb-1.5">Description</label>
                    <div className="relative">
                        <AlignLeft className="absolute left-3 top-3 w-3.5 h-3.5 text-mg-dim" />
                        <textarea value={description}
                            onChange={e => { setDesc(e.target.value); setFieldErrors(fe => ({ ...fe, desc: "" })); }}
                            placeholder="Server hardware supplies for Q3…"
                            rows={2}
                            className={cn("mg-input pl-9 resize-none", fieldErrors.desc && "border-status-danger")} />
                    </div>
                    {fieldErrors.desc && (
                        <p className="text-[10px] text-status-danger mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />{fieldErrors.desc}
                        </p>
                    )}
                </div>

                {/* Invoice Date & Due Date */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="mg-label block mb-1.5">Invoice Date</label>
                        <input 
                            type="date" 
                            value={invoiceDate}
                            onChange={e => { setInvoiceDate(e.target.value); setFieldErrors(fe => ({ ...fe, invoiceDate: "" })); }}
                            className={cn("mg-input", fieldErrors.invoiceDate && "border-status-danger")} 
                        />
                        {fieldErrors.invoiceDate && (
                            <p className="text-[10px] text-status-danger mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />{fieldErrors.invoiceDate}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="mg-label block mb-1.5">Due Date (Optional)</label>
                        <input 
                            type="date" 
                            value={dueDate}
                            onChange={e => { setDueDate(e.target.value); setFieldErrors(fe => ({ ...fe, dueDate: "" })); }}
                            className={cn("mg-input", fieldErrors.dueDate && "border-status-danger")} 
                        />
                        {fieldErrors.dueDate && (
                            <p className="text-[10px] text-status-danger mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />{fieldErrors.dueDate}
                            </p>
                        )}
                    </div>
                </div>

                {/* API error */}
                {stage === "error" && errMsg && (
                    <div className="flex items-center gap-2 p-3 rounded-xl text-sm text-status-danger"
                        style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.18)" }}>
                        <AlertCircle className="w-4 h-4 shrink-0" />{errMsg}
                    </div>
                )}

                {/* Upload / progress */}
                {stage === "hashing" || stage === "uploading" ? (
                    <div className="space-y-2.5">
                        <div className="h-1.5 rounded-full overflow-hidden bg-mg-elevated">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.5 }}
                                className="h-full rounded-full"
                                style={{ background: "linear-gradient(90deg, #4a4e8f, #6b5ea0)" }} />
                        </div>
                        <div className="flex items-center justify-center gap-2 text-xs text-mg-muted">
                            <div className="w-3 h-3 rounded-full border border-mg-dim border-t-mg-lavender animate-spin" />
                            {stage === "hashing" ? "Generating SHA-256 hash…" : "Uploading to IPFS & blockchain…"}
                        </div>
                    </div>
                ) : (
                    <button onClick={handleUpload}
                        className="mg-btn-primary w-full justify-center gap-2">
                        <Sparkles className="w-4 h-4" /> Seal on Ledger
                    </button>
                )}

                {/* Footer hint */}
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-mg-elevated border border-mg-lavender/10">
                    <Hash className="w-3 h-3 text-mg-lavender shrink-0" />
                    <span className="text-[10px] text-mg-dim font-mono">SHA-256 digest computed server-side · only hash goes on-chain</span>
                </div>
            </div>
        </div>
    );
};
