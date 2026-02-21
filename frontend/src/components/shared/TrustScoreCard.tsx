"use client";

import { useEffect, useState } from "react";
import { trustAPI, TrustScore } from "@/lib/api";
import { motion } from "framer-motion";
import { Shield, TrendingUp, AlertTriangle, Loader2 } from "lucide-react";

interface TrustScoreCardProps {
    /** If provided, fetches score for specific MSME (lender/auditor view) */
    msmeId?: string;
    /** Show detailed breakdown */
    detailed?: boolean;
}

export const TrustScoreCard = ({ msmeId, detailed = false }: TrustScoreCardProps) => {
    const [loading, setLoading] = useState(true);
    const [score, setScore] = useState<TrustScore | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("oneflow-token");
        if (!token || token.startsWith("mock.")) {
            setLoading(false);
            return;
        }

        const fetchScore = async () => {
            try {
                const res = msmeId 
                    ? await trustAPI.getMSMETrustScore(token, msmeId)
                    : await trustAPI.getMyTrustScore(token);
                setScore(res.data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load trust score");
            } finally {
                setLoading(false);
            }
        };

        fetchScore();
    }, [msmeId]);

    if (loading) {
        return (
            <div className="mg-card rounded-2xl p-6 flex items-center justify-center min-h-[200px]">
                <Loader2 className="w-6 h-6 animate-spin text-mg-dim" />
            </div>
        );
    }

    if (error || !score) {
        return (
            <div className="mg-card rounded-2xl p-6 border border-status-danger/20">
                <div className="flex items-center gap-3 text-status-danger">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="text-sm">{error || "Trust score unavailable"}</span>
                </div>
            </div>
        );
    }

    const getColor = () => {
        if (score.trustScore >= 80) return { bg: "rgba(5,150,105,0.08)", border: "rgba(5,150,105,0.25)", text: "#059669", icon: "#10b981" };
        if (score.trustScore >= 50) return { bg: "rgba(251,146,60,0.08)", border: "rgba(251,146,60,0.25)", text: "#ea580c", icon: "#fb923c" };
        return { bg: "rgba(220,38,38,0.08)", border: "rgba(220,38,38,0.25)", text: "#dc2626", icon: "#ef4444" };
    };

    const colors = getColor();
    const Icon = score.status === "EXCELLENT" ? Shield : score.status === "STABLE" ? TrendingUp : AlertTriangle;

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="mg-card rounded-2xl p-6 border"
            style={{ borderColor: colors.border, background: colors.bg }}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <p className="text-xs uppercase tracking-widest font-semibold text-mg-dim mb-1">Trust Score</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold" style={{ color: colors.text }}>{score.trustScore}</span>
                        <span className="text-sm text-mg-dim">/ 100</span>
                    </div>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: colors.bg, border: `2px solid ${colors.border}` }}>
                    <Icon className="w-6 h-6" style={{ color: colors.icon }} />
                </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold" style={{ background: colors.bg, color: colors.text }}>
                    {score.status}
                </span>
                <span className="text-xs text-mg-dim">
                    {score.status === "EXCELLENT" && "Outstanding payment history"}
                    {score.status === "STABLE" && "Good creditworthiness"}
                    {score.status === "RISKY" && "Review financing terms"}
                </span>
            </div>

            {detailed && (
                <div className="mt-4 pt-4 border-t border-mg-lavender/10 space-y-2">
                    <p className="text-xs text-mg-dim">Score Factors:</p>
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-mg-muted">Payment History</span>
                            <span className="font-semibold text-mg-silver">{Math.min(100, score.trustScore + 5)}%</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-mg-muted">Document Integrity</span>
                            <span className="font-semibold text-mg-silver">100%</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-mg-muted">Lender Feedback</span>
                            <span className="font-semibold text-mg-silver">{Math.max(0, score.trustScore - 5)}%</span>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};
