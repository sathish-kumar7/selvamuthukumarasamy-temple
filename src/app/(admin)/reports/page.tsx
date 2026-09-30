import type { Metadata } from "next";
import { Download } from "lucide-react";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { getReportSummary, getReportTransactions, resolveReportRange } from "@/lib/reports/query";
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
import { ReportRangeForm } from "@/components/reports/report-range-form";
import Link from "next/link";
import type { PaymentMethod } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Reports" };

const TABLE_LIMIT = 500;

export default async function ReportsPage(props: PageProps<"/reports">) {
  const [user, searchParams] = await Promise.all([requireUser(), props.searchParams]);
  if (!can(user.role, "report:view")) return <Alert tone="warning">You do not have access to reports.</Alert>;

  const flat = Object.fromEntries(Object.entries(searchParams).filter(([, v]) => typeof v === "string")) as Record<string, string>;
  const parsed = reportRangeSchema.safeParse(flat);
  const rangeError = parsed.success ? null : parsed.error.issues[0]?.message ?? "Invalid date range";
  const range = resolveReportRange(parsed.success ? parsed.data : {});

  const [summary, transactions] = await Promise.all([getReportSummary(range), getReportTransactions(range, { limit: TABLE_LIMIT })]);
  const exportHref = `/api/reports/export?format=csv&from=${range.from}&to=${range.to}`;
  const rangeLabel = range.from === range.to ? formatIsoDate(range.from) : `${formatIsoDate(range.from)} – ${formatIsoDate(range.to)}`;

  return (
    <>
      <PageHeader
        title="Reports"
        description={`Collections for ${rangeLabel}. Cancelled receipts are excluded from totals.`}
        actions={
          <a href={exportHref} className={buttonClasses("outline")} download>
            <Download className="size-4" aria-hidden /> Export CSV
          </a>
        }
      />

      <div className="space-y-6">
        <ReportRangeForm range={range} />
        {rangeError ? <Alert tone="error">{rangeError}</Alert> : null}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Total donations" value={formatINR(summary.total)} sub={`${summary.count} receipt${summary.count === 1 ? "" : "s"}`} accent />
          <StatCard label="Number of donations" value={String(summary.count)} />
          {(["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "OTHER"] as PaymentMethod[]).map((m) => (
            <StatCard key={m} label={`${PAYMENT_METHOD_LABELS[m]} total`} value={formatINR(summary.byMethod[m].total)} sub={`${summary.byMethod[m].count} receipt${summary.byMethod[m].count === 1 ? "" : "s"}`} />
          ))}
        </section>

        <Card>
          <CardHeader title="Category totals" />
          {summary.byCategory.length === 0 ? (
            <EmptyState title="No donations in this period" />
          ) : (
            <CardBody className="p-0">
              <Table>
                <thead>
                  <tr>
                    <Th>Category</Th>
                    <Th className="text-right">Receipts</Th>
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

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-stone-900">Transactions</h2>
            {transactions.length >= TABLE_LIMIT ? (
              <p className="text-xs text-stone-500">Showing first {TABLE_LIMIT}. Export CSV for the full list.</p>
            ) : (
              <p className="text-xs text-stone-500">{transactions.length} active receipt{transactions.length === 1 ? "" : "s"}</p>
            )}
          </div>
          <TableWrapper>
            {transactions.length === 0 ? (
              <EmptyState title="No transactions" description="No active donations were recorded in this period." />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Receipt</Th>
                    <Th>Date</Th>
                    <Th>Donor</Th>
                    <Th className="hidden md:table-cell">Mobile</Th>
                    <Th className="hidden lg:table-cell">Category</Th>
                    <Th className="hidden sm:table-cell">Payment</Th>
                    <Th className="hidden xl:table-cell">Reference</Th>
                    <Th className="text-right">Amount</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {transactions.map((d) => (
                    <tr key={d.id} className="hover:bg-stone-50">
                      <Td>
                        <Link href={`/donations/${d.id}`} className="font-mono text-saffron-800 hover:underline">
                          {d.receiptNumber}
                        </Link>
                      </Td>
                      <Td className="whitespace-nowrap">{formatDonationDate(d.donationDate)}</Td>
                      <Td className="max-w-[14rem] truncate font-medium">{d.donor.name}</Td>
                      <Td className="hidden font-mono text-xs md:table-cell">{d.donor.mobile}</Td>
                      <Td className="hidden lg:table-cell">{d.category.name}</Td>
                      <Td className="hidden sm:table-cell">
                        <PaymentMethodBadge method={d.paymentMethod} />
                      </Td>
                      <Td className="hidden max-w-[10rem] truncate font-mono text-xs text-stone-500 xl:table-cell">{d.transactionReference ?? "—"}</Td>
                      <Td className="text-right font-semibold tabular-nums whitespace-nowrap">{formatINR(d.amount)}</Td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-stone-50 font-semibold">
                    <Td colSpan={7} className="text-right text-stone-600">
                      Total ({summary.count})
                    </Td>
                    <Td className="text-right tabular-nums">{formatINR(summary.total)}</Td>
                  </tr>
                </tfoot>
              </Table>
            )}
          </TableWrapper>
        </section>
      </div>
    </>
  );
}
