import type { ReportType } from "./query";

/** One "Filter by" choice on the Reports page. `kind` decides which value control is shown. */
export interface ReportFilterOption {
  key: ReportFilterKey;
  label: string;
  kind: "category" | "payment" | "text";
  placeholder?: string;
}

export type ReportFilterKey = "category" | "payment" | "donor" | "receipt" | "manual" | "paidTo" | "voucher";

export const REPORT_FILTERS: Record<ReportType, ReportFilterOption[]> = {
  donations: [
    { key: "category", label: "Category", kind: "category" },
    { key: "payment", label: "Payment", kind: "payment" },
    { key: "donor", label: "Donor name", kind: "text", placeholder: "Donor name" },
    { key: "receipt", label: "Receipt no.", kind: "text", placeholder: "Receipt no." },
    { key: "manual", label: "Manual receipt no.", kind: "text", placeholder: "Manual receipt no." },
  ],
  expenses: [
    { key: "category", label: "Category", kind: "category" },
    { key: "payment", label: "Payment", kind: "payment" },
    { key: "paidTo", label: "Paid to", kind: "text", placeholder: "Paid to" },
    { key: "voucher", label: "Voucher no.", kind: "text", placeholder: "Voucher no." },
  ],
};

export const REPORT_FILTER_KEYS = ["category", "payment", "donor", "receipt", "manual", "paidTo", "voucher"] as const satisfies readonly ReportFilterKey[];

export function findReportFilter(type: ReportType, key: string | undefined): ReportFilterOption | undefined {
  return REPORT_FILTERS[type].find((f) => f.key === key);
}
