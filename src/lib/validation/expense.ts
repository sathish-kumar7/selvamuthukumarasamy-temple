import { z } from "zod";
import { amount, isoDate, optionalTrimmed, trimmedString } from "./common";
import { paymentMethodValues } from "./donation";

export const expenseSchema = z.object({
  paidTo: trimmedString.min(2, "Enter who was paid").max(120, "Name is too long"),
  description: optionalTrimmed(300),
  amount,
  categoryId: trimmedString.min(1, "Select an expense category"),
  paymentMethod: z.enum(paymentMethodValues, { message: "Select a payment method" }),
  transactionReference: optionalTrimmed(100),
  expenseDate: isoDate,
  notes: optionalTrimmed(1000),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;

export const cancelExpenseSchema = z.object({
  expenseId: trimmedString.min(1),
  reason: trimmedString.min(5, "Please give a reason (at least 5 characters)").max(500),
});

export const expenseFiltersSchema = z.object({
  q: z.string().trim().max(120).optional().default(""),
  from: z.string().trim().optional().default(""),
  to: z.string().trim().optional().default(""),
  paymentMethod: z.enum(paymentMethodValues).optional().or(z.literal("")).default(""),
  categoryId: z.string().trim().optional().default(""),
  status: z.enum(["ACTIVE", "CANCELLED", "ALL"]).optional().default("ALL"),
  page: z.coerce.number().int().min(1).optional().default(1),
});

export type ExpenseFilters = z.infer<typeof expenseFiltersSchema>;
