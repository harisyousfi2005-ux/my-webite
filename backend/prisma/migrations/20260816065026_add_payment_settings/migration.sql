-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('DEMO', 'LIVE');

-- CreateTable
CREATE TABLE "payment_settings" (
    "id" TEXT NOT NULL,
    "mode" "PaymentMode" NOT NULL DEFAULT 'DEMO',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByAdminId" TEXT,

    CONSTRAINT "payment_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_provider_configs" (
    "id" TEXT NOT NULL,
    "provider" "PaymentMethod" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "publicConfig" JSONB,
    "secretConfig" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByAdminId" TEXT,

    CONSTRAINT "payment_provider_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_provider_configs_provider_key" ON "payment_provider_configs"("provider");
