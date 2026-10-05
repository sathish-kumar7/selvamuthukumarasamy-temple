import Image from "next/image";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { formatReceiptAmount } from "@/lib/money";
import { amountInWordsBare } from "@/lib/amount-in-words";
import { formatDonationDate, formatDateTime } from "@/lib/dates";
import { BRANDING } from "@/lib/branding";
import type { TempleSettings } from "@/lib/settings";
import type { DonationWithRelations } from "@/lib/donations/service";
import { cn } from "@/lib/cn";

interface Props {
  donation: DonationWithRelations;
  settings: TempleSettings;
  className?: string;
}

/**
 * Printable receipt, laid out like the temple's paper receipt book: brick-red
 * pre-printed Tamil form on a landscape card, with the donation details
 * "filled in" in dark ink. Shared by the admin detail page and the public
 * receipt page, so it must never render internal fields (notes, created-by).
 */
export function ReceiptView({ donation, settings, className }: Props) {
  const cancelled = donation.status === "CANCELLED";
  const amount = donation.amount.toString();
  const address = [settings.addressLine1, settings.addressLine2].filter(Boolean).join(", ");
  const contact = [settings.phone, settings.email, settings.website].filter(Boolean).join(" · ");
  const donorLine = [donation.donor.name, donation.donor.address].filter(Boolean).join(", ");
  const payment = donation.transactionReference
    ? `${PAYMENT_METHOD_LABELS[donation.paymentMethod]} · Ref: ${donation.transactionReference}`
    : PAYMENT_METHOD_LABELS[donation.paymentMethod];

  return (
    <article
      className={cn(
        "print-receipt font-tamil relative mx-auto w-full max-w-[196mm] overflow-hidden rounded-xl bg-receipt-paper p-2 text-receipt-ink shadow-sm sm:p-3",
        className,
      )}
      aria-label={`Receipt ${donation.receiptNumber}`}
    >
      {cancelled ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center" aria-hidden>
          <span className="-rotate-12 rounded-lg border-4 border-red-500/70 px-6 py-2 font-sans text-4xl font-black uppercase tracking-widest text-red-500/70 sm:text-6xl">
            Cancelled
          </span>
        </div>
      ) : null}

      {/* Double frame, like the printed form. */}
      <div className="rounded-lg border-[3px] border-receipt-ink p-[3px]">
        <div className="rounded-md border border-receipt-ink px-3 pb-3 pt-2 sm:px-5 sm:pb-4">
          <p className="min-h-[1em] text-right text-[10px] leading-tight sm:text-[11px]">
            {settings.registrationNumber ? (
              <>
                பதிவு எண் : <span className="font-sans font-medium">{settings.registrationNumber}</span>
              </>
            ) : null}
          </p>

          {/* Deity image + temple header */}
          <div className="mt-1 flex items-center gap-3 sm:gap-4">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-md border-[1.5px] border-receipt-ink bg-white sm:size-20">
              <Image src={BRANDING.logoImage} alt="" width={96} height={96} className="size-full object-cover" priority />
            </div>
            <header className="min-w-0 flex-1 text-center">
              {settings.templeNameTamil ? (
                <h1 className="text-balance text-base font-bold leading-snug sm:text-xl">{settings.templeNameTamil}</h1>
              ) : (
                <h1 className="font-sans text-lg font-bold leading-snug sm:text-xl">{settings.templeName}</h1>
              )}
              {settings.templeNameTamil ? (
                <p className="mt-0.5 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] sm:text-xs">{settings.templeName}</p>
              ) : null}
              {address ? <p className="mt-1 text-[11px] leading-snug sm:text-sm">{address}</p> : null}
              {contact ? <p className="font-sans text-[10px] leading-snug sm:text-[11px]">{contact}</p> : null}
            </header>
          </div>

          {/* No. | title | date */}
          <div className="mt-3 flex flex-wrap items-stretch gap-2 sm:flex-nowrap sm:gap-3">
            <FormBox className="flex items-baseline gap-1.5">
              <span className="text-xs sm:text-sm">எண் :</span>
              <span className="font-mono text-sm font-bold text-stone-900 sm:text-base">{donation.receiptNumber}</span>
            </FormBox>
            <FormBox className="flex flex-1 items-center justify-center border-2 px-4 sm:min-w-0">
              <h2 className="whitespace-nowrap text-lg font-bold tracking-wide sm:text-xl">நன்கொடை இரசீது</h2>
            </FormBox>
            <FormBox className="flex items-baseline gap-1.5">
              <span className="text-xs sm:text-sm">தேதி :</span>
              <span className="whitespace-nowrap font-sans text-sm font-bold text-stone-900 sm:text-base">{formatDonationDate(donation.donationDate)}</span>
            </FormBox>
          </div>

          {/* Filled-in form lines */}
          <div className="mt-3 space-y-2.5 text-sm sm:text-base">
            <FormLine label="திரு./திருமதி">
              <span className="font-semibold">{donorLine}</span>
              <span className="ml-2 whitespace-nowrap font-sans text-xs text-stone-600 sm:text-sm">{donation.donor.mobile}</span>
            </FormLine>
            <FormLine label="அவர்களிடமிருந்து ரூபாய்" trailing="மட்டும்">
              <span className="font-semibold">{amountInWordsBare(amount)}</span>
            </FormLine>
            <FormLine trailing="நன்கொடையாக நன்றியுடன் பெற்றுக்கொண்டோம்.">
              <span className="font-semibold">{donation.category.name}</span>
            </FormLine>
          </div>

          <p className="mt-2 font-sans text-[11px] text-stone-600 sm:text-xs">
            <span className="font-tamil text-receipt-ink">செலுத்திய முறை :</span> {payment}
          </p>

          {cancelled && donation.cancelledAt ? (
            <p className="mt-2 rounded border border-red-300 bg-red-50 px-3 py-1.5 font-sans text-xs text-red-800">
              This receipt was cancelled on {formatDateTime(donation.cancelledAt)} and is no longer valid.
            </p>
          ) : null}

          {/* Amount box + signatures */}
          <div className="mt-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
            <FormBox className="flex items-baseline gap-2 border-2 px-3 py-1.5">
              <span className="text-lg font-bold sm:text-xl">ரூ.</span>
              <span className={cn("font-sans text-xl font-bold tabular-nums tracking-tight text-stone-900 sm:text-2xl", cancelled && "line-through decoration-red-500")}>
                {formatReceiptAmount(amount)}
              </span>
            </FormBox>
            <div className="flex items-end gap-8 sm:gap-12">
              {settings.secondarySignatory ? <SignatureSlot label={settings.secondarySignatory} /> : null}
              <SignatureSlot label={settings.authorizedSignatory} />
            </div>
          </div>

          <footer className="mt-3 border-t border-dashed border-receipt-ink/40 pt-2 text-center font-sans text-[10px] leading-snug text-stone-500">
            {settings.thankYouMessage ? <p className="italic text-stone-600">{settings.thankYouMessage}</p> : null}
            <p>Computer-generated receipt · issued {formatDateTime(donation.createdAt)} IST</p>
          </footer>
        </div>
      </div>
    </article>
  );
}

function FormBox({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-md border-[1.5px] border-receipt-ink px-2.5 py-1 sm:px-3", className)}>{children}</div>;
}

/** A pre-printed label followed by a dotted fill-in area (and an optional trailing label). */
function FormLine({ label, trailing, children }: { label?: string; trailing?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      {label ? <span className="shrink-0">{label}</span> : null}
      <span className="min-w-[8rem] flex-1 break-words border-b border-dotted border-receipt-ink px-1 pb-0.5 font-sans leading-snug text-stone-900">
        {children}
      </span>
      {trailing ? <span className="min-w-0 max-w-full">{trailing}</span> : null}
    </div>
  );
}

function SignatureSlot({ label }: { label: string }) {
  return (
    <div className="text-center">
      <div className="h-9 w-28 sm:h-10 sm:w-36" aria-hidden />
      <p className="text-xs font-semibold sm:text-sm">{label}</p>
    </div>
  );
}
