CREATE TYPE "AIContentType" AS ENUM ('CAPTION', 'POST_CONCEPT', 'STORY', 'REEL', 'CAPTION_VARIATIONS', 'HASHTAGS', 'CONTENT_IDEAS');
CREATE TYPE "AIGenerationStatus" AS ENUM ('SUCCEEDED', 'FAILED');
CREATE TYPE "AIDraftStatus" AS ENUM ('DRAFT', 'ARCHIVED');

CREATE TABLE "AIGeneration" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "instagramAccountId" TEXT NOT NULL,
    "contentType" "AIContentType" NOT NULL,
    "provider" TEXT NOT NULL,
    "modelId" TEXT,
    "status" "AIGenerationStatus" NOT NULL,
    "promptMetadata" JSONB NOT NULL,
    "result" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIGeneration_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AIDraft" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "instagramAccountId" TEXT NOT NULL,
    "generationId" TEXT,
    "contentType" "AIContentType" NOT NULL,
    "generatedContent" JSONB NOT NULL,
    "editedContent" JSONB NOT NULL,
    "provider" TEXT NOT NULL,
    "modelId" TEXT,
    "promptMetadata" JSONB NOT NULL,
    "status" "AIDraftStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AIDraft_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AIUsageCounter" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "generationCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AIUsageCounter_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AIUsageCounter_organizationId_periodStart_key" ON "AIUsageCounter"("organizationId", "periodStart");
CREATE INDEX "AIGeneration_organizationId_createdAt_idx" ON "AIGeneration"("organizationId", "createdAt");
CREATE INDEX "AIGeneration_organizationId_instagramAccountId_contentType_createdAt_idx" ON "AIGeneration"("organizationId", "instagramAccountId", "contentType", "createdAt");
CREATE INDEX "AIDraft_organizationId_updatedAt_idx" ON "AIDraft"("organizationId", "updatedAt");
CREATE INDEX "AIDraft_organizationId_instagramAccountId_updatedAt_idx" ON "AIDraft"("organizationId", "instagramAccountId", "updatedAt");
CREATE INDEX "AIDraft_createdById_updatedAt_idx" ON "AIDraft"("createdById", "updatedAt");
CREATE INDEX "AIUsageCounter_organizationId_periodStart_idx" ON "AIUsageCounter"("organizationId", "periodStart");

ALTER TABLE "AIGeneration" ADD CONSTRAINT "AIGeneration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIGeneration" ADD CONSTRAINT "AIGeneration_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AIGeneration" ADD CONSTRAINT "AIGeneration_instagramAccountId_fkey" FOREIGN KEY ("instagramAccountId") REFERENCES "InstagramAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIDraft" ADD CONSTRAINT "AIDraft_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIDraft" ADD CONSTRAINT "AIDraft_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AIDraft" ADD CONSTRAINT "AIDraft_instagramAccountId_fkey" FOREIGN KEY ("instagramAccountId") REFERENCES "InstagramAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIDraft" ADD CONSTRAINT "AIDraft_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "AIGeneration"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AIUsageCounter" ADD CONSTRAINT "AIUsageCounter_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
