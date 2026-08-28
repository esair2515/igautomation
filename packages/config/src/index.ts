declare const process: { env: Record<string, string | undefined> };

export function env(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const config = {
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  sessionSecret: process.env.SESSION_SECRET,
  apiPort: Number(process.env.API_PORT ?? 4000),
  metaConfigured: Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET),
  openAiConfigured: Boolean(process.env.OPENAI_API_KEY),
};
