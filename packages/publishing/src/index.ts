export type PublishRequest = { contentId: string; scheduledPostId: string; accountId: string; caption: string | null; media: unknown };
export type PublishResult = { externalPostId: string; publishedAt: Date; isMock: boolean };
export interface PublishingProvider { readonly name: "mock" | "meta"; publish(request: PublishRequest): Promise<PublishResult>; }

export class MockPublishingProvider implements PublishingProvider {
  readonly name = "mock" as const;
  async publish(request: PublishRequest): Promise<PublishResult> { const delay = Math.min(Number(process.env.MOCK_PUBLISH_DELAY_MS ?? 0), 2000); if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay)); const failure = process.env.MOCK_PUBLISH_FAILURE; if (failure === "1" || failure === request.contentId || failure === request.scheduledPostId) throw new Error("MOCK_PUBLISH_FAILURE"); return { externalPostId: `mock-post-${request.contentId}`, publishedAt: new Date(), isMock: true }; }
}

export class RealPublishingProvider implements PublishingProvider {
  readonly name = "meta" as const;
  async publish(): Promise<PublishResult> { throw new Error("REAL_PUBLISHING_PROVIDER_DEFERRED"); }
}
export function createPublishingProvider(): PublishingProvider { return (process.env.PUBLISHING_PROVIDER ?? "mock").toLowerCase() === "meta" ? new RealPublishingProvider() : new MockPublishingProvider(); }
