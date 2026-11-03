-- AlterTable
ALTER TABLE "Donation" ADD COLUMN     "manualReceiptNumber" TEXT;

-- CreateIndex
CREATE INDEX "Donation_manualReceiptNumber_idx" ON "Donation"("manualReceiptNumber");
