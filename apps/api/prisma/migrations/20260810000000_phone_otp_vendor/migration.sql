-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'DISPATCHED';

-- AlterTable User: add phone auth columns
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "otpHash" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "otpExpiresAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "otpAttempts" INTEGER NOT NULL DEFAULT 0;

-- Backfill phoneNumber for existing rows
UPDATE "User" SET "phoneNumber" = COALESCE("phone", CONCAT('+temp-', "id")) WHERE "phoneNumber" IS NULL;

ALTER TABLE "User" ALTER COLUMN "phoneNumber" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

DROP INDEX IF EXISTS "User_email_key";
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "User_phoneNumber_key" ON "User"("phoneNumber");

ALTER TABLE "User" DROP COLUMN IF EXISTS "phone";
ALTER TABLE "User" DROP COLUMN IF EXISTS "emailVerifyToken";

-- AlterTable Business
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "companyName" TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "whatsappNumber" TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "whatsappVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "vendorPortalEnabled" BOOLEAN NOT NULL DEFAULT true;
UPDATE "Business" SET "companyName" = "name" WHERE "companyName" IS NULL;
ALTER TABLE "Business" ALTER COLUMN "currency" SET DEFAULT 'PKR';

-- AlterTable Order
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryAddress" TEXT;
ALTER TABLE "Order" ALTER COLUMN "currency" SET DEFAULT 'PKR';

ALTER TABLE "Product" ALTER COLUMN "currency" SET DEFAULT 'PKR';

-- CreateTable OrderStatusHistory
CREATE TABLE IF NOT EXISTS "OrderStatusHistory" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "changedBy" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "OrderStatusHistory_orderId_idx" ON "OrderStatusHistory"("orderId");

DO $$ BEGIN
  ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable Vendor
CREATE TABLE IF NOT EXISTS "Vendor" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Vendor_businessId_idx" ON "Vendor"("businessId");

DO $$ BEGIN
  ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable VendorAccess
CREATE TABLE IF NOT EXISTS "VendorAccess" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "secureToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VendorAccess_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "VendorAccess_secureToken_key" ON "VendorAccess"("secureToken");
CREATE INDEX IF NOT EXISTS "VendorAccess_vendorId_idx" ON "VendorAccess"("vendorId");

DO $$ BEGIN
  ALTER TABLE "VendorAccess" ADD CONSTRAINT "VendorAccess_vendorId_fkey"
    FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
