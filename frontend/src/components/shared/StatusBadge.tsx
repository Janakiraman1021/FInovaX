"use client";

import { InvoiceStatus } from "@/lib/mock/mockInvoices";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StatusBadgeProps {
    status: InvoiceStatus;
    className?: string;
}

const statusConfig: Record<InvoiceStatus, {
    label: string;
    bg: string;
    border: string;
    text: string;
    dot: string;
}> = {
    PENDING: {
        label:  "Pending",
        bg:     "rgba(74,78,143,0.18)",
        border: "rgba(164,144,194,0.28)",
        text:   "#a490c2",
        dot:    "#a490c2",
    },
    VERIFIED: {
        label:  "Verified",
        bg:     "rgba(74,78,143,0.18)",
        border: "rgba(129,140,248,0.30)",
        text:   "#818cf8",
        dot:    "#818cf8",
    },
    FINANCED: {
        label:  "Financed",
        bg:     "rgba(52,211,153,0.12)",
        border: "rgba(52,211,153,0.28)",
        text:   "#34d399",
        dot:    "#34d399",
    },
    FRAUD_ALERT: {
        label:  "Fraud Alert",
        bg:     "rgba(248,113,113,0.12)",
        border: "rgba(248,113,113,0.30)",
        text:   "#f87171",
        dot:    "#f87171",
    },
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
    const cfg = statusConfig[status];
    return (
        <motion.div
            animate={
                status === "PENDING"
                    ? { opacity: [0.7, 1, 0.7] }
                    : status === "FRAUD_ALERT"
                    ? { scale: [1, 1.05, 1] }
                    : { opacity: 1 }
            }
            transition={
                status === "PENDING" || status === "FRAUD_ALERT"
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
