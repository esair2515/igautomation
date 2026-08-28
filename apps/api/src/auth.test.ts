import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { app, prisma } from "./index";
import { canManageRole } from "./auth";

let server: ReturnType<typeof app.listen>;
let baseUrl = "";
before(() => new Promise<void>((resolve) => { server = app.listen(0, () => { const address = server.address(); if (address && typeof address !== "string") baseUrl = `http://127.0.0.1:${address.port}`; resolve(); }); }));
after(() => { server.close(); });
function setMethod(target: object, name: string, implementation: (...args: any[]) => unknown): void { Object.defineProperty(target, name, { value: implementation, writable: true, configurable: true }); }
const request = (path: string, init?: RequestInit) => fetch(`${baseUrl}${path}`, init);
const user = { id: "user-1", name: "Owner User", email: "owner@example.com", passwordHash: "", role: "OWNER" as const, status: "ACTIVE" as const, createdAt: new Date(), updatedAt: new Date(), lastLoginAt: null };

test("unauthorized requests are rejected", async () => { const response = await request("/api/team"); assert.equal(response.status, 401); });
test("unauthenticated account access is rejected", async () => { const response = await request("/api/accounts"); assert.equal(response.status, 401); });

test("registration creates a user, workspace, session, and audit record", async () => {
  const createdUser = { ...user, passwordHash: await bcrypt.hash("password123", 4) }; const organization = { id: "org-1", name: "Acme Workspace", createdAt: new Date(), updatedAt: new Date() };
  const tx = { user: { findUnique: async () => null, create: async () => createdUser }, organization: { create: async () => organization }, organizationMember: { create: async () => ({}) }, auditLog: { create: async () => ({}) } };
  setMethod(prisma as any, "$transaction", async (callback: (value: unknown) => unknown) => callback(tx)); setMethod(prisma.session, "create", async () => ({}));
  const response = await request("/api/auth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "Owner User", email: "owner@example.com", password: "password123", organizationName: "Acme Workspace" }) });
  assert.equal(response.status, 201); const body = await response.json(); assert.equal(body.user.email, "owner@example.com"); assert.equal(body.user.passwordHash, undefined); assert.match(response.headers.get("set-cookie") ?? "", /HttpOnly/i);
});

test("login returns a safe user and sets a session cookie", async () => {
  const passwordHash = await bcrypt.hash("password123", 4); setMethod(prisma.user, "findUnique", async () => ({ ...user, passwordHash })); setMethod(prisma.organizationMember, "findFirst", async () => ({ organizationId: "org-1", userId: user.id, role: "OWNER", createdAt: new Date(), organization: { id: "org-1", name: "Acme Workspace" } })); setMethod(prisma.user, "update", async () => ({ ...user, passwordHash, lastLoginAt: new Date() })); setMethod(prisma.session, "create", async () => ({})); setMethod(prisma.auditLog, "create", async () => ({}));
  const response = await request("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: user.email, password: "password123" }) });
  assert.equal(response.status, 200); const body = await response.json(); assert.equal(body.user.email, user.email); assert.equal(body.user.passwordHash, undefined); assert.match(response.headers.get("set-cookie") ?? "", /HttpOnly/i);
});

test("logout revokes a cookie-backed session", async () => { setMethod(prisma.session, "findFirst", async () => ({ id: "session-1", userId: user.id, organizationId: "org-1" })); setMethod(prisma.session, "update", async () => ({})); setMethod(prisma.auditLog, "create", async () => ({})); const response = await request("/api/auth/logout", { method: "POST", headers: { cookie: "social_ops_session=token" } }); assert.equal(response.status, 204); });

test("organization isolation rejects a revoked membership", async () => { setMethod(prisma.session, "findFirst", async () => ({ id: "session-1", userId: user.id, organizationId: "org-other", expiresAt: new Date(Date.now() + 10000), revokedAt: null, user, organization: { id: "org-other", name: "Other Org" } })); setMethod(prisma.session, "update", async () => ({})); setMethod(prisma.organizationMember, "findUnique", async () => null); const response = await request("/api/team", { headers: { cookie: "social_ops_session=token" } }); assert.equal(response.status, 403); });
test("cross-organization account access is rejected", async () => { setMethod(prisma.session, "findFirst", async () => ({ id: "session-1", userId: user.id, organizationId: "org-1", expiresAt: new Date(Date.now() + 10000), revokedAt: null, user, organization: { id: "org-1", name: "Acme Workspace" } })); setMethod(prisma.session, "update", async () => ({})); setMethod(prisma.organizationMember, "findUnique", async () => ({ organizationId: "org-1", userId: user.id, role: "OWNER", createdAt: new Date() })); setMethod(prisma.instagramAccount, "findFirst", async () => null); const response = await request("/api/accounts/account-from-other-org", { headers: { cookie: "social_ops_session=token" } }); assert.equal(response.status, 404); });

test("OWNER permissions can manage every team role", () => { for (const role of ["OWNER", "ADMIN", "EDITOR", "VIEWER"] as const) assert.equal(canManageRole("OWNER", role), true); });
test("ADMIN permissions are limited to editor and viewer roles", () => { assert.equal(canManageRole("ADMIN", "EDITOR"), true); assert.equal(canManageRole("ADMIN", "VIEWER"), true); assert.equal(canManageRole("ADMIN", "ADMIN"), false); assert.equal(canManageRole("ADMIN", "OWNER"), false); });
test("EDITOR permissions cannot manage team roles", () => { assert.equal(canManageRole("EDITOR", "VIEWER"), false); });
test("VIEWER permissions cannot manage team roles", () => { assert.equal(canManageRole("VIEWER", "VIEWER"), false); });
