import type { Metadata } from "next";
import { Download } from "lucide-react";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { getReportSummary, listReportTransactions, resolveReportRange, type ReportRange } from "@/lib/reports/query";
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
import { Pagination } from "@/components/ui/pagination";
import Link from "next/link";
import type { PaymentMethod } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage(props: PageProps<"/reports">) {
  const [user, searchParams] = await Promise.all([requireUser(), props.searchParams]);
  if (!can(user.role, "report:view")) return <Alert tone="warning">You do not have access to reports.</Alert>;

  const flat = Object.fromEntries(Object.entries(searchParams).filter(([, v]) => typeof v === "string")) as Record<string, string>;
  const parsed = reportRangeSchema.safeParse(flat);
  const rangeError = parsed.success ? null : parsed.error.issues[0]?.message ?? "Invalid date range";
  const range = resolveReportRange(parsed.success ? parsed.data : {});
  const page = parsed.success ? parsed.data.page : 1;

  const [summary, result] = await Promise.all([getReportSummary(range), listReportTransactions(range, page)]);
  const transactions = result.items;
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

        <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
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
            <p className="text-xs text-stone-500">
              {result.total} active receipt{result.total === 1 ? "" : "s"} · export CSV for the full list
            </p>
          </div>
          <TableWrapper>
            {transactions.length === 0 ? (
              <EmptyState title="No transactions" description="No active donations were recorded in this period." />
            ) : (
              <>
                <ul className="divide-y divide-stone-100 md:hidden">
                  {transactions.map((d) => (
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
                    {transactions.map((d) => (
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
                  <tfoot>
                    <tr className="bg-stone-50 font-semibold">
                      <Td colSpan={7} className="text-right text-stone-600">
                        Period total ({summary.count})
                      </Td>
                      <Td className="text-right tabular-nums">{formatINR(summary.total)}</Td>
                    </tr>
                  </tfoot>
                </Table>
              </>
            )}
          </TableWrapper>
          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            pageSize={result.pageSize}
            buildHref={(p) => buildReportHref(range, p)}
          />
        </section>
      </div>
    </>
  );
}

/** Keeps the selected range in pagination links so paging never resets the report. */
function buildReportHref(range: ReportRange, page: number): string {
  const params = new URLSearchParams({ preset: range.preset });
  if (range.preset === "custom") {
    params.set("from", range.from);
    params.set("to", range.to);
  }
  if (page > 1) params.set("page", String(page));
  return `/reports?${params.toString()}`;
}
