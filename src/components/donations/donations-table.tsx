import Link from "next/link";
import { Eye, Pencil, Printer } from "lucide-react";
import type { DonationWithRelations } from "@/lib/donations/service";
import { formatINR } from "@/lib/money";
import { formatDonationDate } from "@/lib/dates";
import { PaymentMethodBadge, StatusBadge } from "@/components/ui/badge";
import { Table, TableWrapper, Td, Th } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { ShareReceiptButton } from "@/components/receipt/share-receipt-button";
import { cn } from "@/lib/cn";

interface Props {
  donations: DonationWithRelations[];
  canEdit: boolean;
  compact?: boolean;
  /** Fill the remaining height of a flex column and scroll inside the table instead of the page. */
  fill?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

const iconLink = "rounded-md p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900";

function RowActions({ d, canEdit }: { d: DonationWithRelations; canEdit: boolean }) {
  const cancelled = d.status === "CANCELLED";
  return (
    <div className="flex items-center justify-end gap-1">
      <Link href={`/donations/${d.id}`} className={iconLink} title="View">
        <Eye className="size-4" aria-hidden />
        <span className="sr-only">View</span>
      </Link>
      <Link href={`/receipt/${d.publicReceiptToken}?print=1`} target="_blank" className={iconLink} title="Print receipt">
        <Printer className="size-4" aria-hidden />
        <span className="sr-only">Print receipt</span>
      </Link>
      {!cancelled ? (
        <ShareReceiptButton
          variant="icon"
          receiptNumber={d.receiptNumber}
          amount={d.amount.toString()}
          donationDate={d.donationDate.toISOString()}
          donorMobile={d.donor.mobile}
          token={d.publicReceiptToken}
        />
      ) : null}
      {canEdit && !cancelled ? (
        <Link href={`/donations/${d.id}/edit`} className={iconLink} title="Edit">
          <Pencil className="size-4" aria-hidden />
          <span className="sr-only">Edit</span>
        </Link>
      ) : null}
    </div>
  );
}

/** Card layout used below the `md` breakpoint so amount and actions stay visible without horizontal scrolling. */
function DonationCards({ donations, canEdit }: { donations: DonationWithRelations[]; canEdit: boolean }) {
  return (
    <ul className="divide-y divide-stone-100 md:hidden">
      {donations.map((d) => {
        const cancelled = d.status === "CANCELLED";
        return (
          <li key={d.id} className={cn("px-4 py-3", cancelled && "bg-red-50/40")}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/donations/${d.id}`} className="font-mono text-sm font-semibold text-saffron-800 hover:underline">
                  {d.receiptNumber}
                </Link>
                <p className="mt-0.5 truncate text-base font-medium text-stone-900">{d.donor.name}</p>
                <p className="text-xs text-stone-500">
                  {d.donor.mobile} · {formatDonationDate(d.donationDate)}
                </p>
              </div>
              <p className={cn("shrink-0 text-lg font-semibold tabular-nums", cancelled ? "text-stone-400 line-through" : "text-stone-900")}>
                {formatINR(d.amount)}
              </p>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <PaymentMethodBadge method={d.paymentMethod} />
                <span className="text-xs text-stone-600">{d.category.name}</span>
                {cancelled ? <StatusBadge status={d.status} /> : null}
              </div>
              <RowActions d={d} canEdit={canEdit} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function DonationsTable({ donations, canEdit, compact = false, fill = false, emptyTitle, emptyDescription }: Props) {
  if (donations.length === 0) {
    return (
      <TableWrapper>
        <EmptyState
          title={emptyTitle ?? "No donations found"}
          description={emptyDescription ?? "Try changing the filters or add a new donation."}
          action={<Button href="/donations/new">Add donation</Button>}
        />
      </TableWrapper>
    );
  }

  return (
    <TableWrapper className={cn(fill && "min-h-48 flex-1 overflow-auto")}>
      <DonationCards donations={donations} canEdit={canEdit} />
      <Table className="hidden md:table">
        <thead className={cn(fill && "sticky top-0 z-10")}>
          <tr>
            <Th>Receipt</Th>
            <Th>Date</Th>
            <Th>Donor</Th>
            <Th className="hidden 2xl:table-cell">Mobile</Th>
            <Th className="hidden xl:table-cell">Category</Th>
            <Th>Payment</Th>
            <Th className="text-right">Amount</Th>
            {!compact ? <Th className="hidden 2xl:table-cell">Created by</Th> : null}
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {donations.map((d) => {
            const cancelled = d.status === "CANCELLED";
            return (
              <tr key={d.id} className={cn("hover:bg-stone-50", cancelled && "bg-red-50/40")}>
                <Td>
                  <Link href={`/donations/${d.id}`} className="whitespace-nowrap font-mono text-sm font-medium text-saffron-800 hover:underline">
                    {d.receiptNumber}
                  </Link>
                  {cancelled ? (
                    <div className="mt-1">
                      <StatusBadge status={d.status} />
                    </div>
                  ) : null}
                </Td>
                <Td className="whitespace-nowrap">{formatDonationDate(d.donationDate)}</Td>
                <Td>
                  <span className="block max-w-[14rem] truncate font-medium">{d.donor.name}</span>
                  <span className="block text-xs text-stone-500 2xl:hidden">{d.donor.mobile}</span>
                </Td>
                <Td className="hidden font-mono text-xs 2xl:table-cell">{d.donor.mobile}</Td>
                <Td className="hidden xl:table-cell">{d.category.name}</Td>
                <Td>
                  <PaymentMethodBadge method={d.paymentMethod} />
                </Td>
                <Td className={cn("text-right font-semibold tabular-nums whitespace-nowrap", cancelled && "text-stone-400 line-through")}>
                  {formatINR(d.amount)}
                </Td>
                {!compact ? <Td className="hidden text-stone-500 2xl:table-cell">{d.createdBy.name}</Td> : null}
                <Td>
                  <RowActions d={d} canEdit={canEdit} />
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </TableWrapper>
  );
}
