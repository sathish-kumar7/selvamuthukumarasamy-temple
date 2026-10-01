import { z } from "zod";
import { isValidIsoDate } from "@/lib/dates";
import { parseAmountInput } from "@/lib/money";

export type FieldErrors = Record<string, string>;

export interface ActionState {
  ok: boolean;
  message?: string;
  fieldErrors?: FieldErrors;
  /** Submitted values echoed back on failure so forms can repopulate (React resets uncontrolled fields after an action). */
  values?: Record<string, string>;
}

/** Attaches the submitted (non-secret) values to a failed action state. */
export function withValues(state: ActionState, formData: FormData): ActionState {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !/password/i.test(key) && !(key in values)) values[key] = value;
  }
  return { ...state, values };
}

export const initialActionState: ActionState = { ok: false };

/** Collapses Zod issues to a single message per top-level field. */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? String(issue.path[0]) : "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export const trimmedString = z.string().trim();

export const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be at most ${max} characters`)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

export const indianMobile = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .refine((v) => /^(\+?91)?[6-9]\d{9}$/.test(v), "Enter a valid 10-digit Indian mobile number")
  .transform((v) => v.slice(-10));

export const optionalEmail = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v.toLowerCase()))
  .refine((v) => v === null || z.email().safeParse(v).success, "Enter a valid email address")
  .nullable()
  .optional();

export const isoDate = z.string().trim().refine(isValidIsoDate, "Enter a valid date");

/** Accepts "1,001.50" style input and produces a canonical decimal string. */
export const amount = z
  .string()
  .trim()
  .min(1, "Amount is required")
  .transform((v, ctx) => {
    const parsed = parseAmountInput(v);
    if (!parsed) {
      ctx.addIssue({ code: "custom", message: "Enter an amount greater than zero with at most 2 decimals" });
      return z.NEVER;
    }
    return parsed;
  });

export const PASSWORD_MIN_LENGTH = 5;

export const password = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(128, "Password must be at most 128 characters");

/** Short login name such as "admin" or "ravi.k". Stored lowercase. */
export const username = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be at most 30 characters")
  .regex(/^[a-z0-9][a-z0-9._-]*$/, "Use only letters, numbers, dot, underscore or hyphen");

/** Reads FormData into a plain object of strings (first value per key). */
export function formDataToObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !(key in out)) out[key] = value;
  }
  return out;
}
