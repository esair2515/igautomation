import { z } from "zod";

export const aiContentTypes = ["CAPTION", "POST_CONCEPT", "STORY", "REEL", "CAPTION_VARIATIONS", "HASHTAGS", "CONTENT_IDEAS"] as const;
export type AIContentType = (typeof aiContentTypes)[number];
export const aiContentTypeSchema = z.enum(aiContentTypes);

export const accountContextSchema = z.object({ id: z.string().min(1), username: z.string().min(1), displayName: z.string().nullable(), accountType: z.string().nullable(), dataIsMock: z.boolean() });
export type AccountContext = z.infer<typeof accountContextSchema>;
export const generationInputSchema = z.object({ contentType: aiContentTypeSchema, topic: z.string().trim().min(3).max(1000), tone: z.string().trim().min(1).max(80), audience: z.string().trim().min(1).max(160), length: z.enum(["SHORT", "MEDIUM", "LONG"]), callToAction: z.string().trim().min(1).max(160), additionalInstructions: z.string().trim().max(1000).optional(), account: accountContextSchema });
export type GenerationInput = z.infer<typeof generationInputSchema>;

const captionSchema = z.object({ kind: z.literal("CAPTION"), caption: z.string().min(1).max(2200), hashtags: z.array(z.string()).max(30), cta: z.string() });
const postSchema = z.object({ kind: z.literal("POST_CONCEPT"), concept: z.string(), caption: z.string(), visualDirection: z.string(), cta: z.string(), hashtags: z.array(z.string()).max(30) });
const storySchema = z.object({ kind: z.literal("STORY"), frames: z.array(z.object({ frame: z.number().int().positive(), text: z.string(), visualDirection: z.string(), cta: z.string().optional() })).min(1).max(10) });
const reelSchema = z.object({ kind: z.literal("REEL"), hook: z.string(), concept: z.string(), scenes: z.array(z.object({ scene: z.number().int().positive(), direction: z.string(), voiceover: z.string() })).min(1).max(12), script: z.string(), caption: z.string(), cta: z.string(), hashtags: z.array(z.string()).max(30) });
const variationsSchema = z.object({ kind: z.literal("CAPTION_VARIATIONS"), variations: z.array(z.object({ label: z.string(), caption: z.string(), hashtags: z.array(z.string()).max(30) })).min(2).max(6) });
const hashtagsSchema = z.object({ kind: z.literal("HASHTAGS"), hashtags: z.array(z.string()).min(3).max(30), rationale: z.string() });
const ideasSchema = z.object({ kind: z.literal("CONTENT_IDEAS"), ideas: z.array(z.object({ title: z.string(), angle: z.string(), format: z.enum(["POST", "REEL", "STORY"]), hook: z.string(), cta: z.string() })).min(3).max(10) });
export const generatedContentSchema = z.union([captionSchema, postSchema, storySchema, reelSchema, variationsSchema, hashtagsSchema, ideasSchema]);
export type GeneratedContent = z.infer<typeof generatedContentSchema>;

export interface AIProvider { readonly name: "mock" | "openai"; readonly modelId: string; generate(input: GenerationInput): Promise<GeneratedContent>; }

