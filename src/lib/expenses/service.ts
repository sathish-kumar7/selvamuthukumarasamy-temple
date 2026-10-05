import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { allocateVoucherNumber } from "@/lib/receipt-number";
import { currentIstYear, isoDateToUtcDate, monthStartIsoDate, todayIsoDate } from "@/lib/dates";
import { diffRecords, writeAuditLog } from "@/lib/audit";
import { EXPENSE_VOUCHER_PREFIX, PAGE_SIZE } from "@/lib/constants";
import type { ExpenseFilters, ExpenseInput } from "@/lib/validation/expense";

export const expenseInclude = {
  category: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  updatedBy: { select: { id: true, name: true } },
  cancelledBy: { select: { id: true, name: true } },
} satisfies Prisma.ExpenseInclude;

export type ExpenseWithRelations = Prisma.ExpenseGetPayload<{ include: typeof expenseInclude }>;

interface Actor {
  id: string;
  ip: string | null;
}

export class ExpenseError extends Error {
  constructor(
    message: string,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}

async function assertActiveCategory(tx: Prisma.TransactionClient, categoryId: string) {
  const category = await tx.expenseCategory.findUnique({ where: { id: categoryId } });
  if (!category || !category.active) {
    throw new ExpenseError("Selected expense category is not available", { categoryId: "Select a valid category" });
  }
  return category;
}

export async function createExpense(input: ExpenseInput, actor: Actor) {
  return prisma.$transaction(async (tx) => {
    await assertActiveCategory(tx, input.categoryId);
    const voucherNumber = await allocateVoucherNumber(tx, currentIstYear(), EXPENSE_VOUCHER_PREFIX);

    const expense = await tx.expense.create({
      data: {
        voucherNumber,
        categoryId: input.categoryId,
        paidTo: input.paidTo,
        description: input.description ?? null,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        transactionReference: input.transactionReference ?? null,
        expenseDate: isoDateToUtcDate(input.expenseDate),
        notes: input.notes ?? null,
        createdById: actor.id,
      },
    });

    await writeAuditLog(
      {
        action: "EXPENSE_CREATED",
        entityType: "Expense",
        entityId: expense.id,
        userId: actor.id,
        ipAddress: actor.ip,
        details: { voucherNumber, amount: input.amount, paymentMethod: input.paymentMethod, paidTo: input.paidTo },
      },
      tx,
    );
    return expense;
  });
}

export async function updateExpense(expenseId: string, input: ExpenseInput, actor: Actor) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.expense.findUnique({ where: { id: expenseId } });
    if (!existing) throw new ExpenseError("Expense not found");
    if (existing.status === "CANCELLED") throw new ExpenseError("Cancelled expenses cannot be edited");

    await assertActiveCategory(tx, input.categoryId);

    const before = {
      paidTo: existing.paidTo,
      description: existing.description,
      amount: existing.amount.toString(),
      categoryId: existing.categoryId,
      paymentMethod: existing.paymentMethod,
      transactionReference: existing.transactionReference,
      expenseDate: existing.expenseDate,
      notes: existing.notes,
    };
    const after = {
      paidTo: input.paidTo,
      description: input.description ?? null,
      amount: input.amount,
      categoryId: input.categoryId,
      paymentMethod: input.paymentMethod,
      transactionReference: input.transactionReference ?? null,
      expenseDate: isoDateToUtcDate(input.expenseDate),
      notes: input.notes ?? null,
    };

    const updated = await tx.expense.update({
      where: { id: expenseId },
      data: { ...after, updatedById: actor.id },
    });

    const diff = diffRecords(before, after);
    await writeAuditLog(
      {
        action: "EXPENSE_UPDATED",
        entityType: "Expense",
        entityId: expenseId,
        userId: actor.id,
        ipAddress: actor.ip,
        details: {
          voucherNumber: existing.voucherNumber,
          before: JSON.parse(JSON.stringify(diff.before)),
          after: JSON.parse(JSON.stringify(diff.after)),
        },
      },
      tx,
    );
    return updated;
  });
}

export async function cancelExpense(expenseId: string, reason: string, actor: Actor) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.expense.findUnique({ where: { id: expenseId } });
    if (!existing) throw new ExpenseError("Expense not found");
    if (existing.status === "CANCELLED") throw new ExpenseError("This expense is already cancelled");

    const updated = await tx.expense.update({
      where: { id: expenseId },
      data: { status: "CANCELLED", cancelledAt: new Date(), cancelledById: actor.id, cancellationReason: reason },
    });
    await writeAuditLog(
      {
        action: "EXPENSE_CANCELLED",
        entityType: "Expense",
        entityId: expenseId,
        userId: actor.id,
        ipAddress: actor.ip,
        details: { voucherNumber: existing.voucherNumber, amount: existing.amount.toString(), reason },
      },
      tx,
    );
    return updated;
  });
}

