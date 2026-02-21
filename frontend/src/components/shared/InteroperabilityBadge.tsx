"use client";

import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

interface InteroperabilityBadgeProps {
    className?: string;
}

export function InteroperabilityBadge({ className = "" }: InteroperabilityBadgeProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className={`inline-flex items-center gap-2.5 px-3.5 py-2 rounded-lg border transition-all hover:border-mg-cosmic/50 group ${className}`}
            style={{
                background: "rgba(79,70,229,0.05)",
                border: "1px solid rgba(79,70,229,0.15)",
            }}
            title="This invoice is verified via OneFlow Trust Layer with ERP & Core Banking compatibility"
        >
            <ShieldCheck className="w-4 h-4 text-mg-cosmic group-hover:text-mg-lavender transition-colors" />
            <span className="text-xs font-semibold text-mg-cosmic group-hover:text-mg-lavender transition-colors whitespace-nowrap">
                Verified via OneFlow <span className="hidden sm:inline">Trust Layer</span>
            </span>
        </motion.div>
    );
}
