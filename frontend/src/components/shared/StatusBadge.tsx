"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// All possible statuses (real backend + legacy mock)
export type InvoiceStatus =
    | "UPLOADED" | "FINANCED" | "BLOCKED"
    | "PENDING"  | "VERIFIED" | "FRAUD_ALERT";

interface StatusBadgeProps {
    status: string;
    className?: string;
}

type StatusCfg = { label: string; bg: string; border: string; text: string; dot: string };

const statusConfig: Record<string, StatusCfg> = {
    UPLOADED: {
        label:  "Uploaded",
        bg:     "rgba(74,78,143,0.10)",
        border: "rgba(74,78,143,0.25)",
        text:   "#4a4e8f",
        dot:    "#4a4e8f",
    },
    PENDING: {
        label:  "Pending",
        bg:     "rgba(74,78,143,0.10)",
        border: "rgba(74,78,143,0.25)",
        text:   "#4a4e8f",
        dot:    "#4a4e8f",
    },
    VERIFIED: {
        label:  "Verified",
        bg:     "rgba(79,70,229,0.10)",
        border: "rgba(79,70,229,0.28)",
        text:   "#4f46e5",
        dot:    "#4f46e5",
    },
    FINANCED: {
        label:  "Financed",
        bg:     "rgba(5,150,105,0.10)",
        border: "rgba(5,150,105,0.28)",
        text:   "#059669",
        dot:    "#059669",
    },
    BLOCKED: {
        label:  "Blocked",
        bg:     "rgba(220,38,38,0.10)",
        border: "rgba(220,38,38,0.30)",
        text:   "#dc2626",
        dot:    "#dc2626",
    },
    FRAUD_ALERT: {
        label:  "Fraud Alert",
        bg:     "rgba(220,38,38,0.10)",
        border: "rgba(220,38,38,0.30)",
        text:   "#dc2626",
        dot:    "#dc2626",
    },
};

const DEFAULT_CFG: StatusCfg = {
    label:  "Unknown",
    bg:     "rgba(120,120,120,0.10)",
    border: "rgba(120,120,120,0.25)",
    text:   "#888",
    dot:    "#888",
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
    const cfg = statusConfig[status] ?? DEFAULT_CFG;
    return (
        <motion.div
            animate={
                status === "PENDING" || status === "UPLOADED"
                    ? { opacity: [0.7, 1, 0.7] }
                    : status === "FRAUD_ALERT" || status === "BLOCKED"
                    ? { scale: [1, 1.05, 1] }
                    : { opacity: 1 }
            }
            transition={
                status === "PENDING" || status === "UPLOADED" || status === "FRAUD_ALERT" || status === "BLOCKED"
                    ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
                    : {}
            }
            className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider",
                status === "FRAUD_ALERT" && "animate-shake",
                className
            )}
            style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.text }}
        >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
            {cfg.label}
        </motion.div>
    );
};