export async function getExpenseById(id: string): Promise<ExpenseWithRelations | null> {
  return prisma.expense.findUnique({ where: { id }, include: expenseInclude });
}

export function buildExpenseWhere(filters: ExpenseFilters): Prisma.ExpenseWhereInput {
  const where: Prisma.ExpenseWhereInput = {};
  const q = filters.q.trim();
  if (q) {
    where.OR = [
      { voucherNumber: { contains: q, mode: "insensitive" } },
      { paidTo: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { transactionReference: { contains: q, mode: "insensitive" } },
    ];
  }
  if (filters.from || filters.to) {
    where.expenseDate = {
      ...(filters.from ? { gte: isoDateToUtcDate(filters.from) } : {}),
      ...(filters.to ? { lte: isoDateToUtcDate(filters.to) } : {}),
    };
  }
  if (filters.paymentMethod) where.paymentMethod = filters.paymentMethod;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.status !== "ALL") where.status = filters.status;
  return where;
}

/**
 * Paginated list plus the total of every ACTIVE expense matching the filters
 * (across all pages), so the table footer shows the real sum, not the page's.
 */
export async function listExpenses(filters: ExpenseFilters) {
  const where = buildExpenseWhere(filters);
  const [total, items, activeAgg] = await Promise.all([
    prisma.expense.count({ where }),
    prisma.expense.findMany({
      where,
      include: expenseInclude,
      orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.expense.aggregate({ where: { ...where, status: "ACTIVE" }, _sum: { amount: true }, _count: { _all: true } }),
  ]);
  return {
    items,
    total,
    page: filters.page,
    pageSize: PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    filteredTotal: activeAgg._sum.amount?.toString() ?? "0.00",
    filteredCount: activeAgg._count._all,
  };
}

export interface ExpenseSummary {
  todayTotal: string;
  todayCount: number;
  monthTotal: string;
  monthCount: number;
  monthDonations: string;
  /** Donations minus expenses for the current month (may be negative). */
  monthNet: string;
  yearTotal: string;
  yearDonations: string;
  yearNet: string;
}

/** Headline figures for the Expenditures page: spend today / this month / this year and the net against donations. */
export async function getExpenseSummary(): Promise<ExpenseSummary> {
  const today = isoDateToUtcDate(todayIsoDate());
  const monthStart = isoDateToUtcDate(monthStartIsoDate());
  const yearStart = new Date(Date.UTC(currentIstYear(), 0, 1));
  const active = { status: "ACTIVE" as const };

  const [todayAgg, monthAgg, yearAgg, monthDonations, yearDonations] = await Promise.all([
    prisma.expense.aggregate({ where: { ...active, expenseDate: today }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.expense.aggregate({ where: { ...active, expenseDate: { gte: monthStart, lte: today } }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.expense.aggregate({ where: { ...active, expenseDate: { gte: yearStart, lte: today } }, _sum: { amount: true } }),
    prisma.donation.aggregate({ where: { ...active, donationDate: { gte: monthStart, lte: today } }, _sum: { amount: true } }),
    prisma.donation.aggregate({ where: { ...active, donationDate: { gte: yearStart, lte: today } }, _sum: { amount: true } }),
  ]);

  const dec = (value: Prisma.Decimal | null | undefined) => new Prisma.Decimal(value ?? 0);
  const monthExpenses = dec(monthAgg._sum.amount);
  const yearExpenses = dec(yearAgg._sum.amount);
  const monthIn = dec(monthDonations._sum.amount);
  const yearIn = dec(yearDonations._sum.amount);

  return {
    todayTotal: dec(todayAgg._sum.amount).toFixed(2),
    todayCount: todayAgg._count._all,
    monthTotal: monthExpenses.toFixed(2),
    monthCount: monthAgg._count._all,
    monthDonations: monthIn.toFixed(2),
    monthNet: monthIn.minus(monthExpenses).toFixed(2),
    yearTotal: yearExpenses.toFixed(2),
    yearDonations: yearIn.toFixed(2),
    yearNet: yearIn.minus(yearExpenses).toFixed(2),
  };
}

export async function getActiveExpenseCategories() {
  return prisma.expenseCategory.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });
}

export async function getAllExpenseCategories() {
  return prisma.expenseCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { expenses: true } } },
  });
}
