-- AlterTable Business
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "metaPhoneNumberId" TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "wabaId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Business_metaPhoneNumberId_key" ON "Business"("metaPhoneNumberId");

-- VendorAccess hashed token columns
ALTER TABLE "VendorAccess" ADD COLUMN IF NOT EXISTS "tokenHash" TEXT;
ALTER TABLE "VendorAccess" ADD COLUMN IF NOT EXISTS "tokenEncrypted" TEXT;

-- Temporary backfill: copy secureToken into both columns (app will re-hash on next generate)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'VendorAccess' AND column_name = 'secureToken'
  ) THEN
    UPDATE "VendorAccess"
    SET
      "tokenHash" = COALESCE("tokenHash", "secureToken"),
      "tokenEncrypted" = COALESCE("tokenEncrypted", "secureToken")
    WHERE "tokenHash" IS NULL OR "tokenEncrypted" IS NULL;
  END IF;
END $$;

UPDATE "VendorAccess"
SET
  "tokenHash" = COALESCE("tokenHash", id),
  "tokenEncrypted" = COALESCE("tokenEncrypted", id)
WHERE "tokenHash" IS NULL OR "tokenEncrypted" IS NULL;

ALTER TABLE "VendorAccess" ALTER COLUMN "tokenHash" SET NOT NULL;
ALTER TABLE "VendorAccess" ALTER COLUMN "tokenEncrypted" SET NOT NULL;

DROP INDEX IF EXISTS "VendorAccess_secureToken_key";
CREATE UNIQUE INDEX IF NOT EXISTS "VendorAccess_tokenHash_key" ON "VendorAccess"("tokenHash");

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'VendorAccess' AND column_name = 'secureToken'
  ) THEN
    ALTER TABLE "VendorAccess" DROP COLUMN "secureToken";
  END IF;
END $$;
