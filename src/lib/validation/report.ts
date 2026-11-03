import { z } from "zod";
import { isoDate } from "./common";
import { REPORT_FILTER_KEYS } from "@/lib/reports/filters";

export const reportRangeSchema = z
  .object({
    type: z.enum(["donations", "expenses"]).default("donations"),
    preset: z.enum(["today", "month", "year", "custom"]).default("today"),
    from: isoDate.optional(),
    to: isoDate.optional(),
    by: z.enum(REPORT_FILTER_KEYS).optional().or(z.literal("").transform(() => undefined)),
    value: z.string().trim().max(120).optional().transform((v) => v || undefined),
    size: z.coerce.number().int().optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
  })
  .refine((v) => v.preset !== "custom" || (v.from && v.to && v.from <= v.to), {
    path: ["to"],
    message: "End date must be on or after start date",
  });
