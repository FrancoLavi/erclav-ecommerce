-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentExternalId" TEXT,
ADD COLUMN     "paymentPreferenceId" TEXT,
ADD COLUMN     "paymentProvider" TEXT,
ADD COLUMN     "paymentStatusDetail" TEXT;

-- CreateTable
CREATE TABLE "PaymentAttempt" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "preferenceId" TEXT,
    "externalPaymentId" TEXT,
    "status" TEXT NOT NULL,
    "statusDetail" TEXT,
    "initPoint" TEXT,
    "sandboxInitPoint" TEXT,
    "errorMessage" TEXT,
    "rawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentAttempt_orderId_createdAt_idx" ON "PaymentAttempt"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentAttempt_provider_idx" ON "PaymentAttempt"("provider");

-- CreateIndex
CREATE INDEX "PaymentAttempt_preferenceId_idx" ON "PaymentAttempt"("preferenceId");

-- CreateIndex
CREATE INDEX "PaymentAttempt_externalPaymentId_idx" ON "PaymentAttempt"("externalPaymentId");

-- CreateIndex
CREATE INDEX "PaymentAttempt_status_idx" ON "PaymentAttempt"("status");

-- CreateIndex
CREATE INDEX "Order_paymentExternalId_idx" ON "Order"("paymentExternalId");

-- CreateIndex
CREATE INDEX "Order_paymentPreferenceId_idx" ON "Order"("paymentPreferenceId");

-- AddForeignKey
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
