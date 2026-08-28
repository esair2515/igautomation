-- Phase 3: Meta OAuth state and encrypted credential metadata
CREATE TABLE "OAuthState" (
    "id" TEXT NOT NULL,
    "stateHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OAuthState_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "InstagramAccount" ADD COLUMN "facebookPageId" TEXT;
ALTER TABLE "InstagramAccount" ADD COLUMN "tokenKeyVersion" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "InstagramAccount" ADD COLUMN "lastSyncFailedAt" TIMESTAMP(3);
ALTER TABLE "InstagramAccount" ADD COLUMN "lastSyncError" TEXT;
ALTER TABLE "InstagramAccount" ADD COLUMN "lastConnectionError" TEXT;

CREATE UNIQUE INDEX "OAuthState_stateHash_key" ON "OAuthState"("stateHash");
CREATE INDEX "OAuthState_organizationId_consumedAt_idx" ON "OAuthState"("organizationId", "consumedAt");
CREATE INDEX "OAuthState_expiresAt_idx" ON "OAuthState"("expiresAt");

ALTER TABLE "OAuthState" ADD CONSTRAINT "OAuthState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OAuthState" ADD CONSTRAINT "OAuthState_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
