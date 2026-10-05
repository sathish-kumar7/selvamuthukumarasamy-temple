/**
 * Seed script: creates the initial ADMIN user, default donation and expense
 * categories and the temple settings row.
 *
 * The admin password is NEVER hardcoded. Provide it via environment variables:
 *
 *   SEED_ADMIN_USERNAME=admin SEED_ADMIN_PASSWORD='a-strong-password' npm run db:seed
 *
 * Re-running is safe: existing users/categories are left untouched (the admin
 * password is not reset unless SEED_ADMIN_RESET_PASSWORD=true).
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const DEFAULT_EXPENSE_CATEGORIES = [
  "Pooja Items & Flowers",
  "Annadhanam Provisions",
  "Electricity & Water",
  "Salaries & Dakshina",
  "Repairs & Maintenance",
  "Festival Expenses",
  "Office & Printing",
  "Other",
];

const DEFAULT_CATEGORIES = [
  "General Donation",
  "Annadhanam",
  "Festival",
  "Abhishekam",
  "Temple Maintenance",
  "Special Pooja",
  "Other",
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required");

  const username = (process.env.SEED_ADMIN_USERNAME?.trim() || "admin").toLowerCase();
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase() || null;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME?.trim() || "Temple Administrator";

  if (!/^[a-z0-9][a-z0-9._-]{2,29}$/.test(username)) {
    throw new Error("SEED_ADMIN_USERNAME must be 3-30 characters: letters, numbers, dot, underscore or hyphen");
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("SEED_ADMIN_EMAIL must be a valid email address if provided");
  }
  if (!password || password.length < 5) {
    throw new Error("SEED_ADMIN_PASSWORD must be set and at least 5 characters. It is never stored in the repository.");
  }

  // Print the target host (never the credentials) so it is obvious which database is being seeded.
  console.log(`Seeding database at ${new URL(connectionString).host}`);

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const existing = await prisma.user.findUnique({ where: { username } });
    const passwordHash = await bcrypt.hash(password, 12);
    if (!existing) {
      await prisma.user.create({ data: { name, username, email, role: "ADMIN", passwordHash, active: true } });
      console.log(`Created ADMIN user "${username}"`);
    } else if (process.env.SEED_ADMIN_RESET_PASSWORD === "true") {
      await prisma.user.update({ where: { username }, data: { passwordHash, active: true, role: "ADMIN" } });
      console.log(`Reset password for existing user "${username}"`);
    } else {
      console.log(`Admin user "${username}" already exists; skipping (set SEED_ADMIN_RESET_PASSWORD=true to reset the password)`);
    }

    let created = 0;
    for (const [index, categoryName] of DEFAULT_CATEGORIES.entries()) {
      const result = await prisma.donationCategory.upsert({
        where: { name: categoryName },
        update: {},
        create: { name: categoryName, sortOrder: index + 1, active: true },
      });
      if (result.createdAt.getTime() > Date.now() - 5000) created += 1;
    }
    console.log(`Donation categories ready (${created} created, ${DEFAULT_CATEGORIES.length - created} already existed)`);

    let expenseCreated = 0;
    for (const [index, categoryName] of DEFAULT_EXPENSE_CATEGORIES.entries()) {
      const result = await prisma.expenseCategory.upsert({
        where: { name: categoryName },
        update: {},
        create: { name: categoryName, sortOrder: index + 1, active: true },
      });
      if (result.createdAt.getTime() > Date.now() - 5000) expenseCreated += 1;
    }
    console.log(`Expense categories ready (${expenseCreated} created, ${DEFAULT_EXPENSE_CATEGORIES.length - expenseCreated} already existed)`);

    await prisma.templeSettings.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, website: "selvamuthukumarasamy.in" },
    });
    console.log("Temple settings ready");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Seed failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
