import { NextResponse, type NextRequest } from "next/server";
import { getDonationByToken } from "@/lib/donations/service";
import { getTempleSettings } from "@/lib/settings";
import { renderReceiptPdf } from "@/lib/pdf/receipt-pdf";

export const runtime = "nodejs";

/**
 * Public PDF download, protected only by the unguessable receipt token.
 * Renders the same information as the printed receipt and nothing more.
 */
export async function GET(_request: NextRequest, context: RouteContext<"/api/receipts/[token]/pdf">) {
  const { token } = await context.params;
  const [donation, settings] = await Promise.all([getDonationByToken(token), getTempleSettings()]);
  if (!donation) return NextResponse.json({ error: "Receipt not found" }, { status: 404 });

  const pdf = await renderReceiptPdf(donation, settings);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Receipt-${donation.receiptNumber}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