const hashtagSet = ["#campuslife", "#studentlife", "#community", "#discovermore", "#gocampus"];
function topic(input: GenerationInput): string { return input.topic.replace(/\s+/g, " ").trim(); }
function mockResult(input: GenerationInput): GeneratedContent {
  const t = topic(input); const cta = input.callToAction;
  switch (input.contentType) {
    case "CAPTION": return { kind: "CAPTION", caption: `${t} made for ${input.audience}. Bring your ${input.tone} energy and make the next moment count.`, hashtags: hashtagSet.slice(0, 4), cta };
    case "POST_CONCEPT": return { kind: "POST_CONCEPT", concept: `A ${input.tone.toLowerCase()} snapshot showing how ${t} fits into everyday life at ${input.account.displayName ?? input.account.username}.`, caption: `${t} starts with one small step. What would you try first?`, visualDirection: "Use a bright, people-first image with one clear focal point and natural campus texture.", cta, hashtags: hashtagSet.slice(0, 5) };
    case "STORY": return { kind: "STORY", frames: [{ frame: 1, text: `${t}: here's the moment.`, visualDirection: "Open with a close-up or bold text overlay." }, { frame: 2, text: "What would you choose?", visualDirection: "Show two quick details or a behind-the-scenes clip." }, { frame: 3, text: cta, visualDirection: "End with a clean branded frame and a reply prompt.", cta }] };
    case "REEL": return { kind: "REEL", hook: `POV: you discover ${t}.`, concept: `A quick, upbeat walkthrough that turns ${t} into a memorable three-beat story for ${input.audience}.`, scenes: [{ scene: 1, direction: "Fast opening shot with on-screen hook", voiceover: `Want to see what ${t} looks like in real life?` }, { scene: 2, direction: "Two detail shots matched to the beat", voiceover: "Here are the details that make the difference." }, { scene: 3, direction: "People-first closing shot", voiceover: cta }], script: `Want to see what ${t} looks like in real life? Here are the details that make the difference. ${cta}`, caption: `${t}, in motion. Save this idea for your next visit.`, cta, hashtags: hashtagSet.slice(0, 5) };
    case "CAPTION_VARIATIONS": return { kind: "CAPTION_VARIATIONS", variations: [{ label: "Warm", caption: `${t} feels better when shared with the right people.`, hashtags: hashtagSet.slice(0, 3) }, { label: "Direct", caption: `Make room for ${t}. Your next favorite moment is closer than you think.`, hashtags: hashtagSet.slice(1, 5) }, { label: "Playful", caption: `Consider this your sign to put ${t} on the list.`, hashtags: hashtagSet.slice(0, 4) }] };
    case "HASHTAGS": return { kind: "HASHTAGS", hashtags: hashtagSet, rationale: `A balanced mix of broad community tags and topic-adjacent discovery tags for ${input.audience}.` };
    case "CONTENT_IDEAS": return { kind: "CONTENT_IDEAS", ideas: [{ title: `The ${t} starter guide`, angle: "Answer the first questions a new audience member has.", format: "POST", hook: `New to ${t}? Start here.`, cta }, { title: `${t} in 15 seconds`, angle: "Turn the experience into a quick visual walkthrough.", format: "REEL", hook: `Here is ${t}, without the guesswork.`, cta }, { title: "Ask the community", angle: "Invite replies with a simple choice or prompt.", format: "STORY", hook: `What is your favorite part of ${t}?`, cta }] };
  }
}

export class MockAIProvider implements AIProvider {
  readonly name = "mock" as const; readonly modelId = "mock-v1";
  async generate(input: GenerationInput): Promise<GeneratedContent> { const delay = Number(process.env.MOCK_AI_DELAY_MS ?? 0); if (delay > 0) await new Promise((resolve) => setTimeout(resolve, Math.min(delay, 2000))); if (process.env.MOCK_AI_FAILURE === "1" || process.env.MOCK_AI_FAILURE === input.contentType) throw new Error("MOCK_AI_FAILURE"); return generatedContentSchema.parse(mockResult(input)); }
}

export class OpenAIProvider implements AIProvider {
  readonly name = "openai" as const; readonly modelId: string; private readonly apiKey: string;
  constructor(apiKey = process.env.OPENAI_API_KEY ?? "", modelId = process.env.OPENAI_MODEL ?? "gpt-5-mini") { this.apiKey = apiKey; this.modelId = modelId; }
  async generate(input: GenerationInput): Promise<GeneratedContent> {
    if (!this.apiKey) throw new Error("OPENAI_API_KEY_REQUIRED");
    const schema = { type: "object", additionalProperties: true };
    const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` }, body: JSON.stringify({ model: this.modelId, instructions: "You create high-quality Instagram content. Return only valid JSON matching the requested content type. Never include HTML, executable code, API keys, or private credentials.", input: JSON.stringify(input), text: { format: { type: "json_schema", name: "instagram_content", strict: false, schema } } }) });
    if (!response.ok) throw new Error(`OPENAI_REQUEST_FAILED_${response.status}`);
    const body = await response.json() as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
    const raw = body.output_text ?? body.output?.flatMap((item) => item.content ?? []).map((item) => item.text ?? "").join("");
    if (!raw) throw new Error("OPENAI_EMPTY_RESPONSE");
    try { return generatedContentSchema.parse(JSON.parse(raw)); } catch { throw new Error("OPENAI_INVALID_STRUCTURED_CONTENT"); }
  }
}

export function createAIProvider(): AIProvider { return (process.env.AI_PROVIDER ?? "mock").toLowerCase() === "openai" ? new OpenAIProvider() : new MockAIProvider(); }
