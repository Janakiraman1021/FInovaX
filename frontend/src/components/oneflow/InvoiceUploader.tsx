"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { invoiceAPI, authAPI, UploadedInvoice, LenderListItem, APIError } from "@/lib/api";
import { toast } from "sonner";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED"] as const;

type Stage = "idle" | "hashing" | "uploading" | "done" | "error";

export const InvoiceUploader = () => {
    const [file, setFile]           = useState<File | null>(null);
    const [isDragging, setDragging] = useState(false);
    const [amount, setAmount]       = useState("");
    const [currency, setCurrency]   = useState<string>("INR");
    const [description, setDesc]    = useState("");
    const [sellerGSTIN, setSellerGSTIN] = useState("");
    const [buyerGSTIN, setBuyerGSTIN] = useState("");
    const [poReference, setPoReference] = useState("");
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate]     = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() + 30);
        return date.toISOString().split('T')[0];
    });
    const [submittedTo, setSubmittedTo] = useState("");
    const [lenders, setLenders]         = useState<LenderListItem[]>([]);
    const [stage, setStage]         = useState<Stage>("idle");
    const [progress, setProgress]   = useState(0);
    const [result, setResult]       = useState<UploadedInvoice | null>(null);
    const [errMsg, setErrMsg]       = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Fetch lenders on mount
    useEffect(() => {
        const token = localStorage.getItem("oneflow-token");
        if (!token || token.startsWith("mock.")) return;
        authAPI.getLenders(token)
            .then(res => setLenders(res.data))
            .catch(() => { /* lender list is optional */ });
    }, []);

    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!file)                        errs.file   = "Please select a PDF file.";
        if (!amount || parseFloat(amount) <= 0) errs.amount = "Enter a valid amount.";
        if (!description.trim())          errs.desc   = "Description is required.";
        if (!sellerGSTIN.trim())          errs.sellerGSTIN = "Seller GSTIN is required.";
        else if (!gstinRegex.test(sellerGSTIN)) errs.sellerGSTIN = "Invalid GSTIN format.";
        if (!buyerGSTIN.trim())           errs.buyerGSTIN = "Buyer GSTIN is required.";
        else if (!gstinRegex.test(buyerGSTIN)) errs.buyerGSTIN = "Invalid GSTIN format.";
        if (!invoiceDate)                 errs.invoiceDate = "Invoice date is required.";
        if (dueDate && new Date(dueDate) < new Date(invoiceDate)) {
            errs.dueDate = "Due date must be after invoice date.";
        }
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const resetForm = () => {
        setFile(null); setAmount(""); setDesc(""); setCurrency("INR");
        setSellerGSTIN(""); setBuyerGSTIN(""); setPoReference(""); setSubmittedTo("");
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

        const token = localStorage.getItem("oneflow-token");
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
            formData.append("sellerGSTIN", sellerGSTIN.trim().toUpperCase());
            formData.append("buyerGSTIN", buyerGSTIN.trim().toUpperCase());
            if (poReference.trim()) formData.append("poReference", poReference.trim().toUpperCase());
            formData.append("invoiceDate", invoiceDate);
            formData.append("dueDate", dueDate);
            if (submittedTo) formData.append("submittedTo", submittedTo);

            setStage("uploading");
            setProgress(60);
            toast.info("Uploading to IPFS and blockchain…");

            const res = await invoiceAPI.upload(token, formData);
            setProgress(100);
            setResult(res.data.invoice);
            setStage("done");
            
            const rfp = res.data.invoice.receivableFingerprint;
            toast.success("Invoice sealed on ledger!", {
                description: rfp 
                    ? `Receivable: ${rfp.slice(0, 16)}…` 
                    : `Hash: ${res.data.invoice.invoiceHash.slice(0, 16)}…`,
            });
        } catch (err: unknown) {
            let msg = "Upload failed. Please try again.";
            
            if (err instanceof APIError) {
                if (err.errorCode === "DUPLICATE_FILE_HASH") {
                    msg = "You have already uploaded this file. To submit it to a lender, use the 'Submit to Lender' option from your invoice list.";
                } else if (err.errorCode === "DUPLICATE_LENDER_SUBMISSION") {
                    msg = "You have already submitted this receivable to this lender. Please choose a different lender or upload a different invoice.";
                } else if (err.errorCode === "INCONSISTENT_INVOICE_DATA") {
                    msg = "The uploaded invoice file does not match the declared receivable details. Please ensure the invoice document matches the seller GSTIN, buyer GSTIN, amount, PO reference, and invoice date you entered.";
                } else {
                    msg = err.message;
                }
            } else if (err instanceof Error) {
                msg = err.message;
            }
            
            setErrMsg(msg);
            setStage("error");
            toast.error("Upload failed", { description: msg });
        }
    };

    // ── Success state ──────────────────────────────────────────────────────────
    if (stage === "done" && result) {
        return (
            <div className="rounded-2xl overflow-hidden border border-mg-lavender/10">
                {/* Success Header */}
                <div className="px-8 py-6 border-b border-mg-lavender/10 bg-gradient-to-r from-status-success/5 via-transparent to-transparent">
                    <div className="space-y-2">
                        <p className="text-xs uppercase tracking-widest font-semibold text-status-success">Success</p>
                        <h2 className="text-2xl font-bold text-mg-silver">Invoice Sealed</h2>
                        <p className="text-xs text-mg-dim">Your document is now anchored on the blockchain</p>
                    </div>
                </div>

                {/* Results */}
                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        {[
                            { label: "Invoice ID", value: result.invoiceId, mono: true },
                            { label: "Status", value: result.status, mono: false },
                            { label: "Amount", value: `${result.currency} ${result.amount.toLocaleString("en-IN")}`, mono: false },
                            ...(result.receivableFingerprint ? [{ label: "Receivable Fingerprint", value: result.receivableFingerprint, mono: true, truncate: true }] : []),
                            { label: "IPFS CID", value: result.ipfsCID, mono: true, truncate: true },
                            { label: "SHA-256 Hash", value: result.invoiceHash, mono: true, truncate: true },
                        ].map(row => (
                            <div key={row.label} className="flex items-center justify-between p-3 rounded-lg bg-mg-elevated/50 border border-mg-lavender/10">
                                <span className="text-xs text-mg-dim font-semibold">{row.label}</span>
                                <span className={cn(
                                    "text-xs text-mg-silver text-right",
                                    row.mono && "font-mono text-[10px]",
                                    row.truncate && "truncate max-w-[200px]"
                                )}>{row.value}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button onClick={resetForm}
                            className="flex-1 px-4 py-3 rounded-lg bg-mg-cosmic text-white font-semibold text-sm hover:bg-mg-cosmic/90 transition-colors">
                            Upload Another
                        </button>
                        <a href={`https://ipfs.io/ipfs/${result.ipfsCID}`} target="_blank" rel="noopener noreferrer"
                            className="px-4 py-3 rounded-lg border border-mg-lavender/20 text-mg-silver font-semibold text-sm hover:border-mg-lavender/40 transition-colors">
                            View on IPFS →
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // ── Upload form ────────────────────────────────────────────────────────────
    return (
        <div className="rounded-2xl border border-mg-lavender/10 overflow-hidden">
            {/* Form Header */}
            <div className="px-8 py-6 border-b border-mg-lavender/10 bg-gradient-to-r from-mg-cosmic/5 via-transparent to-transparent">
                <p className="text-xs uppercase tracking-widest font-semibold text-mg-cosmic">Step 1</p>
                <h3 className="text-xl font-bold text-mg-silver mt-1">Document & Financial Details</h3>
            </div>

            <div className="p-8 space-y-8">
                {/* File Upload Section */}
                <div className="space-y-4">
                    <label className="block">
                        <p className="text-xs uppercase tracking-widest font-semibold text-mg-cosmic mb-4">PDF Document</p>
                        <motion.div
                            onDragOver={e => { e.preventDefault(); setDragging(true); }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
                            className={cn(
                                "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 min-h-[160px] flex flex-col items-center justify-center",
                                isDragging           ? "border-mg-lavender/60 bg-mg-cosmic/15 scale-[1.01]" :
                                file                 ? "border-mg-lavender/40 bg-mg-cosmic/08" :
                                fieldErrors.file     ? "border-status-danger/40 bg-status-danger/04" :
                                                       "border-mg-lavender/18 hover:border-mg-lavender/35 hover:bg-mg-card/40"
                            )}>
                            <AnimatePresence mode="wait">
                                {!file ? (
                                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <p className="text-sm text-mg-muted mb-2 font-semibold">Drop invoice PDF here</p>
                                        <p className="text-xs text-mg-dim mb-4">Max 10 MB</p>
                                        <input type="file" id="invoice-file" accept="application/pdf" className="hidden"
                                            onChange={e => handleFile(e.target.files?.[0])} />
                                        <label htmlFor="invoice-file" className="inline-block px-4 py-2 rounded-lg bg-mg-cosmic text-white text-xs font-semibold cursor-pointer hover:bg-mg-cosmic/90 transition-colors">
                                            Choose File
                                        </label>
                                        {fieldErrors.file && (
                                            <p className="text-xs text-status-danger mt-3">{fieldErrors.file}</p>
                                        )}
                                    </motion.div>
                                ) : (
                                    <motion.div key="selected" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
                                        <p className="text-sm font-semibold text-status-success mb-1 truncate max-w-[200px]">{file.name}</p>
                                        <p className="text-xs text-mg-dim mb-4">{(file.size / 1024).toFixed(1)} KB</p>
                                        <button onClick={() => setFile(null)}
                                            className="text-xs text-mg-dim hover:text-status-danger transition-colors underline">
                                            Remove File
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </label>
                </div>

                {/* Financial Details */}
                <div className="space-y-4">
                    <p className="text-xs uppercase tracking-widest font-semibold text-mg-cosmic">Financial Information</p>

                    {/* Amount + Currency */}
                    <div className="grid grid-cols-[1fr_140px] gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-mg-silver mb-2">Invoice Amount</label>
                            <input type="number" min="1" step="0.01" value={amount}
                                onChange={e => { setAmount(e.target.value); setFieldErrors(fe => ({ ...fe, amount: "" })); }}
                                placeholder="Enter amount"
                                className={cn("w-full px-3 py-2 rounded-lg bg-mg-elevated border border-mg-lavender/10 text-mg-silver text-sm placeholder:text-mg-dim/50 focus:outline-none focus:border-mg-cosmic transition-colors", fieldErrors.amount && "border-status-danger")} />
                            {fieldErrors.amount && <p className="text-[10px] text-status-danger mt-1">{fieldErrors.amount}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-mg-silver mb-2">Currency</label>
                            <select value={currency} onChange={e => setCurrency(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-mg-elevated border border-mg-lavender/10 text-mg-silver text-sm focus:outline-none focus:border-mg-cosmic transition-colors appearance-none cursor-pointer">
                                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-semibold text-mg-silver mb-2">Description</label>
                        <textarea value={description}
                            onChange={e => { setDesc(e.target.value); setFieldErrors(fe => ({ ...fe, desc: "" })); }}
                            placeholder="What does this invoice cover?"
                            rows={2}
                            className={cn("w-full px-3 py-2 rounded-lg bg-mg-elevated border border-mg-lavender/10 text-mg-silver text-sm placeholder:text-mg-dim/50 focus:outline-none focus:border-mg-cosmic transition-colors resize-none", fieldErrors.desc && "border-status-danger")} />
                        {fieldErrors.desc && <p className="text-[10px] text-status-danger mt-1">{fieldErrors.desc}</p>}
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-mg-silver mb-2">Invoice Date</label>
                            <input type="date" value={invoiceDate}
                                onChange={e => { setInvoiceDate(e.target.value); setFieldErrors(fe => ({ ...fe, invoiceDate: "" })); }}
                                className={cn("w-full px-3 py-2 rounded-lg bg-mg-elevated border border-mg-lavender/10 text-mg-silver text-sm focus:outline-none focus:border-mg-cosmic transition-colors", fieldErrors.invoiceDate && "border-status-danger")} />
                            {fieldErrors.invoiceDate && <p className="text-[10px] text-status-danger mt-1">{fieldErrors.invoiceDate}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-mg-silver mb-2">Due Date</label>
                            <input type="date" value={dueDate}
                                onChange={e => { setDueDate(e.target.value); setFieldErrors(fe => ({ ...fe, dueDate: "" })); }}
                                className={cn("w-full px-3 py-2 rounded-lg bg-mg-elevated border border-mg-lavender/10 text-mg-silver text-sm focus:outline-none focus:border-mg-cosmic transition-colors", fieldErrors.dueDate && "border-status-danger")} />
                            {fieldErrors.dueDate && <p className="text-[10px] text-status-danger mt-1">{fieldErrors.dueDate}</p>}
                        </div>
                    </div>
                </div>

                {/* GSTIN Details */}
                <div className="space-y-4">
                    <p className="text-xs uppercase tracking-widest font-semibold text-mg-cosmic">Tax & Business Details</p>

                    {/* GSTINs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-mg-silver mb-2">Seller GSTIN</label>
                            <input type="text" value={sellerGSTIN} maxLength={15}
                                onChange={e => { setSellerGSTIN(e.target.value.toUpperCase()); setFieldErrors(fe => ({ ...fe, sellerGSTIN: "" })); }}
                                placeholder="27AABCU9603R1ZM"
                                className={cn("w-full px-3 py-2 rounded-lg bg-mg-elevated border border-mg-lavender/10 text-mg-silver text-sm font-mono uppercase placeholder:text-mg-dim/50 focus:outline-none focus:border-mg-cosmic transition-colors", fieldErrors.sellerGSTIN && "border-status-danger")} />
                            {fieldErrors.sellerGSTIN && <p className="text-[10px] text-status-danger mt-1">{fieldErrors.sellerGSTIN}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-mg-silver mb-2">Buyer GSTIN</label>
                            <input type="text" value={buyerGSTIN} maxLength={15}
                                onChange={e => { setBuyerGSTIN(e.target.value.toUpperCase()); setFieldErrors(fe => ({ ...fe, buyerGSTIN: "" })); }}
                                placeholder="29AAACU9603R2ZN"
                                className={cn("w-full px-3 py-2 rounded-lg bg-mg-elevated border border-mg-lavender/10 text-mg-silver text-sm font-mono uppercase placeholder:text-mg-dim/50 focus:outline-none focus:border-mg-cosmic transition-colors", fieldErrors.buyerGSTIN && "border-status-danger")} />
                            {fieldErrors.buyerGSTIN && <p className="text-[10px] text-status-danger mt-1">{fieldErrors.buyerGSTIN}</p>}
                        </div>
                    </div>

                    {/* PO Reference */}
                    <div>
                        <label className="block text-xs font-semibold text-mg-silver mb-2">PO Reference <span className="text-mg-dim font-normal">(Optional)</span></label>
                        <input type="text" value={poReference}
                            onChange={e => setPoReference(e.target.value.toUpperCase())}
                            placeholder="PO-2026-Q1-1234"
                            className="w-full px-3 py-2 rounded-lg bg-mg-elevated border border-mg-lavender/10 text-mg-silver text-sm font-mono uppercase placeholder:text-mg-dim/50 focus:outline-none focus:border-mg-cosmic transition-colors" />
                    </div>

                    {/* Submit to Lender */}
                    <div>
                        <label className="block text-xs font-semibold text-mg-silver mb-2">
                            Submit to Lender{" "}
                            <span className="text-mg-dim font-normal">(Optional)</span>
                        </label>
                        <select
                            value={submittedTo}
                            onChange={e => setSubmittedTo(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-mg-elevated border border-mg-lavender/10 text-mg-silver text-sm focus:outline-none focus:border-mg-cosmic transition-colors appearance-none cursor-pointer"
                        >
                            <option value="">— Select a lender —</option>
                            {lenders.map(l => (
                                <option key={l._id} value={l._id}>
                                    {l.name}{l.organization ? ` — ${l.organization}` : ""}
                                </option>
                            ))}
                        </select>
                        {lenders.length === 0 && (
                            <p className="text-[10px] text-mg-dim mt-1">
                                No lenders available. The invoice will still be uploaded.
                            </p>
                        )}
                    </div>
                </div>

                {/* Error Message */}
                {stage === "error" && errMsg && (
                    <div className="p-4 rounded-lg border border-status-danger/30 bg-status-danger/5">
                        <p className="text-xs text-status-danger">{errMsg}</p>
                    </div>
                )}

                {/* Progress Bar */}
                {stage === "hashing" || stage === "uploading" ? (
                    <div className="space-y-3">
                        <div className="h-1 rounded-full overflow-hidden bg-mg-elevated">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.5 }}
                                className="h-full rounded-full"
                                style={{ background: "linear-gradient(90deg, #4a4e8f, #6b5ea0)" }} />
                        </div>
                        <p className="text-xs text-mg-dim text-center">
                            {stage === "hashing" ? "Computing SHA-256…" : "Uploading to IPFS & blockchain…"}
                        </p>
                    </div>
                ) : (
                    <button onClick={handleUpload}
                        className="w-full py-3 rounded-lg bg-gradient-to-r from-mg-cosmic to-mg-lavender text-white font-bold text-sm hover:shadow-lg hover:shadow-mg-cosmic/20 transition-all active:scale-95">
                            Seal Invoice on Ledger
                    </button>
                )}
            </div>
        </div>
    );
};
