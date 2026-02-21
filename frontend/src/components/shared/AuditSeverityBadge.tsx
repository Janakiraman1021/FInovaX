"use client";

import { motion } from "framer-motion";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

type SeverityLevel = "INFO" | "WARNING" | "CRITICAL";

interface AuditSeverityBadgeProps {
    severity: SeverityLevel;
    label?: string;
    className?: string;
}

const severityConfig: Record<SeverityLevel, { bg: string; border: string; text: string; icon: typeof Info; label: string }> = {
    INFO: {
        bg: "rgba(74,78,143,0.10)",
        border: "rgba(74,78,143,0.25)",
        text: "#8b8fc8",
        icon: Info,
        label: "INFO",
    },
    WARNING: {
        bg: "rgba(251,146,60,0.10)",
        border: "rgba(251,146,60,0.30)",
        text: "#f97316",
        icon: AlertTriangle,
        label: "WARNING",
    },
    CRITICAL: {
        bg: "rgba(220,38,38,0.10)",
        border: "rgba(220,38,38,0.30)",
        text: "#dc2626",
        icon: AlertCircle,
        label: "CRITICAL",
    },
};

export function AuditSeverityBadge({ severity, label, className = "" }: AuditSeverityBadgeProps) {
    const config = severityConfig[severity] || severityConfig.INFO;
    const Icon = config.icon;
    const displayLabel = label || config.label;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${className}`}
            style={{
                background: config.bg,
                border: `1px solid ${config.border}`,
                color: config.text,
            }}
        >
            <Icon className="w-3.5 h-3.5" />
            <span>{displayLabel}</span>
        </motion.div>
    );
}
