# Phase 6 content workflow

Content is organization-scoped and uses the existing `Content`, `ContentVariant`, and `ScheduledPost` records. AI Studio drafts can be converted into Content Library items through `POST /api/content/from-draft/:draftId`.

Local publishing uses the mock provider by default:

```env
PUBLISHING_PROVIDER=mock
MOCK_PUBLISH_FAILURE=
MOCK_PUBLISH_DELAY_MS=0
```

Scheduling and publish-now requests enqueue BullMQ jobs. The worker updates the scheduled post and content status, records attempts and failures, and writes audit events. No real Instagram publishing is performed in Phase 6; the real provider remains intentionally deferred.

Useful local commands:

```sh
pnpm db:migrate
pnpm dev
pnpm test
pnpm typecheck
pnpm build
```
