import type { Metadata } from "next";
import { CalendarDays, CalendarRange, IndianRupee, ReceiptText, Scale, Wallet } from "lucide-react";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { getDashboardStats, getRecentDonations } from "@/lib/dashboard";
import { formatINR } from "@/lib/money";
import { formatIsoDate, todayIsoDate } from "@/lib/dates";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { DonationsTable } from "@/components/donations/donations-table";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage(props: PageProps<"/dashboard">) {
  const [user, stats, recent, searchParams] = await Promise.all([
    requireUser(),
    getDashboardStats(),
    getRecentDonations(8),
    props.searchParams,
  ]);
  const forbidden = searchParams.error === "forbidden";

  return (
    <>
      <PageHeader
        title={user.role === "ADMIN" ? "Welcome Admin" : `Welcome ${user.name.split(" ")[0]}`}
        description={`Today is ${formatIsoDate(todayIsoDate())}. Here is the collection summary.`}
        actions={
          <Button href="/donations/new" size="lg">
            <IndianRupee className="size-5" aria-hidden /> Add donation
          </Button>
        }
      />

      {forbidden ? (
        <Alert tone="warning" className="mb-6">
          You do not have permission to open that page.
        </Alert>
      ) : null}

      <section aria-label="Donations" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Today's donations" value={formatINR(stats.todayTotal)} sub={plural(stats.todayCount, "receipt")} icon={<IndianRupee className="size-5" aria-hidden />} accent />
        <StatCard label="Donations this month" value={formatINR(stats.monthDonations)} sub={plural(stats.monthCount, "receipt")} icon={<CalendarDays className="size-5" aria-hidden />} />
        <StatCard label="Donations this year" value={formatINR(stats.yearDonations)} sub={`${plural(stats.yearCount, "receipt")} since 1 January`} icon={<CalendarRange className="size-5" aria-hidden />} />
        <StatCard label="Receipts today" value={String(stats.todayCount)} sub="Active receipts issued" icon={<ReceiptText className="size-5" aria-hidden />} />
      </section>

      <section aria-label="Expenses and balance" className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Expenses this month" value={formatINR(stats.monthExpenses)} sub="Active expenses this month" icon={<Wallet className="size-5" aria-hidden />} />
        <StatCard label="Expenses this year" value={formatINR(stats.yearExpenses)} sub="Since 1 January" icon={<Wallet className="size-5" aria-hidden />} />
        <StatCard label="Balance this month" value={formatINR(stats.monthNet)} sub={<BalanceNote value={stats.monthNet} />} icon={<Scale className="size-5" aria-hidden />} />
        <StatCard label="Balance this year" value={formatINR(stats.yearNet)} sub={<BalanceNote value={stats.yearNet} />} icon={<Scale className="size-5" aria-hidden />} />
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">Recent donations</h2>
          <Button href="/donations" variant="ghost" size="sm">
            View all
          </Button>
        </div>
        <DonationsTable
          donations={recent}
          canEdit={can(user.role, "donation:edit")}
          compact
          emptyTitle="No donations yet"
          emptyDescription="Donations you record will appear here with their receipt numbers."
        />
      </section>
    </>
  );
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/** Donations minus expenses: green when positive, red when expenses exceed donations. */
function BalanceNote({ value }: { value: string }) {
  const negative = value.startsWith("-");
  return (
    <span className={negative ? "font-medium text-red-600" : "font-medium text-emerald-700"}>
      {negative ? "Expenses exceed donations" : "Donations minus expenses"}
    </span>
  );
}
