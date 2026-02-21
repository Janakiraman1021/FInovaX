"use client";

import { useState } from "react";
import { trustAPI, APIError } from "@/lib/api";
import { motion } from "framer-motion";
import { FileText, Send, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AssuranceReportFormProps {
    invoiceId: string;
    onSubmitted?: () => void;
    className?: string;
}

const USAGE_CATEGORIES = [
    { value: "RAW_MATERIAL", label: "Raw Material Purchase" },
    { value: "VENDOR_PAYMENT", label: "Vendor Payment" },
    { value: "WORKING_CAPITAL", label: "Working Capital" },
    { value: "LOGISTICS", label: "Logistics & Transportation" },
    { value: "OTHER", label: "Other" },
] as const;

export const AssuranceReportForm = ({ invoiceId, onSubmitted, className = "" }: AssuranceReportFormProps) => {
    const [usageCategory, setUsageCategory] = useState("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!usageCategory) {
            toast.error("Please select a usage category");
            return;
        }

        const token = localStorage.getItem("oneflow-token");
        if (!token || token.startsWith("mock.")) {
            toast.error("Real account required");
            return;
        }

        setSubmitting(true);
        try {
            await trustAPI.submitAssuranceReport(token, {
                invoiceId,
                usageCategory,
                description: description.trim() || undefined,
            });
            toast.success("Assurance report submitted", {
                description: "Lender will review your disclosure"
            });
            setSubmitted(true);
            onSubmitted?.();
        } catch (err) {
            let msg = "Submission failed";
            if (err instanceof APIError) {
                msg = err.message;
            } else if (err instanceof Error) {
                msg = err.message;
            }
            toast.error("Submission failed", { description: msg });
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`mg-card rounded-2xl p-6 border border-status-success/20 ${className}`}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-status-success/10 border-2 border-status-success/30">
                        <CheckCircle className="w-6 h-6 text-status-success" />
                    </div>
                    <div>
                        <p className="font-semibold text-mg-silver">Report Submitted</p>
                        <p className="text-xs text-mg-dim mt-0.5">Your usage disclosure has been sent to the lender</p>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className={`mg-card rounded-2xl overflow-hidden ${className}`}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-mg-lavender/10 bg-gradient-to-r from-mg-cosmic/5 via-transparent to-transparent">
                <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-mg-cosmic" />
                    <div>
                        <p className="font-semibold text-mg-silver">Assurance Report</p>
                        <p className="text-[10px] text-mg-dim">Disclose how you'll use the financed funds</p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
                {/* Usage Category */}
                <div>
                    <label className="block text-xs font-semibold text-mg-silver mb-2">
                        Usage Category <span className="text-status-danger">*</span>
                    </label>
                    <select
                        value={usageCategory}
                        onChange={(e) => setUsageCategory(e.target.value)}
                        disabled={submitting}
                        className="w-full px-3 py-2 rounded-lg bg-mg-elevated border border-mg-lavender/10 text-mg-silver text-sm focus:outline-none focus:border-mg-cosmic transition-colors disabled:opacity-50"
                        required>
                        <option value="">— Select usage category —</option>
                        {USAGE_CATEGORIES.map(cat => (
                            <option key={cat.value} value={cat.value}>
                                {cat.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-xs font-semibold text-mg-silver mb-2">
                        Description <span className="text-mg-dim font-normal">(Optional)</span>
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={submitting}
                        placeholder="Provide additional details about fund usage..."
                        rows={4}
                        className={cn(
                            "w-full px-3 py-2 rounded-lg bg-mg-elevated border border-mg-lavender/10 text-mg-silver text-sm",
                            "placeholder:text-mg-dim/50 focus:outline-none focus:border-mg-cosmic transition-colors resize-none disabled:opacity-50"
                        )}
                    />
                </div>

                {/* Info Box */}
                <div className="p-3 rounded-lg bg-mg-cosmic/5 border border-mg-cosmic/10">
                    <p className="text-[10px] text-mg-dim leading-relaxed">
                        <span className="font-semibold text-mg-cosmic">Why submit this?</span> Assurance reports build trust with lenders by demonstrating transparency and responsible fund usage.
                    </p>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={!usageCategory || submitting}
                    className="w-full py-3 rounded-lg bg-gradient-to-r from-mg-cosmic to-mg-lavender text-white font-bold text-sm hover:shadow-lg hover:shadow-mg-cosmic/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {submitting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                    ) : (
                        <><Send className="w-4 h-4" /> Submit Assurance Report</>
                    )}
                </button>
            </div>
        </form>
    );
};
