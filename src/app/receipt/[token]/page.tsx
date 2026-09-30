import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { getDonationByToken } from "@/lib/donations/service";
import { getTempleSettings } from "@/lib/settings";
import { ReceiptView } from "@/components/receipt/receipt-view";
import { PrintButton } from "@/components/receipt/print-button";
import { AutoPrint } from "@/components/receipt/auto-print";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = { title: "Donation receipt", robots: { index: false, follow: false } };

/**
 * Public receipt page. Reachable only via the unguessable token, and renders
 * nothing beyond what is printed on the paper receipt.
 */
export default async function PublicReceiptPage(props: PageProps<"/receipt/[token]">) {
  const [{ token }, searchParams, settings] = await Promise.all([props.params, props.searchParams, getTempleSettings()]);
  const donation = await getDonationByToken(token);
  if (!donation) notFound();

  return (
    <main className="flex-1 bg-stone-100 px-4 py-6 sm:py-10 print:bg-white print:p-0">
      {searchParams.print === "1" ? <AutoPrint /> : null}
      <div className="mx-auto max-w-[210mm]">
        <div className="print-hidden mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-stone-600">
            Receipt <span className="font-mono font-semibold text-stone-900">{donation.receiptNumber}</span>
          </p>
          <div className="flex items-center gap-2">
            <PrintButton variant="outline" />
            <a href={`/api/receipts/${donation.publicReceiptToken}/pdf`} className={buttonClasses("primary")} download>
              <Download className="size-4" aria-hidden /> Download PDF
            </a>
          </div>
        </div>
        <ReceiptView donation={donation} settings={settings} />
      </div>
    </main>
  );
}
