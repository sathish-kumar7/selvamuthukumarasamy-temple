import Link from "next/link";
import type { ReportRange } from "@/lib/reports/query";
import { Input, Label } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function ReportRangeForm({ range }: { range: ReportRange }) {
  const presets: { key: ReportRange["preset"]; label: string; href: string }[] = [
    { key: "today", label: "Today", href: "/reports?preset=today" },
    { key: "month", label: "This month", href: "/reports?preset=month" },
  ];
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <Link
              key={p.key}
              href={p.href}
              className={cn(
                "inline-flex h-11 items-center rounded-lg border px-4 text-sm font-medium",
                range.preset === p.key ? "border-saffron-600 bg-saffron-50 text-saffron-900" : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
              )}
            >
              {p.label}
            </Link>
          ))}
        </div>
        <form method="get" action="/reports" className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="preset" value="custom" />
          <div>
            <Label htmlFor="from">From</Label>
            <Input id="from" name="from" type="date" defaultValue={range.from} required className="h-11" />
          </div>
          <div>
            <Label htmlFor="to">To</Label>
            <Input id="to" name="to" type="date" defaultValue={range.to} required className="h-11" />
          </div>
          <Button type="submit" variant={range.preset === "custom" ? "primary" : "secondary"}>
            Apply range
          </Button>
        </form>
      </div>
    </div>
  );
}
