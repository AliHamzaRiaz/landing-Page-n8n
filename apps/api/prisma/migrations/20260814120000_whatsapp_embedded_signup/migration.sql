-- AlterTable
ALTER TABLE "WhatsAppAccount" ADD COLUMN "tokenExpiresAt" TIMESTAMP(3),
ADD COLUMN "connectedByUserId" TEXT,
ADD COLUMN "embeddedSignupAt" TIMESTAMP(3),
ADD COLUMN "connectionMetadata" JSONB;
