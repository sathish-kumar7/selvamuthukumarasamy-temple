"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/current-user";
import { writeAuditLog } from "@/lib/audit";
import { getRequestIp } from "@/lib/request-ip";
import { categorySchema, templeSettingsSchema, updateCategorySchema } from "@/lib/validation/settings";
import { formDataToObject, toFieldErrors, withValues, type ActionState } from "@/lib/validation/common";

export async function createCategoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = categorySchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return withValues({ ok: false, fieldErrors: toFieldErrors(parsed.error) }, formData);

  const duplicate = await prisma.donationCategory.findFirst({
    where: { name: { equals: parsed.data.name, mode: "insensitive" } },
  });
  if (duplicate) return withValues({ ok: false, fieldErrors: { name: "This category already exists" } }, formData);

  const maxOrder = await prisma.donationCategory.aggregate({ _max: { sortOrder: true } });
  const category = await prisma.donationCategory.create({
    data: { name: parsed.data.name, sortOrder: (maxOrder._max.sortOrder ?? 0) + 1 },
  });
  await writeAuditLog({
    action: "CATEGORY_CREATED",
    entityType: "DonationCategory",
    entityId: category.id,
    userId: admin.id,
    ipAddress: await getRequestIp(),
    details: { name: category.name },
  });
  revalidatePath("/settings");
  return { ok: true, message: `Added "${category.name}"` };
}

export async function updateCategoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = updateCategorySchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return withValues({ ok: false, fieldErrors: toFieldErrors(parsed.error) }, formData);
  const { categoryId, ...data } = parsed.data;

  const existing = await prisma.donationCategory.findUnique({ where: { id: categoryId } });
  if (!existing) return { ok: false, message: "Category not found" };

  const duplicate = await prisma.donationCategory.findFirst({
    where: { name: { equals: data.name, mode: "insensitive" }, id: { not: categoryId } },
  });
  if (duplicate) return withValues({ ok: false, fieldErrors: { name: "Another category already has this name" } }, formData);

  await prisma.donationCategory.update({ where: { id: categoryId }, data });
  await writeAuditLog({
    action: "CATEGORY_UPDATED",
    entityType: "DonationCategory",
    entityId: categoryId,
    userId: admin.id,
    ipAddress: await getRequestIp(),
    details: { before: { name: existing.name, active: existing.active }, after: data },
  });
  revalidatePath("/settings");
  return { ok: true, message: "Category updated" };
}

export async function updateTempleSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = templeSettingsSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return withValues({ ok: false, fieldErrors: toFieldErrors(parsed.error) }, formData);

  const before = await prisma.templeSettings.findUnique({ where: { id: 1 } });
  await prisma.templeSettings.upsert({
    where: { id: 1 },
    update: parsed.data,
    create: { id: 1, ...parsed.data },
  });
  await writeAuditLog({
    action: "SETTINGS_UPDATED",
    entityType: "TempleSettings",
    entityId: "1",
    userId: admin.id,
    ipAddress: await getRequestIp(),
    details: { before: before ? JSON.parse(JSON.stringify(before)) : null, after: parsed.data },
  });
  revalidatePath("/", "layout");
  return { ok: true, message: "Temple details saved" };
}
