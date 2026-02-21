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
    gradient: string;
    glow: string;
    dot: string;
}> = {
    PENDING: {
        label: "Pending",
        gradient: "from-galaxy-purple to-galaxy-pink",
        glow:     "shadow-[0_0_14px_rgba(124,58,237,0.60)]",
        dot:      "bg-galaxy-lavender",
    },
    VERIFIED: {
        label: "Verified",
        gradient: "from-galaxy-cyan to-indigo-500",
        glow:     "shadow-[0_0_14px_rgba(6,182,212,0.55)]",
        dot:      "bg-galaxy-cyan",
    },
    FINANCED: {
        label: "Financed",
        gradient: "from-emerald-500 to-galaxy-cyan",
        glow:     "shadow-[0_0_14px_rgba(16,185,129,0.55)]",
        dot:      "bg-emerald-400",
    },
    FRAUD_ALERT: {
        label: "Fraud Alert",
        gradient: "from-red-600 to-orange-500",
        glow:     "shadow-[0_0_18px_rgba(239,68,68,0.75)]",
        dot:      "bg-red-400",
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
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white",
                `bg-gradient-to-r ${cfg.gradient}`,
                cfg.glow,
                status === "FRAUD_ALERT" && "animate-shake",
                className
            )}
        >
            <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot, "opacity-90")} />
            {cfg.label}
        </motion.div>
    );
};
