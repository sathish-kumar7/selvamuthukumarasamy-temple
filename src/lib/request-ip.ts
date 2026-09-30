import { headers } from "next/headers";

/** Best-effort client IP for audit logging (Vercel sets x-forwarded-for). */
export async function getRequestIp(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim().slice(0, 64);
  return h.get("x-real-ip")?.slice(0, 64) ?? null;
}
