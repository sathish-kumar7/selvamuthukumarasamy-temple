import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, ExternalLink, Pencil } from "lucide-react";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { getDonationById } from "@/lib/donations/service";
import { getTempleSettings } from "@/lib/settings";
import { formatINR } from "@/lib/money";
import { formatDateTime } from "@/lib/dates";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { ReceiptView } from "@/components/receipt/receipt-view";
import { PrintButton } from "@/components/receipt/print-button";
import { ShareReceiptButton } from "@/components/receipt/share-receipt-button";
import { CancelDonationDialog } from "@/components/donations/cancel-donation-dialog";

export async function generateMetadata(props: PageProps<"/donations/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const donation = await getDonationById(id);
  return { title: donation ? `Receipt ${donation.receiptNumber}` : "Donation" };
}

export default async function DonationDetailPage(props: PageProps<"/donations/[id]">) {
  const [user, { id }, searchParams, settings] = await Promise.all([requireUser(), props.params, props.searchParams, getTempleSettings()]);
  const donation = await getDonationById(id);
  if (!donation) notFound();

  const cancelled = donation.status === "CANCELLED";
  const canEdit = can(user.role, "donation:edit") && !cancelled;
  const canCancel = can(user.role, "donation:cancel") && !cancelled;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="print-hidden mb-6">
        <Link href="/donations" className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900">
          <ArrowLeft className="size-4" aria-hidden /> All donations
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-2xl font-semibold tracking-tight text-stone-900">{donation.receiptNumber}</h1>
              <StatusBadge status={donation.status} />
            </div>
            <p className="mt-1 text-sm text-stone-500">
              Recorded by {donation.createdBy.name} on {formatDateTime(donation.createdAt)}
              {donation.updatedBy ? ` · edited by ${donation.updatedBy.name} on ${formatDateTime(donation.updatedAt)}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PrintButton />
            <a href={`/api/receipts/${donation.publicReceiptToken}/pdf`} className={buttonClasses("outline")} download>
              <Download className="size-4" aria-hidden /> Download PDF
            </a>
            {!cancelled ? (
              <ShareReceiptButton
                receiptNumber={donation.receiptNumber}
                amount={donation.amount.toString()}
                donationDate={donation.donationDate.toISOString()}
                donorMobile={donation.donor.mobile}
                token={donation.publicReceiptToken}
                templeName={settings.templeName}
              />
            ) : null}
          </div>
        </div>

        {searchParams.created ? (
          <Alert tone="success" className="mt-4" title="Donation saved and receipt generated">
            Print or share the receipt below. Use “Add donation” to record the next one.
          </Alert>
        ) : null}
        {searchParams.updated ? <Alert tone="success" className="mt-4">Donation updated. The change has been logged.</Alert> : null}
        {searchParams.cancelled ? <Alert tone="warning" className="mt-4">This receipt has been cancelled.</Alert> : null}
      </div>

      <ReceiptView donation={donation} settings={settings} />

      <div className="print-hidden mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader title="Internal details" description="Visible to temple staff only. Not printed on the receipt." />
          <CardBody>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <Item label="Donor email" value={donation.donor.email ?? "—"} />
              <Item label="Donor address" value={donation.donor.address ?? "—"} />
              <Item label="Notes" value={donation.notes ?? "—"} className="sm:col-span-2" />
              <Item label="Public receipt link" value={
                <Link href={`/receipt/${donation.publicReceiptToken}`} target="_blank" className="inline-flex items-center gap-1 break-all text-saffron-800 hover:underline">
                  /receipt/{donation.publicReceiptToken} <ExternalLink className="size-3.5" aria-hidden />
                </Link>
              } className="sm:col-span-2" />
              {cancelled ? (
                <>
                  <Item label="Cancelled by" value={donation.cancelledBy?.name ?? "—"} />
                  <Item label="Cancelled at" value={donation.cancelledAt ? formatDateTime(donation.cancelledAt) : "—"} />
                  <Item label="Cancellation reason" value={donation.cancellationReason ?? "—"} className="sm:col-span-2" />
                </>
              ) : null}
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Actions" />
          <CardBody className="flex flex-col gap-2">
            <Button href="/donations/new" variant="primary">
              Add another donation
            </Button>
            {canEdit ? (
              <Button href={`/donations/${donation.id}/edit`} variant="outline">
                <Pencil className="size-4" aria-hidden /> Edit donation
              </Button>
            ) : null}
            {canCancel ? (
              <CancelDonationDialog
                donationId={donation.id}
                receiptNumber={donation.receiptNumber}
                amountLabel={formatINR(donation.amount)}
                donorName={donation.donor.name}
              />
            ) : null}
            {!canEdit && !canCancel && !cancelled ? (
              <p className="text-xs text-stone-500">Only administrators can edit or cancel receipts.</p>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Item({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</dt>
      <dd className="mt-0.5 text-stone-900">{value}</dd>
    </div>
  );
}
