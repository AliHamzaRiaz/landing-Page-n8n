-- Marketing campaigns, encrypted social accounts, media metadata, publishing jobs.
-- Does not alter WhatsAppAccount, orders, or existing webhook tables.

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'CAMPAIGN_PUBLISHED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'POST_FAILED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SOCIAL_EXPIRED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MEDIA_FAILED';

CREATE TYPE "SocialPlatform" AS ENUM ('FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'LINKEDIN');
CREATE TYPE "SocialConnectionStatus" AS ENUM ('DISCONNECTED', 'CONNECTED', 'EXPIRED', 'ERROR');
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SCHEDULED', 'COMPLETED', 'ARCHIVED');
CREATE TYPE "CampaignPostingType" AS ENUM ('NOW', 'SCHEDULE', 'DRAFT');
CREATE TYPE "MediaUploadStatus" AS ENUM ('UPLOADING', 'READY', 'FAILED');
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'PENDING', 'PROCESSING', 'SCHEDULED', 'PUBLISHED', 'FAILED');
CREATE TYPE "PublishingJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'RETRYING');

CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "postingType" "CampaignPostingType" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "platforms" "SocialPlatform"[],
    "aiContent" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CampaignMedia" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "campaignId" TEXT,
    "uploadedByUserId" TEXT,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "publicUrl" TEXT,
    "thumbnailKey" TEXT,
    "durationSeconds" DOUBLE PRECISION,
    "status" "MediaUploadStatus" NOT NULL DEFAULT 'READY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignMedia_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SocialAccount" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "accountId" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accessTokenEncrypted" TEXT NOT NULL,
    "refreshTokenEncrypted" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "scopes" TEXT,
    "metadata" JSONB,
    "status" "SocialConnectionStatus" NOT NULL DEFAULT 'CONNECTED',
    "lastError" TEXT,
    "lastTestedAt" TIMESTAMP(3),
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CampaignPost" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "socialAccountId" TEXT,
    "mediaId" TEXT,
    "platform" "SocialPlatform" NOT NULL,
    "caption" TEXT NOT NULL DEFAULT '',
    "hashtags" TEXT NOT NULL DEFAULT '',
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
    "externalPostId" TEXT,
    "errorMessage" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignPost_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PublishingJob" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "status" "PublishingJobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "nextRunAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublishingJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SocialAccount_businessId_platform_accountId_key" ON "SocialAccount"("businessId", "platform", "accountId");
CREATE UNIQUE INDEX "CampaignPost_idempotencyKey_key" ON "CampaignPost"("idempotencyKey");
CREATE INDEX "Campaign_businessId_idx" ON "Campaign"("businessId");
CREATE INDEX "Campaign_businessId_status_idx" ON "Campaign"("businessId", "status");
CREATE INDEX "CampaignMedia_businessId_idx" ON "CampaignMedia"("businessId");
CREATE INDEX "CampaignMedia_campaignId_idx" ON "CampaignMedia"("campaignId");
CREATE INDEX "SocialAccount_businessId_idx" ON "SocialAccount"("businessId");
CREATE INDEX "CampaignPost_businessId_idx" ON "CampaignPost"("businessId");
CREATE INDEX "CampaignPost_campaignId_idx" ON "CampaignPost"("campaignId");
CREATE INDEX "CampaignPost_status_idx" ON "CampaignPost"("status");
CREATE INDEX "PublishingJob_status_nextRunAt_idx" ON "PublishingJob"("status", "nextRunAt");
CREATE INDEX "PublishingJob_postId_idx" ON "PublishingJob"("postId");

ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CampaignMedia" ADD CONSTRAINT "CampaignMedia_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampaignMedia" ADD CONSTRAINT "CampaignMedia_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CampaignMedia" ADD CONSTRAINT "CampaignMedia_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampaignPost" ADD CONSTRAINT "CampaignPost_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampaignPost" ADD CONSTRAINT "CampaignPost_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampaignPost" ADD CONSTRAINT "CampaignPost_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "SocialAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CampaignPost" ADD CONSTRAINT "CampaignPost_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "CampaignMedia"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PublishingJob" ADD CONSTRAINT "PublishingJob_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CampaignPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
