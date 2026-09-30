import { IST_TIME_ZONE } from "@/lib/constants";

/** Indian Standard Time offset in minutes (no daylight saving). */
const IST_OFFSET_MINUTES = 330;

/** Returns the IST calendar date parts for a given instant. */
export function istDateParts(date: Date = new Date()): { year: number; month: number; day: number } {
  const shifted = new Date(date.getTime() + IST_OFFSET_MINUTES * 60_000);
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate() };
}

/** Today's date in IST as YYYY-MM-DD. */
export function todayIsoDate(): string {
  const { year, month, day } = istDateParts();
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** First day of the current IST month as YYYY-MM-DD. */
export function monthStartIsoDate(): string {
  const { year, month } = istDateParts();
  return `${year}-${pad2(month)}-01`;
}

/** Current IST year (used for receipt sequences). */
export function currentIstYear(): number {
  return istDateParts().year;
}

/**
 * Converts a YYYY-MM-DD string into a Date at UTC midnight. Donation dates are
 * stored as a Postgres DATE, which Prisma represents as UTC-midnight Dates.
 */
export function isoDateToUtcDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Converts a UTC-midnight Date (Postgres DATE) back to YYYY-MM-DD. */
export function utcDateToIso(date: Date): string {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = isoDateToUtcDate(value);
  return !Number.isNaN(d.getTime()) && utcDateToIso(d) === value;
}

/** Formats a DATE column value for Indian users: 30 Sep 2026. */
export function formatDonationDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** Formats an instant (timestamp) in IST: 30 Sep 2026, 6:45 pm. */
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: IST_TIME_ZONE,
  }).format(date);
}

/** Formats a YYYY-MM-DD string for display without constructing timezone-sensitive Dates. */
export function formatIsoDate(iso: string): string {
  return formatDonationDate(isoDateToUtcDate(iso));
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}
