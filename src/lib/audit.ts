import type { Prisma } from "@/generated/prisma/client";
import type { AuditAction } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";

export interface AuditEntry {
  action: AuditAction;
  entityType: "Donation" | "User" | "DonationCategory" | "TempleSettings" | "Auth";
  entityId?: string | null;
  userId?: string | null;
  details?: Prisma.InputJsonValue;
  ipAddress?: string | null;
}

/**
 * Writes an audit log row. Pass a transaction client to record the entry
 * atomically with the change it describes.
 */
export async function writeAuditLog(entry: AuditEntry, tx?: Prisma.TransactionClient): Promise<void> {
  const client = tx ?? prisma;
  await client.auditLog.create({
    data: {
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      userId: entry.userId ?? null,
      details: entry.details,
      ipAddress: entry.ipAddress ?? null,
    },
  });
}

/** Returns only the keys whose values differ between two flat records. */
export function diffRecords<T extends Record<string, unknown>>(
  before: T,
  after: T,
): { before: Partial<T>; after: Partial<T> } {
  const changedBefore: Partial<T> = {};
  const changedAfter: Partial<T> = {};
  for (const key of Object.keys(after) as (keyof T)[]) {
    const a = before[key];
    const b = after[key];
    const same = a instanceof Date && b instanceof Date ? a.getTime() === b.getTime() : a === b;
    if (!same) {
      changedBefore[key] = a;
      changedAfter[key] = b;
    }
  }
  return { before: changedBefore, after: changedAfter };
}
