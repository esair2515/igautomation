import { Queue } from "bullmq";
import IORedis from "ioredis";
import { PrismaClient, SyncKind } from "@prisma/client";
import { config } from "@social-ops/config";
import { syncQueueNames, type SyncJobData, type SyncJobKind } from "@social-ops/shared";

let queues: { account: Queue<SyncJobData>; media: Queue<SyncJobData>; insights: Queue<SyncJobData> } | undefined;
function getQueues() { if (!queues) { const connection = new IORedis(config.redisUrl, { maxRetriesPerRequest: null }); queues = { account: new Queue(syncQueueNames.account, { connection }), media: new Queue(syncQueueNames.media, { connection }), insights: new Queue(syncQueueNames.insights, { connection }) }; } return queues; }

export async function enqueueSync(prisma: PrismaClient, kind: SyncJobKind, data: Omit<SyncJobData, "syncRunId">): Promise<{ syncRunId: string; jobId: string }> {
  const syncKind = kind === "account" ? SyncKind.ACCOUNT : kind === "media" ? SyncKind.MEDIA : SyncKind.INSIGHTS;
  const run = await prisma.syncRun.create({ data: { organizationId: data.organizationId, instagramAccountId: data.instagramAccountId, kind: syncKind, status: "QUEUED", provider: data.provider ?? process.env.DATA_PROVIDER ?? "mock", isMock: (data.provider ?? process.env.DATA_PROVIDER ?? "mock") === "mock" } });
  const payload: SyncJobData = { ...data, syncRunId: run.id };
  const job = await getQueues()[kind].add(`${kind}-sync`, payload, { jobId: run.id, attempts: 4, backoff: { type: "exponential", delay: 1000 }, removeOnComplete: 100, removeOnFail: 100 });
  await prisma.syncRun.update({ where: { id: run.id }, data: { jobId: String(job.id) } });
  return { syncRunId: run.id, jobId: String(job.id) };
}
