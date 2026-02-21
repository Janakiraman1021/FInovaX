"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Invoice } from "@/lib/mock/mockInvoices";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import { ClipboardCheck, Download, Search, ShieldCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const AUDIT_ACTIONS = [
    "user_registered",
    "user_login",
    "invoice_uploaded",
    "invoice_registered_on_chain",
    "invoice_financed",
    "invoice_verified",
    "finance_blocked_duplicate",
] as const;

type AuditAction = typeof AUDIT_ACTIONS[number];

export default function AuditFile() {
    const [invoices, setInvoices]   = useState<Invoice[]>([]);
    const [query, setQuery]         = useState("");
    const [loading, setLoading]     = useState(true);
    const [actionMap, setActionMap] = useState<Record<string, AuditAction>>({});

    useEffect(() => {
        api.invoices.getAll().then(data => { setInvoices(data); setLoading(false); });
    }, []);

    const setAction = (id: string, action: AuditAction) => {
        setActionMap(prev => ({ ...prev, [id]: action }));
    };

    const applyAction = async (inv: Invoice) => {
        const action = actionMap[inv.id];
        if (!action) { toast.error("Select an action first."); return; }
        await new Promise(r => setTimeout(r, 600));
        toast.success(`Action logged: ${action.replace(/_/g, " ")}`, { description: `Invoice: ${inv.id}` });
    };

    const handleExport = () => {
        const rows = [["Invoice ID", "Company", "Amount", "Date", "Status", "Audit Action"],
            ...invoices.map(i => [i.id, i.borrower ?? "", String(i.amount), formatDate(i.timestamp), i.status, actionMap[i.id] ?? "—"])];
        const csv = rows.map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = "audit-export.csv"; a.click();
        URL.revokeObjectURL(url);
        toast.success("Audit file exported");
    };

    const filtered = invoices.filter(i => !query || i.id.toLowerCase().includes(query.toLowerCase()) || (i.borrower ?? "").toLowerCase().includes(query.toLowerCase()));

    return (
        <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <p className="mg-label mb-1.5">Regulator View</p>
                    <h1 className="text-3xl font-bold text-mg-silver tracking-tight">
                        Audit <span className="mg-accent-text">Controls</span>
                    </h1>
                    <p className="text-sm text-mg-muted mt-1">Log regulatory audit actions against invoices and export records</p>
                </div>
                <button onClick={handleExport} className="mg-btn-primary gap-2">
                    <Download className="w-4 h-4" /> Export CSV
                </button>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mg-card rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-mg-lavender/10 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(74,78,143,0.09)", border: "1px solid rgba(74,78,143,0.20)" }}>
                            <ClipboardCheck className="w-4 h-4 text-mg-lavender" />
                        </div>
                        <p className="font-semibold text-mg-silver text-sm">{filtered.length} invoices</p>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-mg-dim" />
                        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search…" className="mg-input pl-8 text-sm w-48" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? <div className="py-16 text-center text-mg-dim text-sm italic">Loading…</div>
                    : (
                        <table className="w-full mg-table">
                            <thead>
                                <tr>
                                    <th>Invoice ID</th><th>Company</th><th>Amount</th><th>Date</th><th>Status</th><th>Audit Action</th><th>Apply</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(inv => (
                                    <tr key={inv.id}>
                                        <td><span className="font-mono font-semibold text-mg-silver">{inv.id}</span></td>
                                        <td>{inv.borrower}</td>
                                        <td><span className="font-bold text-mg-cosmic">{formatCurrency(inv.amount)}</span></td>
                                        <td>{formatDate(inv.timestamp)}</td>
                                        <td><StatusBadge status={inv.status} /></td>
                                        <td>
                                            <select value={actionMap[inv.id] ?? ""} onChange={e => setAction(inv.id, e.target.value as AuditAction)}
                                                className="mg-input text-xs py-1.5 px-2 min-w-[200px]">
                                                <option value="">— select action —</option>
                                                {AUDIT_ACTIONS.map(a => <option key={a} value={a}>{a.replace(/_/g, " ")}</option>)}
                                            </select>
                                        </td>
                                        <td>
                                            <button onClick={() => applyAction(inv)} disabled={!actionMap[inv.id]}
                                                className="p-1.5 rounded-lg transition-colors disabled:opacity-30 text-mg-cosmic hover:bg-mg-cosmic/10">
                                                <ShieldCheck className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </motion.div>

            {/* Audit action legend */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="mg-card rounded-2xl p-6">
                <p className="mg-label mb-4">Audit Action Reference</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {AUDIT_ACTIONS.map(a => (
                        <div key={a} className="flex items-center gap-2.5 p-3 rounded-xl bg-mg-elevated border border-mg-lavender/08">
                            {a.includes("blocked") || a.includes("fraud")
                                ? <AlertTriangle className="w-3.5 h-3.5 text-status-danger shrink-0" />
                                : <ShieldCheck className="w-3.5 h-3.5 text-status-success shrink-0" />}
                            <span className="text-xs font-medium text-mg-muted">{a.replace(/_/g, " ")}</span>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
