"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { sessionCookieOptions, signSession } from "@/lib/auth/session";
import { checkLoginRateLimit, clearLoginFailures, recordLoginFailure } from "@/lib/auth/rate-limit";
import { getCurrentUser, requireUser } from "@/lib/auth/current-user";
import { writeAuditLog } from "@/lib/audit";
import { getRequestIp } from "@/lib/request-ip";
import { loginSchema } from "@/lib/validation/auth";
import { changeOwnPasswordSchema } from "@/lib/validation/user";
import { formDataToObject, toFieldErrors, type ActionState } from "@/lib/validation/common";
import { SESSION_COOKIE } from "@/lib/constants";

const GENERIC_LOGIN_ERROR = "Invalid email or password";

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  }
  const { email, password } = parsed.data;
  const ip = await getRequestIp();
  const rateKey = `${ip ?? "unknown"}:${email}`;

  const limit = checkLoginRateLimit(rateKey);
  if (!limit.allowed) {
    const minutes = Math.max(1, Math.ceil(limit.retryAfterSeconds / 60));
    return { ok: false, message: `Too many failed attempts. Try again in ${minutes} minute${minutes > 1 ? "s" : ""}.` };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = user ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !valid || !user.active) {
    recordLoginFailure(rateKey);
    await writeAuditLog({
      action: "LOGIN_FAILED",
      entityType: "Auth",
      entityId: user?.id ?? null,
      ipAddress: ip,
      details: { email, reason: !user ? "unknown_email" : !valid ? "bad_password" : "inactive" },
    });
    return { ok: false, message: GENERIC_LOGIN_ERROR };
  }

  clearLoginFailures(rateKey);
  const token = await signSession({ sub: user.id, role: user.role, name: user.name });
  const store = await cookies();
  const { name, ...options } = sessionCookieOptions();
  store.set(name, token, options);

  await writeAuditLog({ action: "LOGIN_SUCCESS", entityType: "Auth", entityId: user.id, userId: user.id, ipAddress: ip });

  const next = formData.get("next");
  const target = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  redirect(target);
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function changeOwnPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = changeOwnPasswordSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || !(await verifyPassword(parsed.data.currentPassword, dbUser.passwordHash))) {
    return { ok: false, fieldErrors: { currentPassword: "Current password is incorrect" } };
  }
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.newPassword) } });
  await writeAuditLog({
    action: "USER_PASSWORD_RESET",
    entityType: "User",
    entityId: user.id,
    userId: user.id,
    ipAddress: await getRequestIp(),
    details: { self: true },
  });
  return { ok: true, message: "Password updated" };
}

export async function getSessionUser() {
  return getCurrentUser();
}
