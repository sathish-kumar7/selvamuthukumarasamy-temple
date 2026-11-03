import "server-only";
import { prisma } from "@/lib/db";
import { isoDateToUtcDate, monthStartIsoDate, todayIsoDate, yearStartIsoDate } from "@/lib/dates";
import { donationInclude } from "@/lib/donations/service";
import { expenseInclude } from "@/lib/expenses/service";
import { PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/lib/constants";
import type { PaymentMethod } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { findReportFilter, type ReportFilterKey } from "./filters";

export type ReportType = "donations" | "expenses";

export interface ReportRange {
  type: ReportType;
  preset: "today" | "month" | "year" | "custom";
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  /** Single optional filter chosen from "Filter by" (see REPORT_FILTERS). */
  filter?: { by: ReportFilterKey; value: string };
  /** Rows per page in the Reports table; one of PAGE_SIZE_OPTIONS. */
  pageSize: number;
}

const PAYMENT_METHODS: readonly string[] = ["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "OTHER"] satisfies PaymentMethod[];

export function resolveReportRange(input: {
  type?: string;
  preset?: string;
  from?: string;
  to?: string;
  by?: string;
  value?: string;
  size?: number | string;
}): ReportRange {
  const today = todayIsoDate();
  const type: ReportType = input.type === "expenses" ? "expenses" : "donations";
  const option = findReportFilter(type, input.by);
  const value = input.value?.trim();
  const valid = option && value && (option.kind !== "payment" || PAYMENT_METHODS.includes(value));
  const size = Number(input.size);
  const pageSize = (PAGE_SIZE_OPTIONS as readonly number[]).includes(size) ? size : PAGE_SIZE;
  const filter = { pageSize, ...(valid ? { filter: { by: option.key, value } } : {}) };
  if (input.preset === "month") return { type, preset: "month", from: monthStartIsoDate(), to: today, ...filter };
  if (input.preset === "year") return { type, preset: "year", from: yearStartIsoDate(), to: today, ...filter };
  if (input.preset === "custom" && input.from && input.to) return { type, preset: "custom", from: input.from, to: input.to, ...filter };
  return { type, preset: "today", from: today, to: today, ...filter };
}

const contains = (value: string) => ({ contains: value, mode: "insensitive" as const });

function donationFilter(filter: ReportRange["filter"]): Prisma.DonationWhereInput {
  if (!filter) return {};
  const { by, value } = filter;
  if (by === "category") return { categoryId: value };
  if (by === "payment") return { paymentMethod: value as PaymentMethod };
  if (by === "donor") return { donor: { name: contains(value) } };
  if (by === "receipt") return { receiptNumber: contains(value) };
  if (by === "manual") return { manualReceiptNumber: contains(value) };
  return {};
}

function expenseFilter(filter: ReportRange["filter"]): Prisma.ExpenseWhereInput {
  if (!filter) return {};
  const { by, value } = filter;
  if (by === "category") return { categoryId: value };
  if (by === "payment") return { paymentMethod: value as PaymentMethod };
  if (by === "paidTo") return { paidTo: contains(value) };
  if (by === "voucher") return { voucherNumber: contains(value) };
  return {};
}

function donationWhere(range: ReportRange) {
  return {
    status: "ACTIVE" as const,
    donationDate: { gte: isoDateToUtcDate(range.from), lte: isoDateToUtcDate(range.to) },
    ...donationFilter(range.filter),
  };
}

function expenseWhere(range: ReportRange) {
  return {
    status: "ACTIVE" as const,
    expenseDate: { gte: isoDateToUtcDate(range.from), lte: isoDateToUtcDate(range.to) },
    ...expenseFilter(range.filter),
  };
}

const EMPTY_METHODS = (): ReportSummary["byMethod"] => ({
  CASH: { total: "0.00", count: 0 },
  UPI: { total: "0.00", count: 0 },
  BANK_TRANSFER: { total: "0.00", count: 0 },
  CHEQUE: { total: "0.00", count: 0 },
  OTHER: { total: "0.00", count: 0 },
});

export interface ReportSummary {
  total: string;
  count: number;
  byMethod: Record<PaymentMethod, { total: string; count: number }>;
  byCategory: { categoryId: string; name: string; total: string; count: number }[];
}

export async function getReportSummary(range: ReportRange): Promise<ReportSummary> {
  const where = donationWhere(range);
  const [agg, byMethod, byCategory, categories] = await Promise.all([
    prisma.donation.aggregate({ where, _sum: { amount: true }, _count: { _all: true } }),
    prisma.donation.groupBy({ by: ["paymentMethod"], where, _sum: { amount: true }, _count: { _all: true } }),
    prisma.donation.groupBy({ by: ["categoryId"], where, _sum: { amount: true }, _count: { _all: true } }),
    prisma.donationCategory.findMany({ select: { id: true, name: true } }),
  ]);

  const methods = EMPTY_METHODS();
  for (const row of byMethod) {
    methods[row.paymentMethod] = { total: row._sum.amount?.toString() ?? "0.00", count: row._count._all };
  }
  const categoryNames = new Map(categories.map((c) => [c.id, c.name]));

  return {
    total: agg._sum.amount?.toString() ?? "0.00",
    count: agg._count._all,
    byMethod: methods,
    byCategory: byCategory
      .map((row) => ({
        categoryId: row.categoryId,
        name: categoryNames.get(row.categoryId) ?? "Unknown",
        total: row._sum.amount?.toString() ?? "0.00",
        count: row._count._all,
      }))
      .sort((a, b) => Number(b.total) - Number(a.total)),
  };
}

/** Same shape as getReportSummary, for money paid out. Categories are expense categories. */
export async function getExpenseReportSummary(range: ReportRange): Promise<ReportSummary> {
  const where = expenseWhere(range);
  const [agg, byMethod, byCategory, categories] = await Promise.all([
    prisma.expense.aggregate({ where, _sum: { amount: true }, _count: { _all: true } }),
    prisma.expense.groupBy({ by: ["paymentMethod"], where, _sum: { amount: true }, _count: { _all: true } }),
    prisma.expense.groupBy({ by: ["categoryId"], where, _sum: { amount: true }, _count: { _all: true } }),
    prisma.expenseCategory.findMany({ select: { id: true, name: true } }),
  ]);

  const methods = EMPTY_METHODS();
  for (const row of byMethod) {
    methods[row.paymentMethod] = { total: row._sum.amount?.toString() ?? "0.00", count: row._count._all };
  }
  const categoryNames = new Map(categories.map((c) => [c.id, c.name]));

  return {
    total: agg._sum.amount?.toString() ?? "0.00",
    count: agg._count._all,
    byMethod: methods,
    byCategory: byCategory
      .map((row) => ({
        categoryId: row.categoryId,
        name: categoryNames.get(row.categoryId) ?? "Unknown",
        total: row._sum.amount?.toString() ?? "0.00",
        count: row._count._all,
      }))
      .sort((a, b) => Number(b.total) - Number(a.total)),
  };
}

/** One page of ACTIVE expenses for the range, oldest first, for the Reports table. */
export async function listReportExpenses(range: ReportRange, page: number) {
  const where = expenseWhere(range);
  const [total, items] = await Promise.all([
    prisma.expense.count({ where }),
    prisma.expense.findMany({
      where,
      include: expenseInclude,
      orderBy: [{ expenseDate: "asc" }, { voucherNumber: "asc" }],
      skip: (page - 1) * range.pageSize,
      take: range.pageSize,
    }),
  ]);
  return { items, total, page, pageSize: range.pageSize, pageCount: Math.max(1, Math.ceil(total / range.pageSize)) };
}

/** Full expense list for the range (for export), optionally including cancelled rows. */
export async function getReportExpenses(range: ReportRange, options?: { includeCancelled?: boolean }) {
  return prisma.expense.findMany({
    where: { ...expenseWhere(range), ...(options?.includeCancelled ? { status: undefined } : {}) },
    include: expenseInclude,
    orderBy: [{ expenseDate: "asc" }, { voucherNumber: "asc" }],
  });
}

/** One page of ACTIVE transactions for the range, oldest first, for the Reports table. */
export async function listReportTransactions(range: ReportRange, page: number) {
  const where = donationWhere(range);
  const [total, items] = await Promise.all([
    prisma.donation.count({ where }),
    prisma.donation.findMany({
      where,
      include: donationInclude,
      orderBy: [{ donationDate: "asc" }, { receiptNumber: "asc" }],
      skip: (page - 1) * range.pageSize,
      take: range.pageSize,
    }),
  ]);
  return { items, total, page, pageSize: range.pageSize, pageCount: Math.max(1, Math.ceil(total / range.pageSize)) };
}

/** Full transaction list for the range, including cancelled rows flagged by status. */
export async function getReportTransactions(range: ReportRange, options?: { includeCancelled?: boolean; limit?: number }) {
  return prisma.donation.findMany({
    where: { ...donationWhere(range), ...(options?.includeCancelled ? { status: undefined } : {}) },
    include: donationInclude,
    orderBy: [{ donationDate: "asc" }, { receiptNumber: "asc" }],
    take: options?.limit,
  });
}
