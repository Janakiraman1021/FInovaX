import FilteredInvoicePage from "@/components/finovax/FilteredInvoicePage";
import { AlertTriangle } from "lucide-react";

export default function FraudAlertPage() {
    return (
        <FilteredInvoicePage
            title="Fraud Alerts"
            subtitle="Invoices flagged by the blockchain duplicate-financing detector"
            sectionLabel="MSME Portal"
            status="FRAUD_ALERT"
            emptyMessage="No fraud alerts detected — your portfolio is clean"
            accentClass="text-status-danger"
            icon={AlertTriangle}
            iconBg="rgba(220,38,38,0.08)"
        />
    );
}
