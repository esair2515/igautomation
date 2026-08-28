import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { SyncKind } from "@prisma/client";
import { config } from "@social-ops/config";
import { publishingQueueName, syncQueueNames, type PublishingJobData, type SyncJobData } from "@social-ops/shared";
import { createInstagramDataProvider } from "@social-ops/instagram-data";
import { createPublishingProvider } from "@social-ops/publishing";
import { processSyncJob } from "./sync";
import { processPublishingJob } from "./publish";

const connection = new IORedis(config.redisUrl, { maxRetriesPerRequest: null });
export const syncQueues = { account: new Queue(syncQueueNames.account, { connection }), media: new Queue(syncQueueNames.media, { connection }), insights: new Queue(syncQueueNames.insights, { connection }) };
const provider = createInstagramDataProvider();
const publishingProvider = createPublishingProvider();
const workerOptions = { connection, concurrency: Number(process.env.SYNC_WORKER_CONCURRENCY ?? 2), autorun: true, settings: { backoffStrategy: (attemptsMade: number) => Math.min(60_000, 1000 * 2 ** attemptsMade) } };

for (const [kind, queueName] of Object.entries(syncQueueNames)) { const syncKind = kind === "account" ? SyncKind.ACCOUNT : kind === "media" ? SyncKind.MEDIA : SyncKind.INSIGHTS; new Worker<SyncJobData>(queueName, async (job) => processSyncJob(syncKind, job.data, provider), workerOptions); }
export const publishingQueue = new Queue<PublishingJobData>(publishingQueueName, { connection });
new Worker<PublishingJobData>(publishingQueueName, async (job) => processPublishingJob(job.data, publishingProvider), { ...workerOptions, concurrency: Number(process.env.PUBLISH_WORKER_CONCURRENCY ?? 2) });

console.log(`Instagram worker ready with ${provider.name} data and ${publishingProvider.name} publishing providers. Queues: ${[...Object.values(syncQueueNames), publishingQueueName].join(", ")}`);
