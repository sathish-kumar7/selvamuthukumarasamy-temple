/**
 * Dev utility: allocates receipt numbers concurrently for a throwaway year and
 * verifies that no duplicates are produced. Cleans up after itself.
 *
 *   npx tsx scripts/check-receipt-sequence.ts
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { allocateReceiptNumber } from "../src/lib/receipt-number";

const TEST_YEAR = 2099;
const CONCURRENCY = 40;

async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL!, max: 20 }) });
  try {
    const results = await Promise.all(
      Array.from({ length: CONCURRENCY }, () => prisma.$transaction((tx) => allocateReceiptNumber(tx, TEST_YEAR, "TST"))),
    );
    const unique = new Set(results);
    const sorted = [...unique].sort();
    console.log(`Allocated ${results.length} numbers, ${unique.size} unique. First: ${sorted[0]}  Last: ${sorted.at(-1)}`);
    if (unique.size !== results.length) {
      console.error("DUPLICATE RECEIPT NUMBERS DETECTED");
      process.exitCode = 1;
    }
  } finally {
    await prisma.receiptSequence.deleteMany({ where: { year: TEST_YEAR } });
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
