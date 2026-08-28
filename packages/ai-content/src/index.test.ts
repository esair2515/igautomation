import test from "node:test";
import assert from "node:assert/strict";
import { MockAIProvider, generationInputSchema, type GenerationInput } from "./index";

const base: GenerationInput = { contentType: "CAPTION", topic: "welcome week", tone: "warm", audience: "new students", length: "MEDIUM", callToAction: "Tell us your favorite moment", account: { id: "a1", username: "campus", displayName: "Campus", accountType: "BUSINESS", dataIsMock: true } };
test("mock AI returns deterministic structured output for every content type", async () => { const provider = new MockAIProvider(); for (const contentType of ["CAPTION", "POST_CONCEPT", "STORY", "REEL", "CAPTION_VARIATIONS", "HASHTAGS", "CONTENT_IDEAS"] as const) { const first = await provider.generate({ ...base, contentType }); const second = await provider.generate({ ...base, contentType }); assert.deepEqual(first, second); assert.equal(first.kind, contentType); } });
test("mock AI supports controlled failures", async () => { const old = process.env.MOCK_AI_FAILURE; process.env.MOCK_AI_FAILURE = "REEL"; await assert.rejects(() => new MockAIProvider().generate({ ...base, contentType: "REEL" }), /MOCK_AI_FAILURE/); process.env.MOCK_AI_FAILURE = old; });
test("generation input validation requires a meaningful topic and account context", () => { assert.equal(generationInputSchema.safeParse({ ...base, topic: "" }).success, false); assert.equal(generationInputSchema.safeParse({ ...base, account: { ...base.account, id: "" } }).success, false); });
