import { cache } from "react";
import { prisma } from "@/lib/db";

/** Loads the singleton temple settings row, creating it with defaults if missing. */
export const getTempleSettings = cache(async () => {
  const existing = await prisma.templeSettings.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  return prisma.templeSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
});

export type TempleSettings = Awaited<ReturnType<typeof getTempleSettings>>;
