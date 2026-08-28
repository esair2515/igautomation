import crypto from "node:crypto";

type Bucket = { count: number; resetAt: number };
const attempts = new Map<string, Bucket>();

export function authRateLimit(key: string, now = Date.now()): { allowed: boolean; retryAfterSeconds: number } {
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  current.count += 1;
  return { allowed: current.count <= 10, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) };
}

export function resetAuthRateLimit(key: string): void { attempts.delete(key); }

export function randomInvitationToken(): string { return crypto.randomBytes(32).toString("base64url"); }
export function hashInvitationToken(token: string): string { return crypto.createHash("sha256").update(token).digest("hex"); }

export function createOAuthState(): string { return crypto.randomBytes(32).toString("base64url"); }
export function hashOAuthState(state: string): string { return crypto.createHash("sha256").update(state).digest("hex"); }
