import "server-only";
import { toCsv } from "@/lib/csv";
import { formatDonationDate, formatDateTime } from "@/lib/dates";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import type { DonationWithRelations } from "@/lib/donations/service";

/**
 * Report exporters. Each format implements the same interface so an Excel
 * (xlsx) exporter can be added later without touching the route handler.
 */
export interface ReportExporter {
  contentType: string;
  extension: string;
  build(rows: DonationWithRelations[]): Promise<Uint8Array | string>;
}

const COLUMNS = [
  "Receipt Number",
  "Donation Date",
  "Donor Name",
  "Mobile",
  "Email",
  "Category",
  "Payment Method",
  "Transaction Reference",
  "Amount (INR)",
  "Status",
  "Notes",
  "Created By",
  "Created At (IST)",
  "Cancelled At (IST)",
  "Cancelled By",
  "Cancellation Reason",
];

export const csvExporter: ReportExporter = {
  contentType: "text/csv; charset=utf-8",
  extension: "csv",
  async build(rows) {
    return toCsv(
      COLUMNS,
      rows.map((d) => [
        d.receiptNumber,
        formatDonationDate(d.donationDate),
        d.donor.name,
        d.donor.mobile,
        d.donor.email,
        d.category.name,
        PAYMENT_METHOD_LABELS[d.paymentMethod] ?? d.paymentMethod,
        d.transactionReference,
        d.amount.toFixed(2),
        d.status,
        d.notes,
        d.createdBy.name,
        formatDateTime(d.createdAt),
        d.cancelledAt ? formatDateTime(d.cancelledAt) : "",
        d.cancelledBy?.name,
        d.cancellationReason,
      ]),
    );
  },
};

export const exporters: Record<string, ReportExporter> = {
  csv: csvExporter,
  // xlsx: excelExporter, // Future: implement with a library such as exceljs.
};
