import type { Metadata } from "next";
import { Banknote, CalendarDays, IndianRupee, Landmark, ReceiptText, Scale, Smartphone, Wallet } from "lucide-react";
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
        title={`Namaste, ${user.name.split(" ")[0]}`}
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

      <section aria-label="Today" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Today's donations" value={formatINR(stats.todayTotal)} sub={`${stats.todayCount} receipt${stats.todayCount === 1 ? "" : "s"} today`} icon={<IndianRupee className="size-5" aria-hidden />} accent />
        <StatCard label="This month" value={formatINR(stats.monthTotal)} sub={`${stats.monthCount} receipt${stats.monthCount === 1 ? "" : "s"} this month`} icon={<CalendarDays className="size-5" aria-hidden />} />
        <StatCard label="Donations today" value={String(stats.todayCount)} sub="Active receipts issued" icon={<ReceiptText className="size-5" aria-hidden />} />
        <StatCard label="Cash today" value={formatINR(stats.todayByMethod.CASH)} icon={<Banknote className="size-5" aria-hidden />} />
        <StatCard label="UPI today" value={formatINR(stats.todayByMethod.UPI)} icon={<Smartphone className="size-5" aria-hidden />} />
        <StatCard label="Bank transfer today" value={formatINR(stats.todayByMethod.BANK_TRANSFER)} icon={<Landmark className="size-5" aria-hidden />} />
        <StatCard label="Cheque today" value={formatINR(stats.todayByMethod.CHEQUE)} />
        <StatCard label="Other today" value={formatINR(stats.todayByMethod.OTHER)} />
      </section>

      <section aria-label="Expenses" className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Spent this month" value={formatINR(stats.monthExpenses)} sub="Active expenses this month" icon={<Wallet className="size-5" aria-hidden />} />
        <StatCard
          label="Balance this month"
          value={formatINR(stats.monthNet)}
          sub={<span className={stats.monthNet.startsWith("-") ? "font-medium text-red-600" : "font-medium text-emerald-700"}>{stats.monthNet.startsWith("-") ? "Expenses exceed donations" : "Donations minus expenses"}</span>}
          icon={<Scale className="size-5" aria-hidden />}
        />
        <div className="col-span-2 flex items-center justify-between rounded-xl border border-dashed border-stone-300 px-4 py-3 text-sm text-stone-600">
          <span>Record and review temple spending on the Expenditures page.</span>
          <Button href="/expenditures" variant="outline" size="sm">
            Open
          </Button>
        </div>
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
