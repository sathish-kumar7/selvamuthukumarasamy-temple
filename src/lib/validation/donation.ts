import { z } from "zod";
import { PaymentMethod } from "@/generated/prisma/enums";
import { amount, indianMobile, isoDate, optionalEmail, optionalTrimmed, trimmedString } from "./common";

export const paymentMethodValues = Object.values(PaymentMethod) as [PaymentMethod, ...PaymentMethod[]];

export const donationSchema = z.object({
  donorName: trimmedString.min(2, "Donor name is required").max(120, "Name is too long"),
  donorMobile: indianMobile,
  donorEmail: optionalEmail,
  donorAddress: optionalTrimmed(500),
  amount,
  categoryId: trimmedString.min(1, "Select a donation purpose"),
  paymentMethod: z.enum(paymentMethodValues, { message: "Select a payment method" }),
  transactionReference: optionalTrimmed(100),
  donationDate: isoDate,
  notes: optionalTrimmed(1000),
});

export type DonationInput = z.infer<typeof donationSchema>;

export const cancelDonationSchema = z.object({
  donationId: trimmedString.min(1),
  reason: trimmedString.min(5, "Please give a reason (at least 5 characters)").max(500),
});

export const donationFiltersSchema = z.object({
  q: z.string().trim().max(120).optional().default(""),
  from: z.string().trim().optional().default(""),
  to: z.string().trim().optional().default(""),
  paymentMethod: z.enum(paymentMethodValues).optional().or(z.literal("")).default(""),
  categoryId: z.string().trim().optional().default(""),
  status: z.enum(["ACTIVE", "CANCELLED", "ALL"]).optional().default("ALL"),
  page: z.coerce.number().int().min(1).optional().default(1),
});

export type DonationFilters = z.infer<typeof donationFiltersSchema>;
