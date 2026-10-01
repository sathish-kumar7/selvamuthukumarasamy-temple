"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/current-user";
import { hashPassword } from "@/lib/auth/password";
import { writeAuditLog } from "@/lib/audit";
import { getRequestIp } from "@/lib/request-ip";
import { createUserSchema, resetPasswordSchema, updateUserSchema } from "@/lib/validation/user";
import { formDataToObject, toFieldErrors, withValues, type ActionState } from "@/lib/validation/common";

export async function createUserAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = createUserSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return withValues({ ok: false, fieldErrors: toFieldErrors(parsed.error) }, formData);

  const usernameTaken = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (usernameTaken) return withValues({ ok: false, fieldErrors: { username: "This username is already taken" } }, formData);
  if (parsed.data.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (emailTaken) return withValues({ ok: false, fieldErrors: { email: "A user with this email already exists" } }, formData);
  }

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      username: parsed.data.username,
      email: parsed.data.email ?? null,
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
    details: { username: user.username, email: user.email, role: user.role },
  });
  revalidatePath("/users");
  redirect("/users?created=1");
}

export async function updateUserAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = updateUserSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return withValues({ ok: false, fieldErrors: toFieldErrors(parsed.error) }, formData);
  const { userId, ...data } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) return { ok: false, message: "User not found" };

  const demotingOrDeactivating = existing.role === "ADMIN" && (data.role !== "ADMIN" || !data.active);
  if (demotingOrDeactivating) {
    if (existing.id === admin.id) {
      return withValues({ ok: false, message: "You cannot remove your own admin access. Ask another administrator." }, formData);
    }
    const otherAdmins = await prisma.user.count({ where: { role: "ADMIN", active: true, id: { not: userId } } });
    if (otherAdmins === 0) return withValues({ ok: false, message: "At least one active administrator is required" }, formData);
  }

  const usernameTaken = await prisma.user.findFirst({ where: { username: data.username, id: { not: userId } } });
  if (usernameTaken) return withValues({ ok: false, fieldErrors: { username: "Another user already has this username" } }, formData);
  if (data.email) {
    const emailTaken = await prisma.user.findFirst({ where: { email: data.email, id: { not: userId } } });
    if (emailTaken) return withValues({ ok: false, fieldErrors: { email: "Another user already has this email" } }, formData);
  }

  await prisma.user.update({ where: { id: userId }, data: { ...data, email: data.email ?? null } });
  await writeAuditLog({
    action: "USER_UPDATED",
    entityType: "User",
    entityId: userId,
    userId: admin.id,
    ipAddress: await getRequestIp(),
    details: {
      before: { name: existing.name, username: existing.username, email: existing.email, role: existing.role, active: existing.active },
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
