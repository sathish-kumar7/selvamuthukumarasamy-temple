import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Used by the Prisma CLI only (migrate, studio); the app connects via DATABASE_URL in src/lib/db.ts.
    // Migrations take a Postgres advisory lock, which does not work through Neon's PgBouncer pooler
    // (P1002 lock timeouts), so prefer the DIRECT (non-pooled) connection string when provided.
    // Both values come from the environment only. Never commit them.
    url: process.env["DIRECT_DATABASE_URL"] ?? process.env["DATABASE_URL"],
  },
});
