import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { getExpenseById } from "@/lib/expenses/service";
import { formatINR } from "@/lib/money";
import { amountInWords } from "@/lib/amount-in-words";
import { formatDateTime, formatDonationDate } from "@/lib/dates";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatusBadge, PaymentMethodBadge } from "@/components/ui/badge";
import { CancelExpenseDialog } from "@/components/expenses/cancel-expense-dialog";
import { cn } from "@/lib/cn";

export async function generateMetadata(props: PageProps<"/expenditures/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const expense = await getExpenseById(id);
  return { title: expense ? `Expense ${expense.voucherNumber}` : "Expense" };
}

export default async function ExpenseDetailPage(props: PageProps<"/expenditures/[id]">) {
  const [user, { id }, searchParams] = await Promise.all([requireUser(), props.params, props.searchParams]);
  const expense = await getExpenseById(id);
  if (!expense) notFound();

  const cancelled = expense.status === "CANCELLED";
  const canEdit = can(user.role, "expense:edit") && !cancelled;
  const canCancel = can(user.role, "expense:cancel") && !cancelled;
  const amount = expense.amount.toString();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Link href="/expenditures" className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900">
          <ArrowLeft className="size-4" aria-hidden /> All expenditures
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-2xl font-semibold tracking-tight text-stone-900">{expense.voucherNumber}</h1>
              <StatusBadge status={expense.status} />
            </div>
            <p className="mt-1 text-sm text-stone-500">
              Recorded by {expense.createdBy.name} on {formatDateTime(expense.createdAt)}
              {expense.updatedBy ? ` · edited by ${expense.updatedBy.name} on ${formatDateTime(expense.updatedAt)}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canEdit ? (
              <Button href={`/expenditures/${expense.id}/edit`} variant="outline">
                <Pencil className="size-4" aria-hidden /> Edit
              </Button>
            ) : null}
            {canCancel ? (
              <CancelExpenseDialog expenseId={expense.id} voucherNumber={expense.voucherNumber} amountLabel={formatINR(amount)} paidTo={expense.paidTo} />
            ) : null}
          </div>
        </div>

        {searchParams.created ? (
          <Alert tone="success" className="mt-4" title="Expense saved">
            Voucher {expense.voucherNumber} has been recorded. Use “Add expense” to record the next one.
          </Alert>
        ) : null}
        {searchParams.updated ? <Alert tone="success" className="mt-4">Expense updated. The change has been logged.</Alert> : null}
        {searchParams.cancelled ? <Alert tone="warning" className="mt-4">This expense has been cancelled.</Alert> : null}
      </div>

      <Card>
        <CardHeader
          title="Expense details"
          actions={
            <p className={cn("text-2xl font-bold tabular-nums tracking-tight", cancelled ? "text-stone-400 line-through" : "text-stone-900")}>{formatINR(amount)}</p>
          }
        />
        <CardBody>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <Item label="Date" value={formatDonationDate(expense.expenseDate)} />
            <Item label="Category" value={expense.category.name} />
            <Item label="Paid to" value={<span className="font-medium">{expense.paidTo}</span>} />
            <Item label="Description" value={expense.description ?? "—"} />
            <Item label="Amount in words" value={amountInWords(amount)} className="sm:col-span-2" />
            <Item
              label="Paid by"
              value={
                <span className="inline-flex flex-wrap items-center gap-2">
                  <PaymentMethodBadge method={expense.paymentMethod} />
                  {expense.transactionReference ? <span className="font-mono text-xs text-stone-600">Ref: {expense.transactionReference}</span> : null}
                </span>
              }
            />
            <Item label="Payment method" value={PAYMENT_METHOD_LABELS[expense.paymentMethod]} />
            <Item label="Notes" value={expense.notes ?? "—"} className="sm:col-span-2" />
            {cancelled ? (
              <>
                <Item label="Cancelled by" value={expense.cancelledBy?.name ?? "—"} />
                <Item label="Cancelled at" value={expense.cancelledAt ? formatDateTime(expense.cancelledAt) : "—"} />
                <Item label="Cancellation reason" value={expense.cancellationReason ?? "—"} className="sm:col-span-2" />
              </>
            ) : null}
          </dl>
        </CardBody>
      </Card>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button href="/expenditures/new" variant="primary">
          Add another expense
        </Button>
        <Button href="/expenditures" variant="outline">
          Back to list
        </Button>
      </div>
      {!canEdit && !canCancel && !cancelled ? <p className="mt-3 text-xs text-stone-500">Only administrators can edit or cancel expenses.</p> : null}
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
