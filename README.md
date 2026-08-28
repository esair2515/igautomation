# Social Ops Dashboard

Social Ops Dashboard is a multi-organization operations platform for managing Instagram publishing workflows through official Meta APIs. The repository is a TypeScript monorepo with a Next.js web app, Express REST API, Prisma/PostgreSQL data layer, and BullMQ worker.

## Current status

Phases 1–7 are implemented. Authentication uses bcrypt password hashing, hashed server-side session tokens, HTTP-only cookies, organization memberships, server-side RBAC, team invitations, profile settings, and append-only audit events. The application includes Meta account scaffolding with a deterministic mock provider, analytics, AI Studio, AI drafts, Content Library/editor, scheduling, calendar, mock BullMQ publishing, operational dashboard metrics, and organization-scoped activity. Real Instagram publishing, ManyChat, campaigns, and campus-profile workflows remain intentionally deferred.

## Local development

1. Copy `.env.example` to `.env` and set a strong `SESSION_SECRET` plus a generated `TOKEN_ENCRYPTION_KEY`.
2. Start infrastructure with `docker compose up -d`.
3. Install dependencies with `pnpm install`.
4. Generate Prisma client with `pnpm db:generate`.
5. Apply migrations with `pnpm db:migrate`.
6. Start web, API, and worker with `pnpm dev`.

To populate a non-production workspace with deterministic mock data, run `pnpm db:seed:mock`. Set `DATA_PROVIDER=mock` for the worker (the default). The mock provider creates six accounts, 36 media records per account, and 90 days of account insights. Never run the mock seed against production.

Web: http://localhost:3000 · API health: http://localhost:4000/health

## Architecture

- `apps/web`: Next.js dashboard shell and UI.
- `apps/api`: Express REST boundary, validation, security headers, and integration endpoints.
- `apps/worker`: BullMQ workers for publishing and background processing.
- `packages/database`: Prisma schema and database client.
- `packages/shared`: shared roles, navigation, and API-facing types.
- `packages/config`: environment-aware configuration.
- `packages/instagram-data`: provider interface, deterministic mock provider, and future real-provider seam.

Synchronization is asynchronous. API requests create `account-sync`, `media-sync`, and `insights-sync` BullMQ jobs; the worker reads the provider interface and writes idempotent account, media, insight, and sync-run records. Set `DATA_PROVIDER=meta` only when a real provider adapter is available.

Phase 5 adds the server-side [AI Content Studio](docs/ai-content.md) at `/ai-studio`. Local development defaults to deterministic `AI_PROVIDER=mock`; OpenAI generation requires server-only `OPENAI_API_KEY` and uses the configured `OPENAI_MODEL`. Generated content is stored as structured, organization-scoped drafts and is never published automatically.

Phase 6/7 adds the [Content workflow](docs/content-workflow.md): AI drafts can be sent to the Content Library, edited, scheduled, canceled, retried, or mock-published. Set `PUBLISHING_PROVIDER=mock` for local operation; `MOCK_PUBLISH_FAILURE` and `MOCK_PUBLISH_DELAY_MS` are available for demos and failure testing. The dashboard and activity feed use live organization-scoped database records.

### Authentication setup

Set `DATABASE_URL`, `SESSION_SECRET`, and `WEB_ORIGIN` in the API environment. Run `npm run db:migrate` (or `pnpm --filter @social-ops/database db:migrate`) before starting the API. Registration creates the first organization and assigns the registering user the `OWNER` role. Invitation tokens are returned only in non-production environments because no email provider is enabled yet.

See [docs/architecture.md](docs/architecture.md), [docs/meta-integration.md](docs/meta-integration.md), [docs/security.md](docs/security.md), and [docs/deployment.md](docs/deployment.md).
