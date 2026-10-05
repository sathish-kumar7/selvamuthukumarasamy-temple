import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
import type { ExpenseWithRelations } from "@/lib/expenses/service";
import { formatINR } from "@/lib/money";
import { formatDonationDate } from "@/lib/dates";
import { PaymentMethodBadge, StatusBadge } from "@/components/ui/badge";
import { Table, TableWrapper, Td, Th } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

interface Props {
  expenses: ExpenseWithRelations[];
  canEdit: boolean;
  /** Sum of all ACTIVE expenses matching the current filters (all pages), shown in the footer. */
  total?: { amount: string; count: number };
  emptyTitle?: string;
  emptyDescription?: string;
}

const iconLink = "rounded-md p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900";

function RowActions({ e, canEdit }: { e: ExpenseWithRelations; canEdit: boolean }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Link href={`/expenditures/${e.id}`} className={iconLink} title="View">
        <Eye className="size-4" aria-hidden />
        <span className="sr-only">View</span>
      </Link>
      {canEdit && e.status !== "CANCELLED" ? (
        <Link href={`/expenditures/${e.id}/edit`} className={iconLink} title="Edit">
          <Pencil className="size-4" aria-hidden />
          <span className="sr-only">Edit</span>
        </Link>
      ) : null}
    </div>
  );
}

export function ExpensesTable({ expenses, canEdit, total, emptyTitle, emptyDescription }: Props) {
  if (expenses.length === 0) {
    return (
      <TableWrapper>
        <EmptyState
          title={emptyTitle ?? "No expenses found"}
          description={emptyDescription ?? "Try changing the filters or record a new expense."}
          action={<Button href="/expenditures/new">Add expense</Button>}
        />
      </TableWrapper>
    );
  }

  return (
    <TableWrapper>
      {/* Card layout below md so the amount and actions stay visible without horizontal scrolling. */}
      <ul className="divide-y divide-stone-100 md:hidden">
        {expenses.map((e) => {
          const cancelled = e.status === "CANCELLED";
          return (
            <li key={e.id} className={cn("px-4 py-3", cancelled && "bg-red-50/40")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/expenditures/${e.id}`} className="font-mono text-sm font-semibold text-saffron-800 hover:underline">
                    {e.voucherNumber}
                  </Link>
                  <p className="mt-0.5 truncate text-base font-medium text-stone-900">{e.paidTo}</p>
                  <p className="truncate text-xs text-stone-500">
                    {formatDonationDate(e.expenseDate)}
                    {e.description ? ` · ${e.description}` : ""}
                  </p>
                </div>
                <p className={cn("shrink-0 text-lg font-semibold tabular-nums", cancelled ? "text-stone-400 line-through" : "text-stone-900")}>
                  {formatINR(e.amount)}
                </p>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <PaymentMethodBadge method={e.paymentMethod} />
                  <span className="text-xs text-stone-600">{e.category.name}</span>
                  {cancelled ? <StatusBadge status={e.status} /> : null}
                </div>
                <RowActions e={e} canEdit={canEdit} />
              </div>
            </li>
          );
        })}
        {total ? (
          <li className="flex items-center justify-between bg-stone-50 px-4 py-3 font-semibold">
            <span className="text-stone-600">Total ({total.count} active)</span>
            <span className="tabular-nums">{formatINR(total.amount)}</span>
          </li>
        ) : null}
      </ul>

      <Table className="hidden md:table">
        <thead>
          <tr>
            <Th>Voucher</Th>
            <Th>Date</Th>
            <Th>Paid to</Th>
            <Th className="hidden xl:table-cell">Category</Th>
            <Th>Payment</Th>
            <Th className="text-right">Amount</Th>
            <Th className="hidden 2xl:table-cell">Recorded by</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {expenses.map((e) => {
            const cancelled = e.status === "CANCELLED";
            return (
              <tr key={e.id} className={cn("hover:bg-stone-50", cancelled && "bg-red-50/40")}>
                <Td>
                  <Link href={`/expenditures/${e.id}`} className="whitespace-nowrap font-mono text-sm font-medium text-saffron-800 hover:underline">
                    {e.voucherNumber}
                  </Link>
                  {cancelled ? (
                    <div className="mt-1">
                      <StatusBadge status={e.status} />
                    </div>
                  ) : null}
                </Td>
                <Td className="whitespace-nowrap">{formatDonationDate(e.expenseDate)}</Td>
                <Td>
                  <span className="block max-w-[16rem] truncate font-medium">{e.paidTo}</span>
                  {e.description ? <span className="block max-w-[16rem] truncate text-xs text-stone-500">{e.description}</span> : null}
                  <span className="block text-xs text-stone-500 xl:hidden">{e.category.name}</span>
                </Td>
                <Td className="hidden xl:table-cell">{e.category.name}</Td>
                <Td>
                  <PaymentMethodBadge method={e.paymentMethod} />
                </Td>
                <Td className={cn("text-right font-semibold tabular-nums whitespace-nowrap", cancelled && "text-stone-400 line-through")}>
                  {formatINR(e.amount)}
                </Td>
                <Td className="hidden text-stone-500 2xl:table-cell">{e.createdBy.name}</Td>
                <Td>
                  <RowActions e={e} canEdit={canEdit} />
                </Td>
              </tr>
            );
          })}
        </tbody>
        {total ? (
          <tfoot>
            <tr className="bg-stone-50 font-semibold">
              <Td colSpan={5} className="text-right text-stone-600">
                Total of {total.count} active expense{total.count === 1 ? "" : "s"} matching filters
              </Td>
              <Td className="text-right tabular-nums">{formatINR(total.amount)}</Td>
              <Td colSpan={2} />
            </tr>
          </tfoot>
        ) : null}
      </Table>
    </TableWrapper>
  );
}
