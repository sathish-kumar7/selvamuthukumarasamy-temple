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
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DonationsTable({ donations, canEdit, compact = false, emptyTitle, emptyDescription }: Props) {
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
    <TableWrapper>
      <Table>
        <thead>
          <tr>
            <Th>Receipt</Th>
            <Th>Date</Th>
            <Th>Donor</Th>
            <Th className={compact ? "hidden md:table-cell" : "hidden sm:table-cell"}>Mobile</Th>
            <Th className="hidden lg:table-cell">Category</Th>
            <Th className="hidden md:table-cell">Payment</Th>
            <Th className="text-right">Amount</Th>
            {!compact ? <Th className="hidden xl:table-cell">Created by</Th> : null}
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {donations.map((d) => {
            const cancelled = d.status === "CANCELLED";
            return (
              <tr key={d.id} className={cn("hover:bg-stone-50", cancelled && "bg-red-50/40")}>
                <Td>
                  <Link href={`/donations/${d.id}`} className="font-mono text-sm font-medium text-saffron-800 hover:underline">
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
                  <span className={cn("block text-xs text-stone-500", compact ? "md:hidden" : "sm:hidden")}>{d.donor.mobile}</span>
                </Td>
                <Td className={cn("font-mono text-xs", compact ? "hidden md:table-cell" : "hidden sm:table-cell")}>{d.donor.mobile}</Td>
                <Td className="hidden lg:table-cell">{d.category.name}</Td>
                <Td className="hidden md:table-cell">
                  <PaymentMethodBadge method={d.paymentMethod} />
                </Td>
                <Td className={cn("text-right font-semibold tabular-nums whitespace-nowrap", cancelled && "text-stone-400 line-through")}>
                  {formatINR(d.amount)}
                </Td>
                {!compact ? <Td className="hidden text-stone-500 xl:table-cell">{d.createdBy.name}</Td> : null}
                <Td>
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/donations/${d.id}`} className="rounded-md p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900" title="View">
                      <Eye className="size-4" aria-hidden />
                      <span className="sr-only">View</span>
                    </Link>
                    <Link
                      href={`/receipt/${d.publicReceiptToken}?print=1`}
                      target="_blank"
                      className="rounded-md p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                      title="Print receipt"
                    >
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
                      <Link
                        href={`/donations/${d.id}/edit`}
                        className="rounded-md p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                        title="Edit"
                      >
                        <Pencil className="size-4" aria-hidden />
                        <span className="sr-only">Edit</span>
                      </Link>
                    ) : null}
                  </div>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </TableWrapper>
  );
}
