import { z } from "zod";

const tokenResponseSchema = z.object({ access_token: z.string().min(1), user_id: z.union([z.string(), z.number()]).optional(), expires_in: z.number().optional() });
const profileResponseSchema = z.object({ user_id: z.union([z.string(), z.number()]), username: z.string().min(1), name: z.string().optional().nullable(), profile_picture_url: z.string().url().optional().nullable(), account_type: z.string().optional().nullable() });

export type MetaProfile = { instagramUserId: string; username: string; displayName: string | null; profilePictureUrl: string | null; accountType: string | null };
export type MetaToken = { accessToken: string; userId?: string; expiresIn?: number };

export class MetaApiError extends Error {
  constructor(public readonly operation: string, public readonly status: number, public readonly providerCode?: string, message = "Meta API request failed") { super(message); this.name = "MetaApiError"; }
}

function required(name: string): string { const value = process.env[name]; if (!value) throw new Error(`${name} is not configured`); return value; }

export class MetaApiService {
  private readonly graphBaseUrl = process.env.META_GRAPH_BASE_URL ?? "https://graph.instagram.com";
  private readonly oauthBaseUrl = process.env.META_OAUTH_BASE_URL ?? "https://api.instagram.com";
  private readonly authorizeUrl = process.env.META_AUTHORIZE_URL ?? "https://www.instagram.com/oauth/authorize";
  private readonly timeoutMs = 10_000;

  authorizationUrl(state: string): string {
    const url = new URL(this.authorizeUrl);
    url.searchParams.set("client_id", required("META_APP_ID"));
    url.searchParams.set("redirect_uri", required("META_REDIRECT_URI"));
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", process.env.META_SCOPES ?? "instagram_business_basic");
    url.searchParams.set("state", state);
    return url.toString();
  }

  async exchangeAuthorizationCode(code: string): Promise<MetaToken> {
    const form = new URLSearchParams({ client_id: required("META_APP_ID"), client_secret: required("META_APP_SECRET"), grant_type: "authorization_code", redirect_uri: required("META_REDIRECT_URI"), code });
    const response = await this.request(`${this.oauthBaseUrl}/oauth/access_token`, { method: "POST", body: form, headers: { "content-type": "application/x-www-form-urlencoded" } });
    const parsed = tokenResponseSchema.safeParse(response); if (!parsed.success) throw new MetaApiError("exchange_authorization_code", 502, undefined, "Meta returned an invalid token response");
    return { accessToken: parsed.data.access_token, userId: parsed.data.user_id ? String(parsed.data.user_id) : undefined, expiresIn: parsed.data.expires_in };
  }

  async exchangeLongLivedToken(shortLivedToken: string): Promise<MetaToken> {
    const form = new URLSearchParams({ grant_type: "ig_exchange_token", client_secret: required("META_APP_SECRET"), access_token: shortLivedToken });
    const response = await this.request(`${this.graphBaseUrl}/access_token`, { method: "POST", body: form, headers: { "content-type": "application/x-www-form-urlencoded" } });
    const parsed = tokenResponseSchema.safeParse(response); if (!parsed.success) throw new MetaApiError("exchange_long_lived_token", 502, undefined, "Meta returned an invalid long-lived token response");
    return { accessToken: parsed.data.access_token, userId: parsed.data.user_id ? String(parsed.data.user_id) : undefined, expiresIn: parsed.data.expires_in };
  }

  async getProfile(accessToken: string): Promise<MetaProfile> {
    const response = await this.request(`${this.graphBaseUrl}/me?fields=user_id,username,name,profile_picture_url,account_type`, { headers: { authorization: `Bearer ${accessToken}` } });
    const parsed = profileResponseSchema.safeParse(response); if (!parsed.success) throw new MetaApiError("get_profile", 502, undefined, "Meta returned an invalid Instagram profile response");
    return { instagramUserId: String(parsed.data.user_id), username: parsed.data.username, displayName: parsed.data.name ?? null, profilePictureUrl: parsed.data.profile_picture_url ?? null, accountType: parsed.data.account_type ?? null };
  }

  async revoke(accessToken: string): Promise<void> { await this.request(`${this.graphBaseUrl}/me/permissions`, { method: "DELETE", headers: { authorization: `Bearer ${accessToken}` } }); }

  private async request(url: string, init: RequestInit): Promise<unknown> {
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal }); const body = await response.json().catch(() => ({}));
      if (!response.ok) { const providerError = z.object({ error: z.object({ code: z.union([z.string(), z.number()]).optional(), message: z.string().optional() }).optional() }).safeParse(body); throw new MetaApiError("request", response.status, providerError.success ? String(providerError.data.error?.code ?? "") : undefined, "Meta API request failed"); }
      return body;
    } catch (error) { if (error instanceof MetaApiError) throw error; if (error instanceof Error && error.name === "AbortError") throw new MetaApiError("request", 504, undefined, "Meta API request timed out"); throw new MetaApiError("request", 502, undefined, "Meta API request could not be completed"); } finally { clearTimeout(timer); }
  }
}
