# Instagram data and analytics

The analytics data path is provider-agnostic:

`InstagramDataProvider → BullMQ sync job → Prisma account/media/insight records → organization-scoped analytics API → web dashboard`

The mock provider exposes paginated accounts and media, deterministic media performance, and 90 days of account-level metrics. Every synchronized row carries `isMock`, and the API returns `source: "MOCK"` when the current workspace includes mock data. Account and media synchronization is idempotent through provider ID constraints and metric keys.

Available API surfaces include `GET /api/analytics`, `/api/analytics/growth`, `/api/analytics/engagement`, `/api/analytics/media`, and `/api/analytics/accounts/:accountId`. Manual sync requests return immediately with BullMQ job IDs through `POST /api/sync` or `POST /api/accounts/:accountId/sync`.
