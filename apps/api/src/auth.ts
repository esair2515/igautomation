import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { PrismaClient, Role } from "@prisma/client";

export const SESSION_COOKIE = "social_ops_session";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;

export type AuthContext = {
  user: { id: string; name: string; email: string; status: string };
  organization: { id: string; name: string; role: Role };
  sessionId: string;
};

export function createSessionToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS,
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
}

export function requireAuth(prisma: PrismaClient) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
    if (!token) return res.status(401).json({ error: "AUTHENTICATION_REQUIRED", message: "Please sign in to continue." });
    const session = await prisma.session.findFirst({ where: { tokenHash: hashSessionToken(token), revokedAt: null, expiresAt: { gt: new Date() } }, include: { user: true, organization: true } });
    if (!session || session.user.status !== "ACTIVE") {
      clearSessionCookie(res);
      return res.status(401).json({ error: "SESSION_EXPIRED", message: "Your session has expired. Please sign in again." });
    }
    await prisma.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } });
    req.auth = { user: { id: session.user.id, name: session.user.name, email: session.user.email, status: session.user.status }, organization: { id: session.organization.id, name: session.organization.name, role: "VIEWER" as Role }, sessionId: session.id };
    const membership = await prisma.organizationMember.findUnique({ where: { organizationId_userId: { organizationId: session.organizationId, userId: session.userId } } });
    if (!membership) { clearSessionCookie(res); return res.status(403).json({ error: "ORGANIZATION_ACCESS_REVOKED" }); }
    req.auth.organization.role = membership.role;
    return next();
  };
}

export function requireRole(...allowed: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) return res.status(401).json({ error: "AUTHENTICATION_REQUIRED" });
    if (!allowed.includes(req.auth.organization.role)) return res.status(403).json({ error: "FORBIDDEN", message: "You do not have permission for this action." });
    return next();
  };
}

export function canManageRole(actor: Role, target: Role): boolean {
  if (actor === "OWNER") return true;
  if (actor === "ADMIN") return target === "EDITOR" || target === "VIEWER";
  return false;
}

declare global {
  namespace Express {
    interface Request { auth?: AuthContext; }
  }
}
