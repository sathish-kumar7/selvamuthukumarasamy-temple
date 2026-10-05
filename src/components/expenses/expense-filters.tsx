import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { PaymentMethod } from "@/generated/prisma/enums";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import type { ExpenseFilters } from "@/lib/validation/expense";
import { Input, Label, Select } from "@/components/ui/form";
import { Button, buttonClasses } from "@/components/ui/button";

interface Props {
  filters: ExpenseFilters;
  categories: { id: string; name: string }[];
}

/** GET form so filters live in the URL and are shareable (same pattern as the Donations page). */
export function ExpenseFilterBar({ filters, categories }: Props) {
  const advancedActive = !!(filters.from || filters.to || filters.paymentMethod || filters.categoryId || filters.status !== "ALL");
  const hasFilters = advancedActive || !!filters.q;

  return (
    <form method="get" action="/expenditures" className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label htmlFor="q">Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" aria-hidden />
            <Input id="q" name="q" defaultValue={filters.q} placeholder="Paid to, description, voucher or bill no." className="pl-9" enterKeyHint="search" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" variant="secondary" className="flex-1 sm:flex-none">
            Search
          </Button>
          {hasFilters ? (
            <Link href="/expenditures" className={buttonClasses("ghost")} title="Clear filters">
              <X className="size-4" aria-hidden /> Clear
            </Link>
          ) : null}
        </div>
      </div>

      <details className="group mt-3" open={advancedActive}>
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 [&::-webkit-details-marker]:hidden">
          <SlidersHorizontal className="size-4" aria-hidden />
          <span className="group-open:hidden">More filters</span>
          <span className="hidden group-open:inline">Fewer filters</span>
          {advancedActive ? <span className="ml-1 rounded-full bg-saffron-100 px-2 py-0.5 text-xs text-saffron-900">active</span> : null}
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <Label htmlFor="from">From</Label>
            <Input id="from" name="from" type="date" defaultValue={filters.from} />
          </div>
          <div>
            <Label htmlFor="to">To</Label>
            <Input id="to" name="to" type="date" defaultValue={filters.to} />
          </div>
          <div>
            <Label htmlFor="paymentMethod">Paid by</Label>
            <Select id="paymentMethod" name="paymentMethod" defaultValue={filters.paymentMethod}>
              <option value="">All methods</option>
              {(Object.keys(PaymentMethod) as PaymentMethod[]).map((m) => (
                <option key={m} value={m}>
                  {PAYMENT_METHOD_LABELS[m]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="categoryId">Category</Label>
            <Select id="categoryId" name="categoryId" defaultValue={filters.categoryId}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select id="status" name="status" defaultValue={filters.status}>
              <option value="ALL">Active &amp; cancelled</option>
              <option value="ACTIVE">Active only</option>
              <option value="CANCELLED">Cancelled only</option>
            </Select>
          </div>
          <div className="sm:col-span-2 lg:col-span-5 lg:flex lg:justify-end">
            <Button type="submit" variant="outline" className="w-full lg:w-auto">
              Apply filters
            </Button>
          </div>
        </div>
      </details>
    </form>
  );
}
