import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { currentIstYear, isoDateToUtcDate, monthStartIsoDate, todayIsoDate } from "@/lib/dates";
import { donationInclude } from "@/lib/donations/service";

export interface DashboardStats {
  todayTotal: string;
  todayCount: number;
  monthDonations: string;
  monthCount: number;
  yearDonations: string;
  yearCount: number;
  /** Active expenses this month / this calendar year (see Expenditures). */
  monthExpenses: string;
  yearExpenses: string;
  /** Donations minus expenses; may be negative. */
  monthNet: string;
  yearNet: string;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const today = isoDateToUtcDate(todayIsoDate());
  const monthStart = isoDateToUtcDate(monthStartIsoDate());
  const yearStart = new Date(Date.UTC(currentIstYear(), 0, 1));
  const active = { status: "ACTIVE" as const };

  const [todayAgg, monthAgg, yearAgg, monthExpensesAgg, yearExpensesAgg] = await Promise.all([
    prisma.donation.aggregate({ where: { ...active, donationDate: today }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.donation.aggregate({ where: { ...active, donationDate: { gte: monthStart, lte: today } }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.donation.aggregate({ where: { ...active, donationDate: { gte: yearStart, lte: today } }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.expense.aggregate({ where: { ...active, expenseDate: { gte: monthStart, lte: today } }, _sum: { amount: true } }),
    prisma.expense.aggregate({ where: { ...active, expenseDate: { gte: yearStart, lte: today } }, _sum: { amount: true } }),
  ]);

  const dec = (value: Prisma.Decimal | null | undefined) => new Prisma.Decimal(value ?? 0);
  const monthDonations = dec(monthAgg._sum.amount);
  const yearDonations = dec(yearAgg._sum.amount);
  const monthExpenses = dec(monthExpensesAgg._sum.amount);
  const yearExpenses = dec(yearExpensesAgg._sum.amount);

  return {
    todayTotal: dec(todayAgg._sum.amount).toFixed(2),
    todayCount: todayAgg._count._all,
    monthDonations: monthDonations.toFixed(2),
    monthCount: monthAgg._count._all,
    yearDonations: yearDonations.toFixed(2),
    yearCount: yearAgg._count._all,
    monthExpenses: monthExpenses.toFixed(2),
    yearExpenses: yearExpenses.toFixed(2),
    monthNet: monthDonations.minus(monthExpenses).toFixed(2),
    yearNet: yearDonations.minus(yearExpenses).toFixed(2),
  };
}

export async function getRecentDonations(limit = 8) {
  return prisma.donation.findMany({
    include: donationInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
