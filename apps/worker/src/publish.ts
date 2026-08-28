import { PrismaClient, ContentStatus, JobStatus } from "@prisma/client";
import { createPublishingProvider, type PublishingProvider } from "@social-ops/publishing";
import type { PublishingJobData } from "@social-ops/shared";

export const publishPrisma = new PrismaClient();
export async function processPublishingJob(data: PublishingJobData, provider: PublishingProvider = createPublishingProvider()): Promise<string | null> {
  const scheduled = await publishPrisma.scheduledPost.findFirst({ where: { id: data.scheduledPostId, content: { organizationId: data.organizationId } }, include: { content: true } });
  if (!scheduled) throw new Error("SCHEDULED_POST_NOT_FOUND");
  if (scheduled.status === JobStatus.CANCELED) return null;
  if (scheduled.status === JobStatus.PUBLISHED && scheduled.externalPostId) return scheduled.externalPostId;
  const variant = await publishPrisma.contentVariant.findFirst({ where: { contentId: scheduled.contentId, instagramAccountId: scheduled.instagramAccountId }, include: { account: true } });
  const now = new Date();
  await publishPrisma.scheduledPost.update({ where: { id: scheduled.id }, data: { status: JobStatus.PUBLISHING, lastAttemptAt: now, retryCount: { increment: 1 } } });
  await publishPrisma.content.update({ where: { id: scheduled.contentId }, data: { status: ContentStatus.PUBLISHING } });
  try {
    const result = await provider.publish({ contentId: scheduled.contentId, scheduledPostId: scheduled.id, accountId: scheduled.instagramAccountId, caption: variant?.caption ?? scheduled.content.caption, media: variant?.media ?? null });
    await publishPrisma.scheduledPost.update({ where: { id: scheduled.id }, data: { status: JobStatus.PUBLISHED, publishedAt: result.publishedAt, externalPostId: result.externalPostId, failureReason: null } });
    await publishPrisma.content.update({ where: { id: scheduled.contentId }, data: { status: ContentStatus.PUBLISHED } });
    await publishPrisma.auditLog.create({ data: { organizationId: data.organizationId, actorId: data.requestedByUserId, action: "PUBLISH_SUCCEEDED", resource: "CONTENT", resourceId: scheduled.contentId, accountId: scheduled.instagramAccountId, metadata: { scheduledPostId: scheduled.id, externalPostId: result.externalPostId, provider: provider.name } } });
    return result.externalPostId;
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 240) : "PUBLISH_FAILED";
    await publishPrisma.scheduledPost.update({ where: { id: scheduled.id }, data: { status: JobStatus.FAILED, failureReason: message } });
    await publishPrisma.content.update({ where: { id: scheduled.contentId }, data: { status: ContentStatus.FAILED } });
    await publishPrisma.auditLog.create({ data: { organizationId: data.organizationId, actorId: data.requestedByUserId, action: "PUBLISH_FAILED", resource: "CONTENT", resourceId: scheduled.contentId, accountId: scheduled.instagramAccountId, metadata: { scheduledPostId: scheduled.id, error: message, provider: provider.name } } });
    throw error;
  }
}
