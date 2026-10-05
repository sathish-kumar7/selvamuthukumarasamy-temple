import { z } from "zod";
import { isoDate } from "./common";

export const reportRangeSchema = z
  .object({
    type: z.enum(["donations", "expenses"]).default("donations"),
    preset: z.enum(["today", "month", "custom"]).default("today"),
    from: isoDate.optional(),
    to: isoDate.optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
  })
  .refine((v) => v.preset !== "custom" || (v.from && v.to && v.from <= v.to), {
    path: ["to"],
    message: "End date must be on or after start date",
  });
