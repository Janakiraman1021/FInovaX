"use client";

import { useEffect, useState } from "react";
import { trustAPI, TimelineEvent } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, FileText, CheckCircle, XCircle, AlertCircle, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface InvoiceTimelineProps {
    invoiceId: string;
    className?: string;
}

export const InvoiceTimeline = ({ invoiceId, className = "" }: InvoiceTimelineProps) => {
    const [loading, setLoading] = useState(true);
    const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
    const [error, setError] = useState("");
    const [expanded, setExpanded] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("oneflow-token");
        if (!token || token.startsWith("mock.")) {
            setLoading(false);
            return;
        }

        const fetchTimeline = async () => {
            try {
                const res = await trustAPI.getInvoiceTimeline(token, invoiceId);
                setTimeline(res.data.timeline);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load timeline");
            } finally {
                setLoading(false);
            }
        };

        fetchTimeline();
    }, [invoiceId]);

    const getEventIcon = (event: string) => {
        if (event.includes("UPLOAD") || event.includes("REGISTER")) return FileText;
        if (event.includes("FINANCED") || event.includes("ACKNOWLEDGED")) return CheckCircle;
        if (event.includes("BLOCKED") || event.includes("DUPLICATE")) return XCircle;
        return Clock;
    };

    const getEventColor = (event: string) => {
        if (event.includes("FINANCED") || event.includes("ACKNOWLEDGED")) return "#059669";
        if (event.includes("BLOCKED") || event.includes("DUPLICATE")) return "#dc2626";
        return "#4a4e8f";
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
            <div className={`mg-card rounded-2xl p-6 ${className}`}>
                <div className="flex items-center gap-3 text-status-danger">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm">{error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`mg-card rounded-2xl overflow-hidden ${className}`}>
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full px-6 py-4 flex items-center justify-between border-b border-mg-lavender/10 hover:bg-mg-elevated/30 transition-colors">
                <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-mg-lavender" />
                    <div className="text-left">
                        <p className="font-semibold text-mg-silver text-sm">Invoice Timeline</p>
                        <p className="text-[10px] text-mg-dim">{timeline.length} events recorded</p>
                    </div>
                </div>
                {expanded ? <ChevronUp className="w-4 h-4 text-mg-dim" /> : <ChevronDown className="w-4 h-4 text-mg-dim" />}
            </button>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden">
                        <div className="p-6">
                            {timeline.length === 0 ? (
                                <p className="text-sm text-mg-dim text-center py-4 italic">No events recorded yet</p>
                            ) : (
                                <div className="space-y-4">
                                    {timeline.map((event, idx) => {
                                        const Icon = getEventIcon(event.event);
                                        const color = getEventColor(event.event);
                                        return (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                                                        style={{ background: `${color}15`, border: `2px solid ${color}40` }}>
                                                        <Icon className="w-4 h-4" style={{ color }} />
                                                    </div>
                                                    {idx < timeline.length - 1 && (
                                                        <div className="w-0.5 h-full min-h-[20px] bg-mg-lavender/20 mt-2" />
                                                    )}
                                                </div>
                                                <div className="flex-1 pb-4">
                                                    <div className="flex items-start justify-between gap-2 mb-1">
                                                        <p className="font-semibold text-mg-silver text-sm">
                                                            {event.event.replace(/_/g, " ")}
                                                        </p>
                                                        <span className="text-[10px] text-mg-dim whitespace-nowrap">
                                                            {formatDate(event.timestamp)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-mg-muted">
                                                        Type: <span className="font-mono text-mg-dim">{event.type}</span>
                                                    </p>
                                                    {Object.keys(event.details).length > 0 && (
                                                        <div className="mt-2 p-2 rounded-lg bg-mg-elevated/50 border border-mg-lavender/10">
                                                            <pre className="text-[10px] text-mg-dim font-mono overflow-x-auto">
                                                                {JSON.stringify(event.details, null, 2)}
                                                            </pre>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
