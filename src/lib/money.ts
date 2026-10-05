/**
 * Money helpers. Amounts are stored as Postgres DECIMAL(12,2) and travel through
 * the app as decimal strings ("1001.00"). No floating point arithmetic is used
 * for stored values; totals are computed by the database.
 */

const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formats a decimal string or number as ₹1,001.00 */
export function formatINR(value: string | number | { toString(): string }): string {
  const str = typeof value === "string" ? value : value.toString();
  const num = Number(str);
  if (!Number.isFinite(num)) return "₹0.00";
  return INR_FORMATTER.format(num);
}

/** Formats without decimals when whole: ₹1,001 (used in share messages). */
export function formatINRCompact(value: string | number | { toString(): string }): string {
  const str = typeof value === "string" ? value : value.toString();
  const num = Number(str);
  if (!Number.isFinite(num)) return "₹0";
  const whole = Number.isInteger(num);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Normalises user input like "1,001.5" into a canonical decimal string "1001.50".
 * Returns null when the input is not a valid positive amount with at most two decimals.
 */
export function parseAmountInput(input: string): string | null {
  const cleaned = input.replace(/[₹,\s]/g, "");
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, frac = ""] = cleaned.split(".");
  const normalised = `${whole.replace(/^0+(?=\d)/, "")}.${frac.padEnd(2, "0")}`;
  if (Number(normalised) <= 0) return null;
  return normalised;
}

/** Splits a decimal string into rupees and paise integers. */
export function splitAmount(value: string): { rupees: number; paise: number } {
  const [whole, frac = "00"] = value.split(".");
  return { rupees: Number(whole), paise: Number(frac.padEnd(2, "0").slice(0, 2)) };
}

/**
 * Amount as written in the receipt's "ரூ." box: "2,500/-" for whole rupees,
 * "2,500.50" otherwise. The currency symbol is omitted because the box is
 * pre-printed with "ரூ.".
 */
export function formatReceiptAmount(value: string | number | { toString(): string }): string {
  const str = typeof value === "string" ? value : value.toString();
  const num = Number(str);
  if (!Number.isFinite(num)) return "0/-";
  const whole = Number.isInteger(num);
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(num);
  return whole ? `${formatted}/-` : formatted;
}
