import Link from "next/link";
import { IndianRupee, Wallet } from "lucide-react";
import type { ReportRange, ReportType } from "@/lib/reports/query";
import { Input, Label } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/** Builds a /reports URL for the given type and preset, keeping a custom range when switching type. */
export function reportHref(range: ReportRange, overrides: Partial<Pick<ReportRange, "type" | "preset">> = {}, page = 1): string {
  const type = overrides.type ?? range.type;
  const preset = overrides.preset ?? range.preset;
  const params = new URLSearchParams({ type, preset });
  if (preset === "custom") {
    params.set("from", range.from);
    params.set("to", range.to);
  }
  if (page > 1) params.set("page", String(page));
  return `/reports?${params.toString()}`;
}

const segment = (active: boolean) =>
  cn(
    "inline-flex h-11 items-center gap-2 rounded-lg border px-4 text-sm font-medium",
    active ? "border-saffron-600 bg-saffron-50 text-saffron-900" : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
  );

export function ReportRangeForm({ range }: { range: ReportRange }) {
  const types: { key: ReportType; label: string; icon: typeof Wallet }[] = [
    { key: "donations", label: "Donations", icon: IndianRupee },
    { key: "expenses", label: "Expenses", icon: Wallet },
  ];
  const presets: { key: ReportRange["preset"]; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "month", label: "This month" },
  ];
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
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
          <div>
            <p className="mb-1.5 text-sm font-medium text-stone-700">Period</p>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <Link key={p.key} href={reportHref(range, { preset: p.key })} className={segment(range.preset === p.key)}>
                  {p.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <form method="get" action="/reports" className="grid grid-cols-2 items-end gap-3 sm:flex sm:flex-wrap">
          <input type="hidden" name="type" value={range.type} />
          <input type="hidden" name="preset" value="custom" />
          <div>
            <Label htmlFor="from">From</Label>
            <Input id="from" name="from" type="date" defaultValue={range.from} required className="h-11" />
          </div>
          <div>
            <Label htmlFor="to">To</Label>
            <Input id="to" name="to" type="date" defaultValue={range.to} required className="h-11" />
          </div>
          <Button type="submit" variant={range.preset === "custom" ? "primary" : "secondary"} className="col-span-2 sm:col-span-1">
            Apply range
          </Button>
        </form>
      </div>
    </div>
  );
}
