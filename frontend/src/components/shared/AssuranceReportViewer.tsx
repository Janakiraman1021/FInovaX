"use client";

import { useEffect, useState } from "react";
import { trustAPI, AssuranceReport, APIError } from "@/lib/api";
import { motion } from "framer-motion";
import { FileCheck, CheckCircle, Clock, Loader2, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface AssuranceReportViewerProps {
    invoiceId: string;
    /** If true, show acknowledge button (lender view) */
    canAcknowledge?: boolean;
    className?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
    RAW_MATERIAL: "Raw Material Purchase",
    VENDOR_PAYMENT: "Vendor Payment",
    WORKING_CAPITAL: "Working Capital",
    LOGISTICS: "Logistics & Transportation",
    OTHER: "Other",
};

export const AssuranceReportViewer = ({ invoiceId, canAcknowledge = false, className = "" }: AssuranceReportViewerProps) => {
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState<AssuranceReport | null>(null);
    const [error, setError] = useState("");
    const [acknowledging, setAcknowledging] = useState(false);

    const fetchReport = async () => {
        const token = localStorage.getItem("oneflow-token");
        if (!token || token.startsWith("mock.")) {
            setLoading(false);
            return;
        }

        try {
            const res = await trustAPI.getAssuranceReport(token, invoiceId);
            setReport(res.data);
        } catch (err) {
            if (err instanceof APIError && err.statusCode === 404) {
                setError("No assurance report submitted");
            } else {
                setError(err instanceof Error ? err.message : "Failed to load report");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [invoiceId]);

    const handleAcknowledge = async () => {
        if (!report) return;

        const token = localStorage.getItem("oneflow-token");
        if (!token || token.startsWith("mock.")) {
            toast.error("Real account required");
            return;
        }

        setAcknowledging(true);
        try {
            await trustAPI.acknowledgeAssuranceReport(token, { reportId: report._id });
            toast.success("Report acknowledged", {
                description: "MSME will be notified of your acknowledgment"
            });
            // Refresh report
            await fetchReport();
        } catch (err) {
            let msg = "Acknowledgment failed";
            if (err instanceof APIError) {
                msg = err.message;
            } else if (err instanceof Error) {
                msg = err.message;
            }
            toast.error("Acknowledgment failed", { description: msg });
        } finally {
            setAcknowledging(false);
        }
    };

    if (loading) {
        return (
            <div className={`mg-card rounded-2xl p-6 ${className}`}>
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-mg-dim" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`mg-card rounded-2xl p-6 border border-mg-lavender/10 ${className}`}>
                <div className="flex items-center gap-3 text-mg-dim">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm">{error}</span>
                </div>
            </div>
        );
    }

    if (!report) {
        return (
            <div className={`mg-card rounded-2xl p-6 border border-mg-lavender/10 ${className}`}>
                <div className="flex items-center gap-3 text-mg-dim">
                    <FileCheck className="w-5 h-5" />
                    <span className="text-sm italic">No assurance report available</span>
                </div>
            </div>
        );
    }

    const isAcknowledged = report.status === "ACKNOWLEDGED";

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mg-card rounded-2xl overflow-hidden ${className}`}>
            {/* Header */}
            <div className={`px-6 py-4 border-b border-mg-lavender/10 ${isAcknowledged ? "bg-status-success/5" : "bg-mg-cosmic/5"}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isAcknowledged ? "bg-status-success/10 border-2 border-status-success/30" : "bg-mg-cosmic/10 border-2 border-mg-cosmic/30"}`}>
                            {isAcknowledged ? (
                                <CheckCircle className="w-5 h-5 text-status-success" />
                            ) : (
                                <Clock className="w-5 h-5 text-mg-cosmic" />
                            )}
                        </div>
                        <div>
                            <p className="font-semibold text-mg-silver">Assurance Report</p>
                            <p className="text-[10px] text-mg-dim">
                                {isAcknowledged ? "Acknowledged" : "Pending Review"}
                            </p>
                        </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${isAcknowledged ? "bg-status-success/10 text-status-success border border-status-success/30" : "bg-mg-cosmic/10 text-mg-cosmic border border-mg-cosmic/30"}`}>
                        {report.status}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
                {/* Usage Category */}
                <div>
                    <p className="text-xs uppercase tracking-widest font-semibold text-mg-dim mb-2">Usage Category</p>
                    <p className="text-sm font-semibold text-mg-silver">
                        {CATEGORY_LABELS[report.usageCategory] || report.usageCategory}
                    </p>
                </div>

                {/* Description */}
                {report.description && (
                    <div>
                        <p className="text-xs uppercase tracking-widest font-semibold text-mg-dim mb-2">Description</p>
                        <p className="text-sm text-mg-muted leading-relaxed">{report.description}</p>
                    </div>
                )}

                {/* Metadata */}
                <div className="pt-4 border-t border-mg-lavender/10 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-mg-dim">Submitted</span>
                        <span className="font-mono text-mg-muted">{formatDate(report.createdAt)}</span>
                    </div>
                    {isAcknowledged && report.acknowledgedAt && (
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-mg-dim">Acknowledged</span>
                            <span className="font-mono text-mg-muted">{formatDate(report.acknowledgedAt)}</span>
                        </div>
                    )}
                </div>

                {/* Acknowledge Button */}
                {canAcknowledge && !isAcknowledged && (
                    <button
                        onClick={handleAcknowledge}
                        disabled={acknowledging}
                        className="w-full py-2.5 rounded-lg bg-status-success text-white font-semibold text-sm hover:bg-status-success/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {acknowledging ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Acknowledging...</>
                        ) : (
                            <><CheckCircle className="w-4 h-4" /> Acknowledge Report</>
                        )}
                    </button>
                )}
            </div>
        </motion.div>
    );
};
