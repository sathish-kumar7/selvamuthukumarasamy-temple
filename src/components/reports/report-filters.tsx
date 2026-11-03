"use client";

import { useRef, useState } from "react";
import type { ReportRange } from "@/lib/reports/query";
import { REPORT_FILTERS, type ReportFilterKey } from "@/lib/reports/filters";
import { Input, Label, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";

const PRESETS: { key: ReportRange["preset"]; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "month", label: "This month" },
  { key: "year", label: "This year" },
  { key: "custom", label: "Custom range" },
];

const METHODS = ["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "OTHER"] as const;

/**
 * Period plus a single "Filter by" choice as a plain GET form. The value control depends on the
 * choice: category list, payment list, or a text box. Dropdown picks submit straight away; typed
 * text and a custom range wait for "Apply" / Enter.
 */
export function ReportFilters({ range, categories }: { range: ReportRange; categories: { id: string; name: string }[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [preset, setPreset] = useState(range.preset);
  const [by, setBy] = useState<ReportFilterKey | "">(range.filter?.by ?? "");
  const submit = () => formRef.current?.requestSubmit();

  const options = REPORT_FILTERS[range.type];
  const option = options.find((o) => o.key === by);
  // Only pre-fill the value when the choice is the one already applied.
  const currentValue = range.filter?.by === by ? range.filter.value : "";

  return (
    <form ref={formRef} method="get" action="/reports" className="grid grid-cols-2 items-end gap-3 sm:flex sm:flex-wrap">
      <input type="hidden" name="type" value={range.type} />
      <input type="hidden" name="size" value={range.pageSize} />
      <div>
        <Label htmlFor="preset">Period</Label>
        <Select
          id="preset"
          name="preset"
          value={preset}
          onChange={(e) => {
            const next = e.target.value as ReportRange["preset"];
            setPreset(next);
            if (next !== "custom") submit();
          }}
          className="h-11 sm:w-40"
        >
          {PRESETS.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </Select>
      </div>
      {preset === "custom" ? (
        <>
          <div>
            <Label htmlFor="from">From</Label>
            <Input id="from" name="from" type="date" defaultValue={range.from} required className="h-11" />
          </div>
          <div>
            <Label htmlFor="to">To</Label>
            <Input id="to" name="to" type="date" defaultValue={range.to} required className="h-11" />
          </div>
        </>
      ) : null}
      <div>
        <Label htmlFor="by">Filter by</Label>
        <Select
          id="by"
          name="by"
          value={by}
          onChange={(e) => {
            const next = e.target.value as ReportFilterKey | "";
            setBy(next);
            // Clearing the filter applies immediately; a new choice waits for its value.
            if (!next && range.filter) submit();
          }}
          className="h-11 sm:w-48"
        >
          <option value="">No filter</option>
          {options.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
      {option ? (
        <div key={option.key} className={option.kind === "text" ? "col-span-2 sm:col-span-1" : undefined}>
          <Label htmlFor="value">{option.label}</Label>
          {option.kind === "category" ? (
            <Select id="value" name="value" defaultValue={currentValue} onChange={submit} required className="h-11 sm:w-52">
              <option value="" disabled>
                Select a category
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          ) : option.kind === "payment" ? (
            <Select id="value" name="value" defaultValue={currentValue} onChange={submit} required className="h-11 sm:w-44">
              <option value="" disabled>
                Select a payment
              </option>
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {PAYMENT_METHOD_LABELS[m]}
                </option>
              ))}
            </Select>
          ) : (
            <Input
              id="value"
              name="value"
              type="search"
              defaultValue={currentValue}
              maxLength={120}
              placeholder={option.placeholder}
              autoFocus={!currentValue}
              className="h-11 sm:w-60"
            />
          )}
        </div>
      ) : null}
      <Button type="submit" className="col-span-2 sm:col-span-1">
        Apply
      </Button>
    </form>
  );
}
