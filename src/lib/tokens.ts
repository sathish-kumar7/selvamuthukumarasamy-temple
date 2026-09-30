import { randomBytes } from "node:crypto";

/** 32-character URL-safe random token for public receipt links (192 bits of entropy). */
export function generateReceiptToken(): string {
  return randomBytes(24).toString("base64url");
}
