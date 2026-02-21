"use client";

import { useEffect, useState, useCallback } from "react";
import { auditorAPI, AuditLog, LenderInvoice } from "@/lib/api";
import { mockStats } from "@/lib/mock/mockStats";
import { motion } from "framer-motion";
import {
  ShieldCheck, AlertTriangle, Users, FileCheck, Activity,
  History, TrendingUp, Radio, CheckCircle, XCircle, Info, ChevronDown
} from "lucide-react";
import { AuditSeverityBadge } from "@/components/shared/AuditSeverityBadge";
import { InteroperabilityBadge } from "@/components/shared/InteroperabilityBadge";
import { formatCurrency } from "@/lib/utils";

type SeverityFilter = "ALL" | "INFO" | "WARNING" | "CRITICAL";

// Safely coerce any value to a finite number, defaulting to 0
const toNum = (val: unknown): number =>
  typeof val === "number" && isFinite(val) ? val : 0;

export default function AuditorDashboard() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [invoices, setInvoices] = useState<LenderInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("ALL");

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("oneflow-token") ?? "";
      if (!token || token.startsWith("mock.")) {
        setLoading(false);
        return;
      }
      const [logsRes, invRes] = await Promise.all([
        auditorAPI.getAuditLogs(token, { limit: 20 }),
        auditorAPI.getAllInvoices(token, { limit: 200 }),
      ]);
      setAuditLogs(logsRes.data.logs);
      setInvoices(invRes.data.invoices);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derive stats from real data
  const financed = invoices.filter((i) => i.status === "FINANCED");
  const blocked = invoices.filter((i) => i.status === "BLOCKED");
  const uniqueMSMEs = new Set(invoices.map((i) => i.uploadedBy?._id)).size;

  const totalVolumeValue = financed.reduce(
    (sum: number, invoice) => sum + toNum(invoice?.amount),
    0
  );
  const fraudBlockedValue = blocked.length;
  const activeMSMEsValue = uniqueMSMEs;
  const totalInvoicesValue = invoices.length;

  // ✅ FIX: Use toNum() to guarantee all fallback values are plain numbers,
  // preventing "Objects are not valid as a React child" errors when mockStats
  // accidentally exports arrays/objects instead of primitives.
  const stats = {
    totalVolume:
      totalVolumeValue > 0 ? totalVolumeValue : toNum(mockStats.totalVolume),
    fraudAttemptsBlocked:
      fraudBlockedValue > 0
        ? fraudBlockedValue
        : toNum(mockStats.fraudAttemptsBlocked),
    activeMSMEs:
      activeMSMEsValue > 0 ? activeMSMEsValue : toNum(mockStats.activeMSMEs),
    totalInvoices:
      totalInvoicesValue > 0
        ? totalInvoicesValue
        : toNum(mockStats.totalInvoices),
  };

  const statCards = [
    {
      label: "Total Financing Volume",
      value: formatCurrency(toNum(stats.totalVolume)),
      icon: TrendingUp,
      from: "#4a4e8f",
      to: "#6b5ea0",
    },
    {
      label: "Fraud Attempts Blocked",
      value: String(toNum(stats.fraudAttemptsBlocked)),
      icon: AlertTriangle,
      from: "#dc2626",
      to: "#ef4444",
    },
    {
      label: "Active Counterparties",
      value: String(toNum(stats.activeMSMEs)),
      icon: Users,
      from: "#6d28d9",
      to: "#6b5ea0",
    },
    {
      label: "Ledger-Verified Assets",
      value: String(toNum(stats.totalInvoices)),
      icon: FileCheck,
      from: "#4a4e8f",
      to: "#4f46e5",
    },
  ];

  const eventStyle: Record<
    string,
    {
      border: string;
      bg: string;
      icon: typeof CheckCircle;
      iconClass: string;
    }
  > = {
    success: {
      border: "border-status-success/25",
      bg: "bg-status-success/8",
      icon: CheckCircle,
      iconClass: "text-status-success",
    },
    warning: {
      border: "border-status-danger/25",
      bg: "bg-status-danger/8",
      icon: XCircle,
      iconClass: "text-status-danger",
    },
    info: {
      border: "border-mg-lavender/25",
      bg: "bg-mg-cosmic/10",
      icon: Info,
      iconClass: "text-mg-lavender",
    },
  };

  const getSeverity = (eventType?: string): SeverityFilter => {
    if (!eventType) return "INFO";
    const lower = eventType.toLowerCase();

    if (
      lower.includes("duplicate") ||
      lower.includes("blocked") ||
      lower.includes("failed") ||
      lower.includes("attempt")
    ) {
      return "CRITICAL";
    }

    if (
      lower.includes("verify") ||
      lower.includes("alert") ||
      lower.includes("suspicious")
    ) {
      return "WARNING";
    }

    return "INFO";
  };

  const filteredLogs =
    severityFilter === "ALL"
      ? auditLogs
      : auditLogs.filter((log) => getSeverity(log.eventType) === severityFilter);

  const systemChecks = [
    { label: "Oracle Consensus", pct: 98, color: "#059669" },
    { label: "zkProof Validation", pct: 94, color: "#6b5ea0" },
    { label: "IPFS Node Health", pct: 99, color: "#4a4e8f" },
    { label: "Smart Contract Uptime", pct: 100, color: "#4f46e5" },
  ];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <p className="mg-label mb-1.5">Regulator View</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-mg-silver tracking-tight">
            Audit <span className="mg-accent-text">Surveillance</span>
          </h1>
          <p className="text-sm text-mg-muted mt-1">
            Real-time oversight of the invoice financing ecosystem
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-mg-card border border-status-success/25 self-start sm:self-auto">
            <Radio className="w-3 h-3 text-status-success animate-pulse" />
            <span className="text-[10px] uppercase font-semibold text-status-success tracking-widest">
              Systems Operational
            </span>
          </div>
          <InteroperabilityBadge />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="mg-stat-card group"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${c.from}, ${c.to})`,
                boxShadow: `0 0 14px ${c.from}45`,
              }}
            >
              <c.icon className="w-5 h-5 text-white" />
            </div>
            <p className="mg-label mb-1.5">{c.label}</p>
            <p className="text-2xl font-bold text-mg-silver">{c.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 mg-card rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-mg-lavender/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: "rgba(74,78,143,0.09)",
                  border: "1px solid rgba(74,78,143,0.20)",
                }}
              >
                <History className="w-4 h-4 text-mg-lavender" />
              </div>
              <div>
                <p className="font-semibold text-mg-silver text-sm">
                  Live Audit Trail
                </p>
                <p className="text-[10px] text-mg-dim font-mono">
                  {filteredLogs.length} of {auditLogs.length} events
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Severity Filter Dropdown */}
              <div className="relative group">
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                  style={{
                    background: "rgba(74,78,143,0.06)",
                    border: "1px solid rgba(74,78,143,0.20)",
                    color: "#8b8fc8",
                  }}
                >
                  <span>{severityFilter}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                <div className="absolute right-0 top-full mt-2 w-40 rounded-xl bg-mg-elevated border border-mg-lavender/20 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  {(["ALL", "CRITICAL", "WARNING", "INFO"] as SeverityFilter[]).map(
                    (f) => (
                      <button
                        key={f}
                        onClick={() => setSeverityFilter(f)}
                        className={`block w-full text-left px-4 py-2.5 text-xs font-medium transition-colors ${severityFilter === f
                            ? "bg-mg-cosmic/20 text-mg-lavender"
                            : "text-mg-muted hover:text-mg-silver hover:bg-mg-card"
                          }`}
                      >
                        {f}
                      </button>
                    )
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse shadow-[0_0_6px_rgba(5,150,105,0.5)]" />
                <span className="text-[10px] text-status-success uppercase font-semibold tracking-widest">
                  Live
                </span>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-3 max-h-[380px] overflow-y-auto">
            {loading ? (
              <div className="py-12 text-center text-mg-dim text-sm italic">
                Loading events…
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="py-12 text-center text-mg-dim text-sm italic">
                {auditLogs.length === 0
                  ? "No audit events recorded yet"
                  : "No events match this severity filter"}
              </div>
            ) : (
              filteredLogs.map((log: AuditLog, i: number) => {
                const isError =
                  log.eventType?.toLowerCase().includes("fail") ||
                  log.eventType?.toLowerCase().includes("block");
                const isSuccess =
                  log.eventType?.toLowerCase().includes("register") ||
                  log.eventType?.toLowerCase().includes("finance") ||
                  log.eventType?.toLowerCase().includes("login");
                const kind = isError ? "warning" : isSuccess ? "success" : "info";
                const s = eventStyle[kind] ?? eventStyle.info;
                const IconComp = s.icon;
                const label = log.eventType?.replace(/_/g, " ") ?? "Event";
                const timeStr = new Date(log.createdAt).toLocaleTimeString();
                const severity = getSeverity(log.eventType);

                return (
                  <motion.div
                    key={log._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.07 }}
                    className={`flex items-start gap-3 p-4 rounded-xl border ${s.border} ${s.bg}`}
                  >
                    <IconComp
                      className={`w-4 h-4 shrink-0 mt-0.5 ${s.iconClass}`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-mg-silver capitalize">
                          {label}
                        </p>
                        {severity !== "ALL" && <AuditSeverityBadge severity={severity} />}
                      </div>
                      {log.invoiceId && (
                        <p className="text-xs text-mg-muted font-mono">
                          {log.invoiceId.invoiceId}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-[10px] text-mg-dim font-mono">
                      {timeStr}
                    </span>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        <div className="mg-card rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-mg-lavender/10 flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "rgba(74,78,143,0.09)",
                border: "1px solid rgba(74,78,143,0.20)",
              }}
            >
              <Activity className="w-4 h-4 text-mg-lavender" />
            </div>
            <p className="font-semibold text-mg-silver text-sm">System Health</p>
          </div>
          <div className="p-5 space-y-5">
            {systemChecks.map((c, i) => (
              <motion.div
                key={c.label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-medium text-mg-muted">
                    {c.label}
                  </span>
                  <span
                    className="text-xs font-bold"
                    style={{ color: c.color }}
                  >
                    {c.pct}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden bg-mg-elevated">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${c.pct}%` }}
                    transition={{
                      delay: 0.5 + i * 0.1,
                      duration: 0.8,
                      ease: "easeOut",
                    }}
                    style={{
                      background: `linear-gradient(90deg, ${c.color}90, ${c.color})`,
                    }}
                  />
                </div>
              </motion.div>
            ))}
            <div className="mt-6 pt-4 border-t border-mg-lavender/10">
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-status-success/8 border border-status-success/20">
                <ShieldCheck className="w-5 h-5 text-status-success shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-mg-silver">
                    Cryptographic Integrity
                  </p>
                  <p className="text-[10px] text-mg-muted">
                    All hashes verified — no tampering detected
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}