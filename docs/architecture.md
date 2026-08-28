# Architecture

The system is organized around organization-scoped records. API handlers must resolve the authenticated user's organization membership before reading or mutating any account, content, schedule, analytics, or audit record. Background jobs carry immutable IDs and re-check account status, organization safety, kill-switch state, and idempotency immediately before publishing.

Sessions point to one active organization and are switched only after verifying that the authenticated user has a membership in the target organization. Organization roles live on `OrganizationMember`; the legacy `User.role` field is retained for compatibility but is not used for authorization.

The web app is intentionally usable without credentials: it communicates setup requirements and never represents demo data as live Instagram data.
