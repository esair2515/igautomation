# Deployment

Deploy `apps/web` to Vercel and `apps/api` plus `apps/worker` to a long-running Node host. Use managed PostgreSQL, Redis, and S3-compatible object storage. Set all variables from `.env.example` in the host secret manager. Run Prisma migrations as a release step, not on every application boot.
