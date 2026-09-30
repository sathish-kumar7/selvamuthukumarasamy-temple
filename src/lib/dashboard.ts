import "server-only";
import { prisma } from "@/lib/db";
import { isoDateToUtcDate, monthStartIsoDate, todayIsoDate } from "@/lib/dates";
import { donationInclude } from "@/lib/donations/service";
import type { PaymentMethod } from "@/generated/prisma/enums";

export interface DashboardStats {
  todayTotal: string;
  todayCount: number;
  monthTotal: string;
  monthCount: number;
  todayByMethod: Record<PaymentMethod, string>;
}

const EMPTY_METHODS: Record<PaymentMethod, string> = {
  CASH: "0.00",
  UPI: "0.00",
  BANK_TRANSFER: "0.00",
  CHEQUE: "0.00",
  OTHER: "0.00",
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const today = isoDateToUtcDate(todayIsoDate());
  const monthStart = isoDateToUtcDate(monthStartIsoDate());

  const [todayAgg, monthAgg, byMethod] = await Promise.all([
    prisma.donation.aggregate({
      where: { status: "ACTIVE", donationDate: today },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.donation.aggregate({
      where: { status: "ACTIVE", donationDate: { gte: monthStart, lte: today } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.donation.groupBy({
      by: ["paymentMethod"],
      where: { status: "ACTIVE", donationDate: today },
      _sum: { amount: true },
    }),
  ]);

  const todayByMethod = { ...EMPTY_METHODS };
  for (const row of byMethod) {
    todayByMethod[row.paymentMethod] = row._sum.amount?.toString() ?? "0.00";
  }

  return {
    todayTotal: todayAgg._sum.amount?.toString() ?? "0.00",
    todayCount: todayAgg._count._all,
    monthTotal: monthAgg._sum.amount?.toString() ?? "0.00",
    monthCount: monthAgg._count._all,
    todayByMethod,
  };
}

export async function getRecentDonations(limit = 8) {
  return prisma.donation.findMany({
    include: donationInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
