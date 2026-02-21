"use client";

import { motion } from "framer-motion";
import { FileSearch, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
    const router = useRouter();

    return (
        <div className="min-h-screen flex items-center justify-center bg-mg-base px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-mg-cosmic/10 border border-mg-cosmic/25 flex items-center justify-center mx-auto">
                    <FileSearch className="w-10 h-10 text-mg-cosmic" />
                </div>
                <div>
                    <p className="mg-label mb-2">Error 404</p>
                    <h1 className="text-5xl font-black text-mg-silver tracking-tight mb-2">404</h1>
                    <h2 className="text-xl font-bold text-mg-silver">Page <span className="mg-accent-text">Not Found</span></h2>
                    <p className="text-mg-muted mt-3 max-w-sm mx-auto">The page you are looking for does not exist or has been moved.</p>
                </div>
                <div className="flex gap-3 justify-center">
                    <button onClick={() => router.back()}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-mg-lavender/20 text-sm font-medium text-mg-muted hover:text-mg-silver hover:border-mg-lavender/40 transition-all">
                        <ArrowLeft className="w-4 h-4" /> Go Back
                    </button>
                    <Link href="/" className="mg-btn-primary gap-2">
                        <Home className="w-4 h-4" /> Home
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
