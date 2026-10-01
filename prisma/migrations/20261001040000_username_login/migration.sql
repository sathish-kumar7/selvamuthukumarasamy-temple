-- Switch login identity from email to a short username. Email becomes optional.
-- Existing users get the local part of their email as username (e.g. admin@x.in -> admin).

-- AlterTable
ALTER TABLE "User" ADD COLUMN "username" TEXT;
UPDATE "User" SET "username" = lower(split_part("email", '@', 1));
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
