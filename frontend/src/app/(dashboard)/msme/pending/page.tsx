import FilteredInvoicePage from "@/components/finovax/FilteredInvoicePage";
import { Clock } from "lucide-react";

export default function PendingPage() {
    return (
        <FilteredInvoicePage
            title="Pending Verification"
            subtitle="Invoices awaiting lender review and blockchain registration"
            sectionLabel="MSME Portal"
            status="PENDING"
            emptyMessage="No pending invoices — all caught up!"
            accentClass="text-mg-lavender"
            icon={<Clock className="w-4 h-4" />}
            uploadLink
        />
    );
}
