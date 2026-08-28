import { Queue } from "bullmq";
import IORedis from "ioredis";
import { PrismaClient, JobStatus } from "@prisma/client";
import { config } from "@social-ops/config";
import { publishingQueueName, type PublishingJobData } from "@social-ops/shared";

let queue: Queue<PublishingJobData> | undefined;
function getQueue(): Queue<PublishingJobData> { if (!queue) queue = new Queue<PublishingJobData>(publishingQueueName, { connection: new IORedis(config.redisUrl, { maxRetriesPerRequest: null }) }); return queue; }
export async function enqueuePublishing(prisma: PrismaClient, scheduledPostId: string, organizationId: string, requestedByUserId: string | undefined, delay = 0): Promise<string> {
  const job = await getQueue().add("publish", { scheduledPostId, organizationId, requestedByUserId }, { jobId: `${scheduledPostId}:${Date.now()}`, delay: Math.max(0, delay), attempts: 4, backoff: { type: "exponential", delay: 1000 }, removeOnComplete: 100, removeOnFail: 100 });
  await prisma.scheduledPost.update({ where: { id: scheduledPostId }, data: { bullmqJobId: String(job.id), status: JobStatus.QUEUED } });
  return String(job.id);
}
