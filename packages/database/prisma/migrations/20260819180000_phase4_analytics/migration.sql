-- Phase 4: synchronized media, historical insights, and BullMQ sync runs
CREATE TYPE "SyncKind" AS ENUM ('ACCOUNT', 'MEDIA', 'INSIGHTS');
CREATE TYPE "SyncStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

ALTER TABLE "InstagramAccount" ADD COLUMN "followers" INTEGER;
ALTER TABLE "InstagramAccount" ADD COLUMN "following" INTEGER;
ALTER TABLE "InstagramAccount" ADD COLUMN "mediaCount" INTEGER;
ALTER TABLE "InstagramAccount" ADD COLUMN "dataIsMock" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "InstagramMedia" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "instagramAccountId" TEXT NOT NULL,
    "instagramMediaId" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "mediaFormat" TEXT NOT NULL,
    "caption" TEXT,
    "permalink" TEXT,
    "mediaUrl" TEXT,
    "thumbnailUrl" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL,
    "likeCount" INTEGER,
    "commentCount" INTEGER,
    "isMock" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InstagramMedia_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InstagramInsight" (
    "id" TEXT NOT NULL,
    "metricKey" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "instagramAccountId" TEXT NOT NULL,
    "instagramMediaId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "metricType" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "isMock" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InstagramInsight_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SyncRun" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "instagramAccountId" TEXT,
    "jobId" TEXT,
    "kind" "SyncKind" NOT NULL,
    "status" "SyncStatus" NOT NULL DEFAULT 'QUEUED',
    "provider" TEXT NOT NULL,
    "isMock" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "recordsProcessed" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SyncRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InstagramMedia_instagramMediaId_key" ON "InstagramMedia"("instagramMediaId");
CREATE UNIQUE INDEX "InstagramMedia_instagramAccountId_instagramMediaId_key" ON "InstagramMedia"("instagramAccountId", "instagramMediaId");
CREATE INDEX "InstagramMedia_organizationId_publishedAt_idx" ON "InstagramMedia"("organizationId", "publishedAt");
CREATE INDEX "InstagramMedia_instagramAccountId_publishedAt_idx" ON "InstagramMedia"("instagramAccountId", "publishedAt");
CREATE UNIQUE INDEX "InstagramInsight_metricKey_key" ON "InstagramInsight"("metricKey");
CREATE INDEX "InstagramInsight_organizationId_date_metricType_idx" ON "InstagramInsight"("organizationId", "date", "metricType");
CREATE INDEX "InstagramInsight_instagramAccountId_date_metricType_idx" ON "InstagramInsight"("instagramAccountId", "date", "metricType");
CREATE INDEX "InstagramInsight_instagramMediaId_metricType_idx" ON "InstagramInsight"("instagramMediaId", "metricType");
CREATE INDEX "SyncRun_organizationId_createdAt_idx" ON "SyncRun"("organizationId", "createdAt");
CREATE INDEX "SyncRun_instagramAccountId_kind_createdAt_idx" ON "SyncRun"("instagramAccountId", "kind", "createdAt");

ALTER TABLE "InstagramMedia" ADD CONSTRAINT "InstagramMedia_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InstagramMedia" ADD CONSTRAINT "InstagramMedia_instagramAccountId_fkey" FOREIGN KEY ("instagramAccountId") REFERENCES "InstagramAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InstagramInsight" ADD CONSTRAINT "InstagramInsight_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InstagramInsight" ADD CONSTRAINT "InstagramInsight_instagramAccountId_fkey" FOREIGN KEY ("instagramAccountId") REFERENCES "InstagramAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InstagramInsight" ADD CONSTRAINT "InstagramInsight_instagramMediaId_fkey" FOREIGN KEY ("instagramMediaId") REFERENCES "InstagramMedia"("instagramMediaId") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SyncRun" ADD CONSTRAINT "SyncRun_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SyncRun" ADD CONSTRAINT "SyncRun_instagramAccountId_fkey" FOREIGN KEY ("instagramAccountId") REFERENCES "InstagramAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
