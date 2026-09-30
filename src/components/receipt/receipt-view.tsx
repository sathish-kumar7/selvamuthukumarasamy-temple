import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { formatINR } from "@/lib/money";
import { amountInWords } from "@/lib/amount-in-words";
import { formatDonationDate, formatDateTime } from "@/lib/dates";
import { TempleMark } from "@/components/layout/temple-mark";
import type { TempleSettings } from "@/lib/settings";
import type { DonationWithRelations } from "@/lib/donations/service";
import { cn } from "@/lib/cn";

interface Props {
  donation: DonationWithRelations;
  settings: TempleSettings;
  className?: string;
}

/**
 * Printable receipt. Shared by the admin detail page and the public receipt
 * page, so it must never render internal fields (notes, created-by, etc.).
 */
export function ReceiptView({ donation, settings, className }: Props) {
  const cancelled = donation.status === "CANCELLED";
  const amount = donation.amount.toString();
  const address = [settings.addressLine1, settings.addressLine2].filter(Boolean).join(", ");
  const contact = [settings.phone, settings.email, settings.website].filter(Boolean).join(" · ");

  return (
    <article
      className={cn(
        "print-receipt relative mx-auto w-full max-w-[210mm] overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-10",
        className,
      )}
      aria-label={`Receipt ${donation.receiptNumber}`}
    >
      {cancelled ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
          <span className="-rotate-12 rounded-lg border-4 border-red-500/70 px-6 py-2 text-4xl font-black uppercase tracking-widest text-red-500/70 sm:text-6xl">
            Cancelled
          </span>
        </div>
      ) : null}

      <header className="flex flex-col items-center gap-3 border-b-2 border-saffron-600 pb-5 text-center sm:flex-row sm:items-center sm:text-left">
        <TempleMark className="size-16 shrink-0 text-saffron-700" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-maroon-800">Donation Receipt</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">{settings.templeName}</h1>
          {address ? <p className="mt-1 text-sm text-stone-600">{address}</p> : null}
          {contact ? <p className="text-sm text-stone-600">{contact}</p> : null}
        </div>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Receipt No.</p>
          <p className="mt-0.5 font-mono text-base font-semibold text-stone-900">{donation.receiptNumber}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Date</p>
          <p className="mt-0.5 text-base font-semibold text-stone-900">{formatDonationDate(donation.donationDate)}</p>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-stone-200">
        <dl className="divide-y divide-stone-200 text-sm">
          <Row label="Received with thanks from" value={donation.donor.name} strong />
          <Row label="Mobile number" value={donation.donor.mobile} mono />
          {donation.donor.address ? <Row label="Address" value={donation.donor.address} /> : null}
          <Row label="Donation towards" value={donation.category.name} />
          <Row
            label="Payment method"
            value={
              donation.transactionReference
                ? `${PAYMENT_METHOD_LABELS[donation.paymentMethod]} · Ref: ${donation.transactionReference}`
                : PAYMENT_METHOD_LABELS[donation.paymentMethod]
            }
          />
        </dl>
      </section>

      <section className="mt-6 flex flex-col gap-3 rounded-xl bg-saffron-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-saffron-900/70">Amount received</p>
          <p className="mt-1 text-sm font-medium text-stone-700">{amountInWords(amount)}</p>
        </div>
        <p className={cn("text-3xl font-bold tabular-nums tracking-tight text-saffron-900 sm:text-4xl", cancelled && "line-through decoration-red-500")}>
          {formatINR(amount)}
        </p>
      </section>

      {cancelled && donation.cancelledAt ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          This receipt was cancelled on {formatDateTime(donation.cancelledAt)} and is no longer valid.
        </p>
      ) : null}

      <footer className="mt-8 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
        <p className="text-sm italic leading-relaxed text-stone-600">{settings.thankYouMessage}</p>
        <div className="text-center">
          <div className="mx-auto h-14 w-44 border-b border-stone-400" aria-hidden />
          <p className="mt-2 text-xs font-medium text-stone-700">{settings.authorizedSignatory}</p>
          <p className="text-[11px] text-stone-500">{settings.templeName}</p>
        </div>
      </footer>

      <p className="mt-6 text-center text-[11px] text-stone-400">
        This is a computer-generated receipt. Receipt issued on {formatDateTime(donation.createdAt)} IST.
      </p>
    </article>
  );
}

function Row({ label, value, strong, mono }: { label: string; value: string; strong?: boolean; mono?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-[13rem_1fr] sm:gap-4">
      <dt className="text-stone-500">{label}</dt>
      <dd className={cn("text-stone-900", strong && "text-base font-semibold", mono && "font-mono")}>{value}</dd>
    </div>
  );
}
