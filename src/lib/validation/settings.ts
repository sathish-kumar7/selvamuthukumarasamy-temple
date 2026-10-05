import { z } from "zod";
import { optionalTrimmed, trimmedString } from "./common";

export const categorySchema = z.object({
  name: trimmedString.min(2, "Category name is required").max(80),
});

export const updateCategorySchema = z.object({
  categoryId: trimmedString.min(1),
  name: trimmedString.min(2, "Category name is required").max(80),
  active: z.enum(["true", "false"]).transform((v) => v === "true"),
});

export const templeSettingsSchema = z.object({
  templeName: trimmedString.min(2, "Temple name is required").max(120),
  templeNameTamil: optionalTrimmed(160),
  registrationNumber: optionalTrimmed(60),
  addressLine1: optionalTrimmed(200),
  addressLine2: optionalTrimmed(200),
  phone: optionalTrimmed(40),
  email: optionalTrimmed(120),
  website: optionalTrimmed(120),
  receiptPrefix: trimmedString
    .min(2, "Prefix must be 2-6 letters")
    .max(6, "Prefix must be 2-6 letters")
    .regex(/^[A-Za-z]+$/, "Letters only")
    .transform((v) => v.toUpperCase()),
  thankYouMessage: trimmedString.min(5).max(500),
  authorizedSignatory: trimmedString.min(2).max(80),
  secondarySignatory: optionalTrimmed(80),
});
