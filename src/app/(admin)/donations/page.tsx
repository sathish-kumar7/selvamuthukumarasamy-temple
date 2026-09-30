import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { getAllCategories, listDonations } from "@/lib/donations/service";
import { donationFiltersSchema, type DonationFilters } from "@/lib/validation/donation";
import { isValidIsoDate } from "@/lib/dates";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { DonationsTable } from "@/components/donations/donations-table";
import { DonationFilterBar } from "@/components/donations/donation-filters";

export const metadata: Metadata = { title: "Donations" };

function parseFilters(searchParams: Record<string, string | string[] | undefined>): DonationFilters {
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(searchParams)) {
    if (typeof v === "string") flat[k] = v;
  }
  const parsed = donationFiltersSchema.safeParse(flat);
  const filters = parsed.success ? parsed.data : donationFiltersSchema.parse({});
  // Ignore malformed dates rather than failing the whole page.
  if (filters.from && !isValidIsoDate(filters.from)) filters.from = "";
  if (filters.to && !isValidIsoDate(filters.to)) filters.to = "";
  return filters;
}

function buildHref(filters: DonationFilters, page: number): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.paymentMethod) params.set("paymentMethod", filters.paymentMethod);
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.status !== "ALL") params.set("status", filters.status);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/donations?${qs}` : "/donations";
}

export default async function DonationsPage(props: PageProps<"/donations">) {
  const [user, searchParams] = await Promise.all([requireUser(), props.searchParams]);
  const filters = parseFilters(searchParams);
  const [result, categories] = await Promise.all([listDonations(filters), getAllCategories()]);

  return (
    <>
      <PageHeader
        title="Donations"
        description="Search, filter and manage all recorded donations."
        actions={
          <Button href="/donations/new">
            <Plus className="size-4" aria-hidden /> Add donation
          </Button>
        }
      />
      <div className="space-y-4">
        <DonationFilterBar filters={filters} categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
        <DonationsTable donations={result.items} canEdit={can(user.role, "donation:edit")} />
        <Pagination
          page={result.page}
          pageCount={result.pageCount}
          total={result.total}
          pageSize={result.pageSize}
          buildHref={(page) => buildHref(filters, page)}
        />
      </div>
    </>
  );
}
