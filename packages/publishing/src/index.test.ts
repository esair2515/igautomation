import test from "node:test";
import assert from "node:assert/strict";
import { MockPublishingProvider } from "./index";
test("mock publishing is deterministic and returns a mock post id", async () => { const result = await new MockPublishingProvider().publish({ contentId: "content-1", scheduledPostId: "job-1", accountId: "account-1", caption: "Hello", media: null }); assert.equal(result.externalPostId, "mock-post-content-1"); assert.equal(result.isMock, true); });
test("mock publishing supports controlled failures", async () => { const previous = process.env.MOCK_PUBLISH_FAILURE; process.env.MOCK_PUBLISH_FAILURE = "content-1"; await assert.rejects(() => new MockPublishingProvider().publish({ contentId: "content-1", scheduledPostId: "job-1", accountId: "account-1", caption: null, media: null }), /MOCK_PUBLISH_FAILURE/); process.env.MOCK_PUBLISH_FAILURE = previous; });
