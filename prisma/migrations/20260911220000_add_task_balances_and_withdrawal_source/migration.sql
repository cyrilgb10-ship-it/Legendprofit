-- CreateEnum
CREATE TYPE "WithdrawalSource" AS ENUM ('REFERRAL', 'TASK');

-- AlterTable
ALTER TABLE "Withdrawal"
ADD COLUMN "source" "WithdrawalSource",
ADD COLUMN "taskId" TEXT;

-- Donner REFERRAL aux anciens retraits
UPDATE "Withdrawal"
SET "source" = 'REFERRAL'
WHERE "source" IS NULL;

-- Rendre la colonne obligatoire
ALTER TABLE "Withdrawal"
ALTER COLUMN "source" SET NOT NULL;

-- CreateTable
CREATE TABLE "TaskBalance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskBalance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskBalance_userId_idx" ON "TaskBalance"("userId");

CREATE INDEX "TaskBalance_taskId_idx" ON "TaskBalance"("taskId");

CREATE UNIQUE INDEX "TaskBalance_userId_taskId_key"
ON "TaskBalance"("userId", "taskId");

CREATE INDEX "Withdrawal_source_idx"
ON "Withdrawal"("source");

CREATE INDEX "Withdrawal_taskId_idx"
ON "Withdrawal"("taskId");

-- AddForeignKey
ALTER TABLE "TaskBalance"
ADD CONSTRAINT "TaskBalance_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TaskBalance"
ADD CONSTRAINT "TaskBalance_taskId_fkey"
FOREIGN KEY ("taskId") REFERENCES "Task"("id")
ON DELETE CASCADE ON UPDATE CASCADE;