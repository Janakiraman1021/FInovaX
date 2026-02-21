import FilteredInvoicePage from "@/components/finovax/FilteredInvoicePage";
import { CheckCircle } from "lucide-react";

export default function FinancedPage() {
    return (
        <FilteredInvoicePage
            title="Financed Invoices"
            subtitle="Invoices that have been fully funded by a lender"
            sectionLabel="MSME Portal"
            status="FINANCED"
            emptyMessage="No financed invoices yet — upload and get verified first"
            accentClass="text-status-success"
            icon={<CheckCircle className="w-4 h-4" />}
            iconBg="rgba(5,150,105,0.10)"
            uploadLink
        />
    );
}