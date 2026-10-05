import type { Metadata } from "next";
import { CalendarDays, IndianRupee, Plus, Scale, Wallet } from "lucide-react";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { getAllExpenseCategories, getExpenseSummary, listExpenses } from "@/lib/expenses/service";
import { expenseFiltersSchema, type ExpenseFilters } from "@/lib/validation/expense";
import { isValidIsoDate } from "@/lib/dates";
import { formatINR } from "@/lib/money";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { StatCard } from "@/components/dashboard/stat-card";
import { ExpensesTable } from "@/components/expenses/expenses-table";
import { ExpenseFilterBar } from "@/components/expenses/expense-filters";

export const metadata: Metadata = { title: "Expenditures" };

function parseFilters(searchParams: Record<string, string | string[] | undefined>): ExpenseFilters {
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(searchParams)) {
    if (typeof v === "string") flat[k] = v;
  }
  const parsed = expenseFiltersSchema.safeParse(flat);
  const filters = parsed.success ? parsed.data : expenseFiltersSchema.parse({});
  // Ignore malformed dates rather than failing the whole page.
  if (filters.from && !isValidIsoDate(filters.from)) filters.from = "";
  if (filters.to && !isValidIsoDate(filters.to)) filters.to = "";
  return filters;
}

function buildHref(filters: ExpenseFilters, page: number): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.paymentMethod) params.set("paymentMethod", filters.paymentMethod);
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.status !== "ALL") params.set("status", filters.status);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/expenditures?${qs}` : "/expenditures";
}

export default async function ExpendituresPage(props: PageProps<"/expenditures">) {
  const [user, searchParams] = await Promise.all([requireUser(), props.searchParams]);
  const filters = parseFilters(searchParams);
  const [result, categories, summary] = await Promise.all([listExpenses(filters), getAllExpenseCategories(), getExpenseSummary()]);
  const monthNetNegative = summary.monthNet.startsWith("-");
  const yearNetNegative = summary.yearNet.startsWith("-");

  return (
    <>
      <PageHeader
        title="Expenditures"
        description="Record what the temple spends and compare it with donations received. Cancelled entries are excluded from totals."
        actions={
          <Button href="/expenditures/new">
            <Plus className="size-4" aria-hidden /> Add expense
          </Button>
        }
      />

      <section aria-label="Expense summary" className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Spent today" value={formatINR(summary.todayTotal)} sub={`${summary.todayCount} expense${summary.todayCount === 1 ? "" : "s"} today`} icon={<Wallet className="size-5" aria-hidden />} accent />
        <StatCard label="Spent this month" value={formatINR(summary.monthTotal)} sub={`${summary.monthCount} expense${summary.monthCount === 1 ? "" : "s"} this month`} icon={<CalendarDays className="size-5" aria-hidden />} />
        <StatCard label="Donations this month" value={formatINR(summary.monthDonations)} sub="Active receipts only" icon={<IndianRupee className="size-5" aria-hidden />} />
        <StatCard
          label="Balance this month"
          value={formatINR(summary.monthNet)}
          sub={<span className={monthNetNegative ? "font-medium text-red-600" : "font-medium text-emerald-700"}>{monthNetNegative ? "Expenses exceed donations" : "Donations minus expenses"}</span>}
          icon={<Scale className="size-5" aria-hidden />}
        />
        <StatCard label="Spent this year" value={formatINR(summary.yearTotal)} sub="1 January to today" />
        <StatCard label="Donations this year" value={formatINR(summary.yearDonations)} sub="1 January to today" />
        <StatCard
          label="Balance this year"
          value={formatINR(summary.yearNet)}
          sub={<span className={yearNetNegative ? "font-medium text-red-600" : "font-medium text-emerald-700"}>{yearNetNegative ? "Expenses exceed donations" : "Donations minus expenses"}</span>}
        />
      </section>

      <div className="space-y-4">
        <ExpenseFilterBar filters={filters} categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
        <ExpensesTable
          expenses={result.items}
          canEdit={can(user.role, "expense:edit")}
          total={{ amount: result.filteredTotal, count: result.filteredCount }}
        />
        <Pagination page={result.page} pageCount={result.pageCount} total={result.total} pageSize={result.pageSize} buildHref={(page) => buildHref(filters, page)} />
      </div>
    </>
  );
}
