"use client";

import { useEffect, useState, useCallback } from "react";
import { authAPI, LenderListItem } from "@/lib/api";
import { motion } from "framer-motion";
import { Building2, RefreshCw, AlertCircle, Landmark, Mail, Search } from "lucide-react";

export default function LendersPage() {
    const [lenders, setLenders]   = useState<LenderListItem[]>([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState("");
    const [query, setQuery]       = useState("");

    const fetchLenders = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const token = localStorage.getItem("finovax-token") ?? "";
            if (!token || token.startsWith("mock.")) {
                setError("Please log in with a real account to view lenders.");
                setLoading(false);
                return;
            }
            const res = await authAPI.getLenders(token);
            setLenders(res.data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to load lenders");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchLenders(); }, [fetchLenders]);

    const filtered = lenders.filter(l =>
        query === "" ||
        l.name.toLowerCase().includes(query.toLowerCase()) ||
        (l.organization ?? "").toLowerCase().includes(query.toLowerCase()) ||
        l.email.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <p className="mg-label mb-1.5">MSME Portal</p>
                    <h1 className="text-3xl font-bold text-mg-silver tracking-tight">
                        Discover <span className="mg-accent-text">Lenders</span>
                    </h1>
                    <p className="text-sm text-mg-muted mt-1">
                        {loading ? "Loading…" : `${lenders.length} lender${lenders.length !== 1 ? "s" : ""} available on the platform`}
                    </p>
                </div>
                <button
                    onClick={fetchLenders}
                    disabled={loading}
                    className="mg-btn-ghost border border-mg-lavender/20 px-3 py-2 rounded-xl text-mg-muted hover:text-mg-silver transition-colors flex items-center gap-1.5 text-sm disabled:opacity-40"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </motion.div>

            {/* Search */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mg-dim" />
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search by name, organisation or email…"
                        className="mg-input pl-9 w-full"
                    />
                </div>
            </motion.div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 p-4 rounded-xl text-sm text-status-danger"
                    style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.18)" }}>
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                    <button onClick={fetchLenders} className="ml-auto text-xs underline">Retry</button>
                </div>
            )}

            {/* Lender grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="mg-card rounded-2xl p-6 animate-pulse space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-mg-elevated" />
                                <div className="space-y-1.5 flex-1">
                                    <div className="h-3 bg-mg-elevated rounded w-3/4" />
                                    <div className="h-2.5 bg-mg-elevated rounded w-1/2" />
                                </div>
                            </div>
                            <div className="h-2.5 bg-mg-elevated rounded w-full" />
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-20 text-center">
                    <Landmark className="w-10 h-10 text-mg-dim mx-auto mb-3" />
                    <p className="text-mg-muted text-sm italic">
                        {query ? "No lenders match your search." : "No lenders registered yet."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((lender, i) => (
                        <motion.div
                            key={lender._id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className="mg-card rounded-2xl p-6 hover:border-mg-lavender/30 transition-all group"
                        >
                            <div className="flex items-start gap-4 mb-4">
                                <div
                                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
                                    style={{
                                        background: "linear-gradient(135deg, rgba(74,78,143,0.18), rgba(107,94,160,0.18))",
                                        border: "1px solid rgba(74,78,143,0.25)",
                                    }}
                                >
                                    <Building2 className="w-5 h-5 text-mg-lavender" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-mg-silver text-sm truncate">{lender.name}</p>
                                    <p className="text-xs text-mg-muted truncate mt-0.5">{lender.organization || "—"}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-mg-dim">
                                <Mail className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{lender.email}</span>
                            </div>

                            <div className="mt-4 pt-4 border-t border-mg-lavender/08">
                                <p className="text-[10px] uppercase tracking-widest font-semibold text-mg-cosmic">
                                    Verified Lender
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
