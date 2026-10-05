export const APP_NAME = "Selva Muthukumarasamy Temple";
export const APP_SHORT_NAME = "SMT Donations";
export const SESSION_COOKIE = "smt_session";
export const SESSION_DURATION_SECONDS = 12 * 60 * 60; // 12 hours
/** Rows per page in every paginated table (donations, expenditures, report transactions). */
export const PAGE_SIZE = 10;
/** Prefix for expense voucher numbers, e.g. EXP-2026-000001. */
export const EXPENSE_VOUCHER_PREFIX = "EXP";
export const IST_TIME_ZONE = "Asia/Kolkata";

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  UPI: "UPI",
  BANK_TRANSFER: "Bank Transfer",
  CHEQUE: "Cheque",
  OTHER: "Other",
};

export function appUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  return url || "http://localhost:3000";
}
