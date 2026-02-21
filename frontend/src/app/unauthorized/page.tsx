"use client";

import { motion } from "framer-motion";
import { Lock, Home, LogIn } from "lucide-react";
import Link from "next/link";

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-mg-base px-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-status-danger/10 border border-status-danger/25 flex items-center justify-center mx-auto">
                    <Lock className="w-10 h-10 text-status-danger" />
                </div>
                <div>
                    <p className="mg-label mb-2">Error 403</p>
                    <h1 className="text-4xl font-bold text-mg-silver tracking-tight">Access <span className="mg-accent-text">Denied</span></h1>
                    <p className="text-mg-muted mt-3 max-w-sm mx-auto">You do not have permission to view this page. Please log in with an authorized account.</p>
                </div>
                <div className="flex gap-3 justify-center">
                    <Link href="/" className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-mg-lavender/20 text-sm font-medium text-mg-muted hover:text-mg-silver hover:border-mg-lavender/40 transition-all">
                        <Home className="w-4 h-4" /> Home
                    </Link>
                    <Link href="/login" className="mg-btn-primary gap-2">
                        <LogIn className="w-4 h-4" /> Sign In
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
