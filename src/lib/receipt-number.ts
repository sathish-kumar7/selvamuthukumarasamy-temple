import type { Prisma } from "@/generated/prisma/client";

const SEQUENCE_PADDING = 6;

/**
 * Allocates the next receipt number for the given year atomically.
 *
 * Uses a single INSERT ... ON CONFLICT DO UPDATE ... RETURNING statement, which
 * takes a row lock on the year's sequence row, so concurrent donation inserts
 * cannot receive the same number. Must be called inside the same transaction
 * that inserts the donation so the number is released on rollback.
 */
export async function allocateReceiptNumber(
  tx: Prisma.TransactionClient,
  year: number,
  prefix: string,
): Promise<string> {
  const rows = await tx.$queryRaw<{ lastNumber: number }[]>`
    INSERT INTO "ReceiptSequence" ("year", "lastNumber", "updatedAt")
    VALUES (${year}, 1, NOW())
    ON CONFLICT ("year")
    DO UPDATE SET "lastNumber" = "ReceiptSequence"."lastNumber" + 1, "updatedAt" = NOW()
    RETURNING "lastNumber"
  `;
  const next = rows[0]?.lastNumber;
  if (!next) throw new Error("Failed to allocate receipt number");
  return formatReceiptNumber(prefix, year, next);
}

export function formatReceiptNumber(prefix: string, year: number, sequence: number): string {
  return `${prefix}-${year}-${sequence.toString().padStart(SEQUENCE_PADDING, "0")}`;
}
