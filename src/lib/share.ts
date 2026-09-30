import { formatINRCompact } from "@/lib/money";
import { formatDonationDate } from "@/lib/dates";

export interface ShareableReceipt {
  receiptNumber: string;
  amount: string;
  donationDate: Date;
  donorMobile: string;
  publicUrl: string;
  templeName: string;
}

export function buildShareMessage(r: ShareableReceipt): string {
  return [
    `Thank you for your donation to ${r.templeName}.`,
    "",
    `Receipt: ${r.receiptNumber}`,
    `Amount: ${formatINRCompact(r.amount)}`,
    `Date: ${formatDonationDate(r.donationDate)}`,
    "",
    "Receipt:",
    r.publicUrl,
  ].join("\n");
}

/** Normalises an Indian mobile number to E.164 without "+" for wa.me links. */
export function toWhatsAppNumber(mobile: string): string {
  const digits = mobile.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  return digits;
}

export function buildWhatsAppUrl(mobile: string, message: string): string {
  return `https://wa.me/${toWhatsAppNumber(mobile)}?text=${encodeURIComponent(message)}`;
}
