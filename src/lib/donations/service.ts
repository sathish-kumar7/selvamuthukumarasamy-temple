import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { allocateReceiptNumber } from "@/lib/receipt-number";
import { generateReceiptToken } from "@/lib/tokens";
import { currentIstYear, isoDateToUtcDate } from "@/lib/dates";
import { diffRecords, writeAuditLog } from "@/lib/audit";
import { PAGE_SIZE } from "@/lib/constants";
import type { DonationFilters, DonationInput } from "@/lib/validation/donation";
import { getTempleSettings } from "@/lib/settings";

export const donationInclude = {
  donor: true,
  category: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  updatedBy: { select: { id: true, name: true } },
  cancelledBy: { select: { id: true, name: true } },
} satisfies Prisma.DonationInclude;

export type DonationWithRelations = Prisma.DonationGetPayload<{ include: typeof donationInclude }>;

interface Actor {
  id: string;
  ip: string | null;
}

/**
 * Finds a donor with the same mobile and (case-insensitive) name, otherwise
 * creates one. Family members often share a phone, so mobile alone is not
 * treated as the identity.
 */
async function findOrCreateDonor(tx: Prisma.TransactionClient, input: DonationInput) {
  const existing = await tx.donor.findFirst({
    where: { mobile: input.donorMobile, name: { equals: input.donorName, mode: "insensitive" } },
    orderBy: { createdAt: "asc" },
  });
  if (existing) {
    const needsUpdate =
      (input.donorEmail && input.donorEmail !== existing.email) ||
      (input.donorAddress && input.donorAddress !== existing.address);
    if (needsUpdate) {
      return tx.donor.update({
        where: { id: existing.id },
        data: {
          email: input.donorEmail ?? existing.email,
          address: input.donorAddress ?? existing.address,
        },
      });
    }
    return existing;
  }
  return tx.donor.create({
    data: {
      name: input.donorName,
      mobile: input.donorMobile,
      email: input.donorEmail ?? null,
      address: input.donorAddress ?? null,
    },
  });
}

async function assertActiveCategory(tx: Prisma.TransactionClient, categoryId: string) {
  const category = await tx.donationCategory.findUnique({ where: { id: categoryId } });
  if (!category || !category.active) {
    throw new DonationError("Selected donation purpose is not available", { categoryId: "Select a valid purpose" });
  }
  return category;
}

export class DonationError extends Error {
  constructor(
    message: string,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}

export async function createDonation(input: DonationInput, actor: Actor) {
  const settings = await getTempleSettings();
  return prisma.$transaction(async (tx) => {
    await assertActiveCategory(tx, input.categoryId);
    const donor = await findOrCreateDonor(tx, input);
    const receiptNumber = await allocateReceiptNumber(tx, currentIstYear(), settings.receiptPrefix);

    const donation = await tx.donation.create({
      data: {
        receiptNumber,
        donorId: donor.id,
        amount: input.amount,
        categoryId: input.categoryId,
        paymentMethod: input.paymentMethod,
        transactionReference: input.transactionReference ?? null,
        donationDate: isoDateToUtcDate(input.donationDate),
        notes: input.notes ?? null,
        publicReceiptToken: generateReceiptToken(),
        createdById: actor.id,
      },
    });

    await writeAuditLog(
      {
        action: "DONATION_CREATED",
        entityType: "Donation",
        entityId: donation.id,
        userId: actor.id,
        ipAddress: actor.ip,
        details: {
          receiptNumber,
          amount: input.amount,
          paymentMethod: input.paymentMethod,
          donorName: input.donorName,
          donorMobile: input.donorMobile,
        },
      },
      tx,
    );
    return donation;
  });
}

export async function updateDonation(donationId: string, input: DonationInput, actor: Actor) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.donation.findUnique({ where: { id: donationId }, include: { donor: true } });
    if (!existing) throw new DonationError("Donation not found");
    if (existing.status === "CANCELLED") throw new DonationError("Cancelled donations cannot be edited");

    await assertActiveCategory(tx, input.categoryId);

    // Update the donor record in place; donor identity changes stay attached to this donation.
    const donorBefore = {
      donorName: existing.donor.name,
      donorMobile: existing.donor.mobile,
      donorEmail: existing.donor.email,
      donorAddress: existing.donor.address,
    };
    const donorAfter = {
      donorName: input.donorName,
      donorMobile: input.donorMobile,
      donorEmail: input.donorEmail ?? null,
      donorAddress: input.donorAddress ?? null,
    };

