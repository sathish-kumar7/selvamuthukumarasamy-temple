import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import {
  getExpenseReportSummary,
  getReportSummary,
  listReportExpenses,
  listReportTransactions,
  resolveReportRange,
  type ReportRange,
  type ReportSummary,
} from "@/lib/reports/query";
import type { DonationWithRelations } from "@/lib/donations/service";
import type { ExpenseWithRelations } from "@/lib/expenses/service";
import { reportRangeSchema } from "@/lib/validation/report";
import { formatINR } from "@/lib/money";
import { formatDonationDate, formatIsoDate } from "@/lib/dates";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { buttonClasses } from "@/components/ui/button";
import { Table, TableWrapper, Td, Th } from "@/components/ui/table";
import { PaymentMethodBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ReportRangeForm, reportHref } from "@/components/reports/report-range-form";
import { Pagination } from "@/components/ui/pagination";
import type { PaymentMethod } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Reports" };

const METHODS: PaymentMethod[] = ["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "OTHER"];

export default async function ReportsPage(props: PageProps<"/reports">) {
  const [user, searchParams] = await Promise.all([requireUser(), props.searchParams]);
  if (!can(user.role, "report:view")) return <Alert tone="warning">You do not have access to reports.</Alert>;

  const flat = Object.fromEntries(Object.entries(searchParams).filter(([, v]) => typeof v === "string")) as Record<string, string>;
  const parsed = reportRangeSchema.safeParse(flat);
  const rangeError = parsed.success ? null : parsed.error.issues[0]?.message ?? "Invalid date range";
  const range = resolveReportRange(parsed.success ? parsed.data : { type: flat.type });
  const page = parsed.success ? parsed.data.page : 1;
  const isExpenses = range.type === "expenses";

  const exportHref = `/api/reports/export?format=csv&type=${range.type}&from=${range.from}&to=${range.to}`;
  const rangeLabel = range.from === range.to ? formatIsoDate(range.from) : `${formatIsoDate(range.from)} – ${formatIsoDate(range.to)}`;
  const noun = isExpenses ? "expense" : "receipt";
  const plural = (n: number) => `${n} ${noun}${n === 1 ? "" : "s"}`;

  // Load the summary and the first page of rows for whichever report is selected.
  const [summary, rows] = isExpenses
    ? await Promise.all([getExpenseReportSummary(range), listReportExpenses(range, page)])
    : await Promise.all([getReportSummary(range), listReportTransactions(range, page)]);

  return (
    <>
      <PageHeader
        title="Reports"
        description={
          isExpenses
            ? `Expenses for ${rangeLabel}. Cancelled expenses are excluded from totals.`
            : `Collections for ${rangeLabel}. Cancelled receipts are excluded from totals.`
        }
        actions={
          <a href={exportHref} className={buttonClasses("outline")} download>
            <Download className="size-4" aria-hidden /> Export CSV
          </a>
        }
      />

      <div className="space-y-6">
        <ReportRangeForm range={range} />
        {rangeError ? <Alert tone="error">{rangeError}</Alert> : null}

        <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard label={isExpenses ? "Total expenses" : "Total donations"} value={formatINR(summary.total)} sub={plural(summary.count)} accent />
          <StatCard label={isExpenses ? "Number of expenses" : "Number of donations"} value={String(summary.count)} />
          {METHODS.map((m) => (
            <StatCard key={m} label={`${PAYMENT_METHOD_LABELS[m]} ${isExpenses ? "paid" : "received"}`} value={formatINR(summary.byMethod[m].total)} sub={plural(summary.byMethod[m].count)} />
          ))}
        </section>

        <CategoryTotals summary={summary} noun={noun} emptyTitle={isExpenses ? "No expenses in this period" : "No donations in this period"} />

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-stone-900">{isExpenses ? "Expenses" : "Transactions"}</h2>
            <p className="text-xs text-stone-500">
              {plural(rows.total)} · export CSV for the full list
            </p>
          </div>
          <TableWrapper>
            {rows.items.length === 0 ? (
              <EmptyState
                title={isExpenses ? "No expenses" : "No transactions"}
                description={isExpenses ? "No active expenses were recorded in this period." : "No active donations were recorded in this period."}
              />
            ) : isExpenses ? (
              <ExpenseRows items={rows.items as ExpenseWithRelations[]} summary={summary} />
            ) : (
              <DonationRows items={rows.items as DonationWithRelations[]} summary={summary} />
            )}
          </TableWrapper>
          <Pagination page={rows.page} pageCount={rows.pageCount} total={rows.total} pageSize={rows.pageSize} buildHref={(p) => reportHref(range, {}, p)} />
        </section>
      </div>
    </>
  );
}

function CategoryTotals({ summary, noun, emptyTitle }: { summary: ReportSummary; noun: string; emptyTitle: string }) {
  return (
    <Card>
      <CardHeader title="Category totals" />
      {summary.byCategory.length === 0 ? (
        <EmptyState title={emptyTitle} />
      ) : (
        <CardBody className="p-0">
          <Table>
            <thead>
              <tr>
                <Th>Category</Th>
                <Th className="text-right">{noun === "expense" ? "Expenses" : "Receipts"}</Th>
                <Th className="text-right">Total</Th>
                <Th className="hidden text-right sm:table-cell">Share</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {summary.byCategory.map((c) => {
                const share = Number(summary.total) > 0 ? (Number(c.total) / Number(summary.total)) * 100 : 0;
                return (
                  <tr key={c.categoryId}>
                    <Td className="font-medium">{c.name}</Td>
                    <Td className="text-right tabular-nums">{c.count}</Td>
                    <Td className="text-right font-semibold tabular-nums">{formatINR(c.total)}</Td>
                    <Td className="hidden text-right tabular-nums text-stone-500 sm:table-cell">{share.toFixed(1)}%</Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </CardBody>
      )}
    </Card>
  );
}

function PeriodTotalRow({ summary, colSpan }: { summary: ReportSummary; colSpan: number }) {
  return (
    <tfoot>
      <tr className="bg-stone-50 font-semibold">
        <Td colSpan={colSpan} className="text-right text-stone-600">
          Period total ({summary.count})
        </Td>
        <Td className="text-right tabular-nums">{formatINR(summary.total)}</Td>
      </tr>
    </tfoot>
  );
}

function DonationRows({ items, summary }: { items: DonationWithRelations[]; summary: ReportSummary }) {
  return (
    <>
      <ul className="divide-y divide-stone-100 md:hidden">
        {items.map((d) => (
          <li key={d.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/donations/${d.id}`} className="font-mono text-sm font-semibold text-saffron-800 hover:underline">
                  {d.receiptNumber}
                </Link>
                <p className="mt-0.5 truncate font-medium text-stone-900">{d.donor.name}</p>
                <p className="text-xs text-stone-500">
                  {d.donor.mobile} · {formatDonationDate(d.donationDate)}
                </p>
              </div>
              <p className="shrink-0 text-lg font-semibold tabular-nums text-stone-900">{formatINR(d.amount)}</p>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <PaymentMethodBadge method={d.paymentMethod} />
              <span className="text-xs text-stone-600">{d.category.name}</span>
              {d.transactionReference ? <span className="font-mono text-xs text-stone-500">Ref: {d.transactionReference}</span> : null}
            </div>
          </li>
        ))}
        <li className="flex items-center justify-between bg-stone-50 px-4 py-3 font-semibold">
          <span className="text-stone-600">Period total ({summary.count})</span>
          <span className="tabular-nums">{formatINR(summary.total)}</span>
        </li>
      </ul>
      <Table className="hidden md:table">
        <thead>
          <tr>
            <Th>Receipt</Th>
            <Th>Date</Th>
            <Th>Donor</Th>
            <Th className="hidden lg:table-cell">Mobile</Th>
            <Th className="hidden lg:table-cell">Category</Th>
            <Th>Payment</Th>
            <Th className="hidden xl:table-cell">Reference</Th>
            <Th className="text-right">Amount</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {items.map((d) => (
            <tr key={d.id} className="hover:bg-stone-50">
              <Td>
                <Link href={`/donations/${d.id}`} className="font-mono text-saffron-800 hover:underline">
                  {d.receiptNumber}
                </Link>
              </Td>
              <Td className="whitespace-nowrap">{formatDonationDate(d.donationDate)}</Td>
              <Td className="max-w-[14rem] truncate font-medium">{d.donor.name}</Td>
              <Td className="hidden font-mono text-xs lg:table-cell">{d.donor.mobile}</Td>
              <Td className="hidden lg:table-cell">{d.category.name}</Td>
              <Td>
                <PaymentMethodBadge method={d.paymentMethod} />
              </Td>
              <Td className="hidden max-w-[10rem] truncate font-mono text-xs text-stone-500 xl:table-cell">{d.transactionReference ?? "—"}</Td>
              <Td className="text-right font-semibold tabular-nums whitespace-nowrap">{formatINR(d.amount)}</Td>
            </tr>
          ))}
        </tbody>
        <PeriodTotalRow summary={summary} colSpan={7} />
      </Table>
    </>
  );
}

function ExpenseRows({ items, summary }: { items: ExpenseWithRelations[]; summary: ReportSummary }) {
  return (
    <>
      <ul className="divide-y divide-stone-100 md:hidden">
        {items.map((e) => (
          <li key={e.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/expenditures/${e.id}`} className="font-mono text-sm font-semibold text-saffron-800 hover:underline">
                  {e.voucherNumber}
                </Link>
                <p className="mt-0.5 truncate font-medium text-stone-900">{e.paidTo}</p>
                <p className="truncate text-xs text-stone-500">
                  {formatDonationDate(e.expenseDate)}
                  {e.description ? ` · ${e.description}` : ""}
                </p>
              </div>
              <p className="shrink-0 text-lg font-semibold tabular-nums text-stone-900">{formatINR(e.amount)}</p>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <PaymentMethodBadge method={e.paymentMethod} />
              <span className="text-xs text-stone-600">{e.category.name}</span>
              {e.transactionReference ? <span className="font-mono text-xs text-stone-500">Ref: {e.transactionReference}</span> : null}
            </div>
          </li>
        ))}
        <li className="flex items-center justify-between bg-stone-50 px-4 py-3 font-semibold">
          <span className="text-stone-600">Period total ({summary.count})</span>
          <span className="tabular-nums">{formatINR(summary.total)}</span>
        </li>
      </ul>
      <Table className="hidden md:table">
        <thead>
          <tr>
            <Th>Voucher</Th>
            <Th>Date</Th>
            <Th>Paid to</Th>
            <Th className="hidden lg:table-cell">Category</Th>
            <Th>Payment</Th>
            <Th className="hidden xl:table-cell">Reference</Th>
            <Th className="text-right">Amount</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {items.map((e) => (
            <tr key={e.id} className="hover:bg-stone-50">
              <Td>
                <Link href={`/expenditures/${e.id}`} className="font-mono text-saffron-800 hover:underline">
                  {e.voucherNumber}
                </Link>
              </Td>
              <Td className="whitespace-nowrap">{formatDonationDate(e.expenseDate)}</Td>
              <Td>
                <span className="block max-w-[16rem] truncate font-medium">{e.paidTo}</span>
                {e.description ? <span className="block max-w-[16rem] truncate text-xs text-stone-500">{e.description}</span> : null}
              </Td>
              <Td className="hidden lg:table-cell">{e.category.name}</Td>
              <Td>
                <PaymentMethodBadge method={e.paymentMethod} />
              </Td>
              <Td className="hidden max-w-[10rem] truncate font-mono text-xs text-stone-500 xl:table-cell">{e.transactionReference ?? "—"}</Td>
              <Td className="text-right font-semibold tabular-nums whitespace-nowrap">{formatINR(e.amount)}</Td>
            </tr>
          ))}
        </tbody>
        <PeriodTotalRow summary={summary} colSpan={6} />
      </Table>
    </>
  );
}
