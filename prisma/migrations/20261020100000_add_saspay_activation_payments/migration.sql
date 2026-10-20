-- CreateEnum
CREATE TYPE "ActivationPaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'EXPIRED');

-- AlterTable
ALTER TABLE "Activation" ALTER COLUMN "amount" SET DEFAULT 3500;

-- CreateTable
CREATE TABLE "ActivationPayment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activationId" TEXT NOT NULL,
    "providerPaymentId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 3500,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "network" TEXT NOT NULL,
    "status" "ActivationPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "checkoutUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivationPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ActivationPayment_providerPaymentId_key"
ON "ActivationPayment"("providerPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivationPayment_idempotencyKey_key"
ON "ActivationPayment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ActivationPayment_userId_idx"
ON "ActivationPayment"("userId");

-- CreateIndex
CREATE INDEX "ActivationPayment_activationId_idx"
ON "ActivationPayment"("activationId");

-- CreateIndex
CREATE INDEX "ActivationPayment_status_idx"
ON "ActivationPayment"("status");

-- AddForeignKey
ALTER TABLE "ActivationPayment"
ADD CONSTRAINT "ActivationPayment_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivationPayment"
ADD CONSTRAINT "ActivationPayment_activationId_fkey"
FOREIGN KEY ("activationId") REFERENCES "Activation"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
