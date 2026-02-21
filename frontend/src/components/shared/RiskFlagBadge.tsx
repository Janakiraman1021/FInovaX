"use client";

// OneFlow surfaces trust signals without interfering with lending decisions.

import { motion } from "framer-motion";
import { AlertTriangle, Info } from "lucide-react";
import { useState } from "react";

interface RiskFlagBadgeProps {
    riskFlag: string;
    className?: string;
}

// Maps backend riskFlag codes → human-readable label
const labelMap: Record<string, string> = {
    NEEDS_REVIEW:          "Needs Review",
    HIGH_RISK:             "High Risk",
    DUPLICATE_PATTERN:     "Duplicate Pattern",
    SUSPICIOUS_SUBMISSION: "Suspicious Submission",
};

const TOOLTIP =
    "The system has detected behavioral patterns that may require manual review.";

export function RiskFlagBadge({ riskFlag, className = "" }: RiskFlagBadgeProps) {
    const [showTip, setShowTip] = useState(false);

    // Only render for non-CLEAR / non-empty flags
    if (!riskFlag || riskFlag === "CLEAR" || riskFlag === "NONE") return null;

    const label = labelMap[riskFlag] ?? riskFlag.replace(/_/g, " ");

    return (
        <div className={`relative inline-flex items-center gap-1.5 ${className}`}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold"
                style={{
                    background: "rgba(251,146,60,0.09)",
                    border:     "1px solid rgba(251,146,60,0.30)",
                    color:      "#f97316",
                }}
            >
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>⚠ {label}</span>
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
                                   w-64 px-3 py-2 rounded-lg text-[11px] text-mg-muted leading-relaxed
                                   bg-mg-elevated border border-mg-lavender/20 shadow-xl pointer-events-none"
                    >
                        {TOOLTIP}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0
                                        border-l-4 border-r-4 border-t-4
                                        border-l-transparent border-r-transparent border-t-mg-lavender/20" />
                    </motion.div>
                )}
            </div>
        </div>
    );
}