    let donorId = existing.donorId;
    const donorChanged = JSON.stringify(donorBefore) !== JSON.stringify(donorAfter);
    if (donorChanged) {
      const otherDonations = await tx.donation.count({ where: { donorId: existing.donorId, id: { not: donationId } } });
      if (otherDonations === 0) {
        await tx.donor.update({
          where: { id: existing.donorId },
          data: { name: input.donorName, mobile: input.donorMobile, email: donorAfter.donorEmail, address: donorAfter.donorAddress },
        });
      } else {
        // Donor is shared with other receipts; attach this donation to a matching/new donor instead.
        const donor = await findOrCreateDonor(tx, input);
        donorId = donor.id;
      }
    }

    const before = {
      ...donorBefore,
      amount: existing.amount.toString(),
      categoryId: existing.categoryId,
      paymentMethod: existing.paymentMethod,
      transactionReference: existing.transactionReference,
      donationDate: existing.donationDate,
      notes: existing.notes,
    };
    const after = {
      ...donorAfter,
      amount: input.amount,
      categoryId: input.categoryId,
      paymentMethod: input.paymentMethod,
      transactionReference: input.transactionReference ?? null,
      donationDate: isoDateToUtcDate(input.donationDate),
      notes: input.notes ?? null,
    };

    const updated = await tx.donation.update({
      where: { id: donationId },
      data: {
        donorId,
        amount: after.amount,
        categoryId: after.categoryId,
        paymentMethod: after.paymentMethod,
        transactionReference: after.transactionReference,
        donationDate: after.donationDate,
        notes: after.notes,
        updatedById: actor.id,
      },
    });

    const diff = diffRecords(before, after);
    await writeAuditLog(
      {
        action: "DONATION_UPDATED",
        entityType: "Donation",
        entityId: donationId,
        userId: actor.id,
        ipAddress: actor.ip,
        details: {
          receiptNumber: existing.receiptNumber,
          before: JSON.parse(JSON.stringify(diff.before)),
          after: JSON.parse(JSON.stringify(diff.after)),
        },
      },
      tx,
    );
    return updated;
  });
}

export async function cancelDonation(donationId: string, reason: string, actor: Actor) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.donation.findUnique({ where: { id: donationId } });
    if (!existing) throw new DonationError("Donation not found");
    if (existing.status === "CANCELLED") throw new DonationError("This donation is already cancelled");

    const updated = await tx.donation.update({
      where: { id: donationId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelledById: actor.id,
        cancellationReason: reason,
      },
    });
    await writeAuditLog(
      {
        action: "DONATION_CANCELLED",
        entityType: "Donation",
        entityId: donationId,
        userId: actor.id,
        ipAddress: actor.ip,
        details: { receiptNumber: existing.receiptNumber, amount: existing.amount.toString(), reason },
      },
      tx,
    );
    return updated;
  });
}

export async function getDonationById(id: string): Promise<DonationWithRelations | null> {
  return prisma.donation.findUnique({ where: { id }, include: donationInclude });
}

export async function getDonationByToken(token: string): Promise<DonationWithRelations | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  return prisma.donation.findUnique({ where: { publicReceiptToken: token }, include: donationInclude });
}

export function buildDonationWhere(filters: DonationFilters): Prisma.DonationWhereInput {
  const where: Prisma.DonationWhereInput = {};
  const q = filters.q.trim();
  if (q) {
    const digits = q.replace(/\D/g, "");
    where.OR = [
      { receiptNumber: { contains: q, mode: "insensitive" } },
      { donor: { name: { contains: q, mode: "insensitive" } } },
      ...(digits.length >= 4 ? [{ donor: { mobile: { contains: digits } } }] : []),
    ];
  }
  if (filters.from || filters.to) {
    where.donationDate = {
      ...(filters.from ? { gte: isoDateToUtcDate(filters.from) } : {}),
      ...(filters.to ? { lte: isoDateToUtcDate(filters.to) } : {}),
    };
  }
  if (filters.paymentMethod) where.paymentMethod = filters.paymentMethod;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.status !== "ALL") where.status = filters.status;
  return where;
}

export async function listDonations(filters: DonationFilters) {
  const where = buildDonationWhere(filters);
  const [total, items] = await Promise.all([
    prisma.donation.count({ where }),
    prisma.donation.findMany({
      where,
      include: donationInclude,
      orderBy: [{ donationDate: "desc" }, { createdAt: "desc" }],
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  return { items, total, page: filters.page, pageSize: PAGE_SIZE, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getActiveCategories() {
  return prisma.donationCategory.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });
}

export async function getAllCategories() {
  return prisma.donationCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { donations: true } } },
  });
}
