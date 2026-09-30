"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/current-user";
import { hashPassword } from "@/lib/auth/password";
import { writeAuditLog } from "@/lib/audit";
import { getRequestIp } from "@/lib/request-ip";
import { createUserSchema, resetPasswordSchema, updateUserSchema } from "@/lib/validation/user";
import { formDataToObject, toFieldErrors, type ActionState } from "@/lib/validation/common";

export async function createUserAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = createUserSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) return { ok: false, fieldErrors: { email: "A user with this email already exists" } };

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      passwordHash: await hashPassword(parsed.data.password),
    },
  });
  await writeAuditLog({
    action: "USER_CREATED",
    entityType: "User",
    entityId: user.id,
    userId: admin.id,
    ipAddress: await getRequestIp(),
    details: { email: user.email, role: user.role },
  });
  revalidatePath("/users");
  redirect("/users?created=1");
}

export async function updateUserAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = updateUserSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  const { userId, ...data } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) return { ok: false, message: "User not found" };

  const demotingOrDeactivating = existing.role === "ADMIN" && (data.role !== "ADMIN" || !data.active);
  if (demotingOrDeactivating) {
    if (existing.id === admin.id) {
      return { ok: false, message: "You cannot remove your own admin access. Ask another administrator." };
    }
    const otherAdmins = await prisma.user.count({ where: { role: "ADMIN", active: true, id: { not: userId } } });
    if (otherAdmins === 0) return { ok: false, message: "At least one active administrator is required" };
  }

  const emailTaken = await prisma.user.findFirst({ where: { email: data.email, id: { not: userId } } });
  if (emailTaken) return { ok: false, fieldErrors: { email: "Another user already has this email" } };

  await prisma.user.update({ where: { id: userId }, data });
  await writeAuditLog({
    action: "USER_UPDATED",
    entityType: "User",
    entityId: userId,
    userId: admin.id,
    ipAddress: await getRequestIp(),
    details: {
      before: { name: existing.name, email: existing.email, role: existing.role, active: existing.active },
      after: data,
    },
  });
  revalidatePath("/users");
  redirect("/users?updated=1");
}

export async function resetPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = resetPasswordSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

  const existing = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!existing) return { ok: false, message: "User not found" };

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { passwordHash: await hashPassword(parsed.data.password) },
  });
  await writeAuditLog({
    action: "USER_PASSWORD_RESET",
    entityType: "User",
    entityId: existing.id,
    userId: admin.id,
    ipAddress: await getRequestIp(),
    details: { byAdmin: true },
  });
  revalidatePath("/users");
  return { ok: true, message: "Password has been reset" };
}
