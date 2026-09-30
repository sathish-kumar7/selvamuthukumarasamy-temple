import { z } from "zod";
import { isoDate } from "./common";

export const reportRangeSchema = z
  .object({
    preset: z.enum(["today", "month", "custom"]).default("today"),
    from: isoDate.optional(),
    to: isoDate.optional(),
  })
  .refine((v) => v.preset !== "custom" || (v.from && v.to && v.from <= v.to), {
    path: ["to"],
    message: "End date must be on or after start date",
  });
