import { z } from "zod";
import { Role } from "@/generated/prisma/enums";
import { password, trimmedString } from "./common";

const roleValues = Object.values(Role) as [Role, ...Role[]];

export const createUserSchema = z.object({
  name: trimmedString.min(2, "Name is required").max(120),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  role: z.enum(roleValues, { message: "Select a role" }),
  password,
});

export const updateUserSchema = z.object({
  userId: trimmedString.min(1),
  name: trimmedString.min(2, "Name is required").max(120),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  role: z.enum(roleValues, { message: "Select a role" }),
  active: z.enum(["true", "false"]).transform((v) => v === "true"),
});

export const resetPasswordSchema = z.object({
  userId: trimmedString.min(1),
  password,
});

export const changeOwnPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
