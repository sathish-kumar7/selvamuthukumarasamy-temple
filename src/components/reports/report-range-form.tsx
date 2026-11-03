import Link from "next/link";
import { IndianRupee, Wallet } from "lucide-react";
import type { ReportRange, ReportType } from "@/lib/reports/query";
import { ReportFilters } from "./report-filters";
import { cn } from "@/lib/cn";
import { PAGE_SIZE } from "@/lib/constants";

/**
 * Builds a /reports URL for the given type and preset, keeping a custom range when switching type.
 * The "Filter by" choice carries over only while the type stays the same (the options and
 * category lists differ between donations and expenses).
 */
export function reportHref(range: ReportRange, overrides: Partial<Pick<ReportRange, "type" | "preset">> = {}, page = 1): string {
  const type = overrides.type ?? range.type;
  const preset = overrides.preset ?? range.preset;
  const params = new URLSearchParams({ type, preset });
  if (preset === "custom") {
    params.set("from", range.from);
    params.set("to", range.to);
  }
  if (range.filter && type === range.type) {
    params.set("by", range.filter.by);
    params.set("value", range.filter.value);
  }
  if (range.pageSize !== PAGE_SIZE) params.set("size", String(range.pageSize));
  if (page > 1) params.set("page", String(page));
  return `/reports?${params.toString()}`;
}

const segment = (active: boolean) =>
  cn(
    "inline-flex h-11 items-center gap-2 rounded-lg border px-4 text-sm font-medium",
    active ? "border-saffron-600 bg-saffron-50 text-saffron-900" : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
  );

export function ReportRangeForm({ range, categories }: { range: ReportRange; categories: { id: string; name: string }[] }) {
  const types: { key: ReportType; label: string; icon: typeof Wallet }[] = [
    { key: "donations", label: "Donations", icon: IndianRupee },
    { key: "expenses", label: "Expenses", icon: Wallet },
  ];
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4">
        <div>
          <p className="mb-1.5 text-sm font-medium text-stone-700">Report</p>
          <div className="flex gap-2" role="group" aria-label="Report type">
            {types.map((t) => (
              <Link key={t.key} href={reportHref(range, { type: t.key })} className={segment(range.type === t.key)} aria-current={range.type === t.key ? "page" : undefined}>
                <t.icon className="size-4" aria-hidden /> {t.label}
              </Link>
            ))}
          </div>
        </div>
        {/* Keyed so the dropdowns reset to the URL's values after each navigation. */}
        <ReportFilters key={reportHref(range)} range={range} categories={categories} />
      </div>
    </div>
  );
}
