import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import type { DonationStatus, PaymentMethod } from "@/generated/prisma/enums";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "brand";

const TONES: Record<Tone, string> = {
  neutral: "bg-stone-100 text-stone-700 ring-stone-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-800 ring-amber-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
  info: "bg-sky-50 text-sky-700 ring-sky-200",
  brand: "bg-saffron-50 text-saffron-800 ring-saffron-200",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: DonationStatus }) {
  return status === "CANCELLED" ? <Badge tone="danger">Cancelled</Badge> : <Badge tone="success">Active</Badge>;
}

const METHOD_TONES: Record<PaymentMethod, Tone> = {
  CASH: "brand",
  UPI: "info",
  BANK_TRANSFER: "neutral",
  CHEQUE: "warning",
  OTHER: "neutral",
};

export function PaymentMethodBadge({ method }: { method: PaymentMethod }) {
  return <Badge tone={METHOD_TONES[method]}>{PAYMENT_METHOD_LABELS[method] ?? method}</Badge>;
}
