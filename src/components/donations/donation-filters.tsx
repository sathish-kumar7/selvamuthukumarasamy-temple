import { Search, X } from "lucide-react";
import { PaymentMethod } from "@/generated/prisma/enums";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import type { DonationFilters } from "@/lib/validation/donation";
import { Input, Label, Select } from "@/components/ui/form";
import { Button, buttonClasses } from "@/components/ui/button";
import Link from "next/link";

interface Props {
  filters: DonationFilters;
  categories: { id: string; name: string }[];
}

/** GET form so filters live in the URL and are shareable/bookmarkable. */
export function DonationFilterBar({ filters, categories }: Props) {
  const hasFilters = !!(filters.q || filters.from || filters.to || filters.paymentMethod || filters.categoryId || filters.status !== "ALL");
  return (
    <form method="get" action="/donations" className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-12">
        <div className="md:col-span-4">
          <Label htmlFor="q">Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" aria-hidden />
            <Input id="q" name="q" defaultValue={filters.q} placeholder="Donor name, mobile or receipt no." className="pl-9" />
          </div>
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="from">From</Label>
          <Input id="from" name="from" type="date" defaultValue={filters.from} />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="to">To</Label>
          <Input id="to" name="to" type="date" defaultValue={filters.to} />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="paymentMethod">Payment</Label>
          <Select id="paymentMethod" name="paymentMethod" defaultValue={filters.paymentMethod}>
            <option value="">All methods</option>
            {(Object.keys(PaymentMethod) as PaymentMethod[]).map((m) => (
              <option key={m} value={m}>
                {PAYMENT_METHOD_LABELS[m]}
              </option>
            ))}
          </Select>
        </div>
        <div className="md:col-span-2">
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
        <div className="md:col-span-2">
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={filters.status}>
            <option value="ALL">Active &amp; cancelled</option>
            <option value="ACTIVE">Active only</option>
            <option value="CANCELLED">Cancelled only</option>
          </Select>
        </div>
        <div className="flex items-end gap-2 md:col-span-10 md:justify-end">
          {hasFilters ? (
            <Link href="/donations" className={buttonClasses("ghost")}>
              <X className="size-4" aria-hidden /> Clear
            </Link>
          ) : null}
          <Button type="submit" variant="secondary">
            Apply filters
          </Button>
        </div>
      </div>
    </form>
  );
}
