"use client";

// OneFlow surfaces trust signals without interfering with lending decisions.

import { motion } from "framer-motion";
import { CircleDot, Info } from "lucide-react";
import { useState } from "react";

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

interface ConfidenceBadgeProps {
    confidence: ConfidenceLevel;
    className?: string;
}

const config: Record<ConfidenceLevel, {
    label: string;
    bg: string;
    border: string;
    text: string;
    dot: string;
    tooltip: string;
}> = {
    HIGH: {
        label:   "High Confidence",
        bg:      "rgba(5,150,105,0.09)",
        border:  "rgba(5,150,105,0.28)",
        text:    "#059669",
        dot:     "#059669",
        tooltip: "Consistent receivable data across submissions",
    },
    MEDIUM: {
        label:   "Medium Confidence",
        bg:      "rgba(234,179,8,0.09)",
        border:  "rgba(234,179,8,0.30)",
        text:    "#ca8a04",
        dot:     "#ca8a04",
        tooltip: "Manually entered data, not yet corroborated",
    },
    LOW: {
        label:   "Low Confidence",
        bg:      "rgba(220,38,38,0.09)",
        border:  "rgba(220,38,38,0.28)",
        text:    "#dc2626",
        dot:     "#dc2626",
        tooltip: "Inconsistent or risky data patterns detected",
    },
};

export function ConfidenceBadge({ confidence, className = "" }: ConfidenceBadgeProps) {
    const [showTip, setShowTip] = useState(false);
    const c = config[confidence] ?? config.MEDIUM;

    return (
        <div className={`relative inline-flex items-center gap-1.5 ${className}`}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold"
                style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}
            >
                <CircleDot className="w-3 h-3 shrink-0" style={{ color: c.dot }} />
                <span>{c.label}</span>
            </motion.div>

            {/* Info icon with tooltip */}
            <div className="relative"
                onMouseEnter={() => setShowTip(true)}
                onMouseLeave={() => setShowTip(false)}>
                <Info className="w-3.5 h-3.5 text-mg-dim hover:text-mg-muted cursor-help transition-colors" />
                {showTip && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
                                   w-52 px-3 py-2 rounded-lg text-[11px] text-mg-muted leading-relaxed
                                   bg-mg-elevated border border-mg-lavender/20 shadow-xl pointer-events-none"
                    >
                        {c.tooltip}
                        {/* Caret */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0
                                        border-l-4 border-r-4 border-t-4
                                        border-l-transparent border-r-transparent border-t-mg-lavender/20" />
                    </motion.div>
                )}
            </div>
        </div>
    );
}
