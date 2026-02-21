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
    FRAUD_ALERT: {
        label:  "Fraud Alert",
        bg:     "rgba(220,38,38,0.10)",
        border: "rgba(220,38,38,0.30)",
        text:   "#dc2626",
        dot:    "#dc2626",
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
