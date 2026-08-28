# AI Content Studio

Phase 5 adds a server-side AI generation and draft workflow at `/ai-studio`.

## Architecture

The API depends on `@social-ops/ai-content` rather than calling a model from the browser. `MockAIProvider` is the default local provider and returns deterministic structured results for captions, post concepts, Stories, Reels, caption variations, hashtags, and content ideas. `OpenAIProvider` uses the Responses API and a structured JSON response format when `AI_PROVIDER=openai`.

Generated content is recorded in `AIGeneration`. Saving a result creates an organization-scoped `AIDraft`; edited content is stored separately from the original generated result. `AIUsageCounter` tracks monthly organization generation counts as a lightweight usage boundary for future limits.

## API

- `POST /api/ai/generate` — authenticated OWNER/ADMIN/EDITOR generation with account ownership validation.
- `GET /api/ai/drafts` — list active drafts in the current organization.
- `GET /api/ai/drafts/:draftId` — retrieve one scoped draft.
- `POST /api/ai/drafts` — save a successful generation as a draft.
- `PATCH /api/ai/drafts/:draftId` — edit a draft; creators can edit their own drafts and owners/admins can manage workspace drafts.
- `DELETE /api/ai/drafts/:draftId` — archive a draft.
- `POST /api/ai/drafts/:draftId/regenerate` — create a new generation without changing the existing draft.

All request bodies are validated with Zod. AI credentials remain server-side. Generation endpoints use the existing rate limiter and write audit records for generation success/failure and draft lifecycle events.

## Local setup

Use the mock provider without an API key:

```bash
AI_PROVIDER=mock
pnpm db:migrate
pnpm dev
```

For OpenAI-backed generation, configure `OPENAI_API_KEY` and `OPENAI_MODEL` in the server environment and set `AI_PROVIDER=openai`. The browser only receives generated content and provider metadata; it never receives the API key.

The account selector uses the existing organization-scoped Instagram accounts. No scheduling, publishing, media upload, campaigns, ManyChat, or campus-profile system is included in this phase.
