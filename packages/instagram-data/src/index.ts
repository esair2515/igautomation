export type ProviderAccount = {
  providerAccountId: string;
  username: string;
  displayName: string;
  profileImageUrl: string | null;
  accountType: "BUSINESS" | "CREATOR";
  followers: number | null;
  following: number | null;
  mediaCount: number | null;
  isMock: boolean;
};

export type ProviderMedia = {
  providerMediaId: string;
  mediaType: "POST" | "REEL" | "STORY";
  mediaFormat: "IMAGE" | "VIDEO" | "CAROUSEL";
  caption: string | null;
  permalink: string | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  publishedAt: Date;
  isMock: boolean;
};

export type ProviderInsight = {
  date: Date;
  metricType: "FOLLOWERS" | "REACH" | "IMPRESSIONS" | "ENGAGEMENT" | "LIKES" | "COMMENTS" | "SAVES" | "SHARES" | "VIDEO_VIEWS" | "PROFILE_ACTIVITY";
  value: number;
  isMock: boolean;
};

export type ProviderMediaInsight = ProviderInsight & { providerMediaId: string };
export type Page<T> = { data: T[]; nextCursor: string | null };
export type ProviderFailureMode = "accounts" | "media" | "insights" | "always";

export interface InstagramDataProvider {
  readonly name: string;
  listAccounts(cursor?: string): Promise<Page<ProviderAccount>>;
  listMedia(providerAccountId: string, cursor?: string, since?: Date): Promise<Page<ProviderMedia>>;
  getAccountInsights(providerAccountId: string, from: Date, to: Date): Promise<ProviderInsight[]>;
  getMediaInsights(providerAccountId: string, providerMediaId: string): Promise<ProviderMediaInsight[]>;
}

function pageCursor(offset: number): string { return Buffer.from(String(offset), "utf8").toString("base64url"); }
function readCursor(cursor?: string): number { if (!cursor) return 0; const parsed = Number(Buffer.from(cursor, "base64url").toString("utf8")); return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0; }
function daysAgo(days: number): Date { const result = new Date(); result.setUTCHours(12, 0, 0, 0); result.setUTCDate(result.getUTCDate() - days); return result; }

export class MockMetaProvider implements InstagramDataProvider {
  readonly name = "mock";
  private readonly pageSize = 10;
  private readonly accounts: ProviderAccount[];
  private readonly failureMode = process.env.MOCK_META_FAILURE as ProviderFailureMode | undefined;
  private readonly delayMs = Math.max(0, Number(process.env.MOCK_META_DELAY_MS ?? 0));

  constructor() {
    const names = ["North Hall", "Riverside", "Arts District", "Lakeside", "Downtown", "West Campus"];
    this.accounts = names.map((name, index) => ({ providerAccountId: `mock-ig-${index + 1}`, username: `campus_${name.toLowerCase().replace(/\s/g, "_")}`, displayName: `${name} Campus`, profileImageUrl: `https://picsum.photos/seed/social-ops-${index + 1}/96/96`, accountType: index % 3 === 0 ? "CREATOR" : "BUSINESS", followers: 4200 + index * 1730, following: 180 + index * 23, mediaCount: 36, isMock: true }));
  }

  async listAccounts(cursor?: string): Promise<Page<ProviderAccount>> { await this.before("accounts"); return this.paginate(this.accounts, cursor); }
  async listMedia(providerAccountId: string, cursor?: string, since?: Date): Promise<Page<ProviderMedia>> { await this.before("media"); const accountIndex = this.accounts.findIndex((account) => account.providerAccountId === providerAccountId); if (accountIndex < 0) throw new Error("MOCK_ACCOUNT_NOT_FOUND"); const all = Array.from({ length: 36 }, (_, index) => { const type = index % 9 === 0 ? "REEL" : index % 13 === 0 ? "STORY" : "POST"; const format = type === "REEL" ? "VIDEO" : index % 7 === 0 ? "CAROUSEL" : "IMAGE"; const publishedAt = daysAgo(index * 2 + accountIndex); return { providerMediaId: `mock-media-${accountIndex + 1}-${index + 1}`, mediaType: type as ProviderMedia["mediaType"], mediaFormat: format as ProviderMedia["mediaFormat"], caption: `${this.accounts[accountIndex].displayName} community update ${index + 1}`, permalink: `https://instagram.com/p/mock-${accountIndex + 1}-${index + 1}`, mediaUrl: `https://picsum.photos/seed/mock-${accountIndex + 1}-${index + 1}/720/720`, thumbnailUrl: `https://picsum.photos/seed/mock-${accountIndex + 1}-${index + 1}/320/320`, publishedAt, isMock: true }; }).filter((media) => !since || media.publishedAt >= since); return this.paginate(all, cursor); }
  async getAccountInsights(providerAccountId: string, from: Date, to: Date): Promise<ProviderInsight[]> { await this.before("insights"); const accountIndex = this.accounts.findIndex((account) => account.providerAccountId === providerAccountId); if (accountIndex < 0) throw new Error("MOCK_ACCOUNT_NOT_FOUND"); const result: ProviderInsight[] = []; const cursor = new Date(from); cursor.setUTCHours(12, 0, 0, 0); while (cursor <= to) { const days = Math.max(0, Math.round((cursor.getTime() - from.getTime()) / 86400000)); const growth = accountIndex * 2 + Math.floor(days / 8); const followers = (this.accounts[accountIndex].followers ?? 0) + growth; result.push({ date: new Date(cursor), metricType: "FOLLOWERS", value: followers, isMock: true }, { date: new Date(cursor), metricType: "REACH", value: 850 + accountIndex * 210 + (days % 11) * 34, isMock: true }, { date: new Date(cursor), metricType: "IMPRESSIONS", value: 1300 + accountIndex * 310 + (days % 9) * 58, isMock: true }, { date: new Date(cursor), metricType: "ENGAGEMENT", value: 95 + accountIndex * 17 + (days % 7) * 8, isMock: true }, { date: new Date(cursor), metricType: "PROFILE_ACTIVITY", value: 40 + accountIndex * 9 + (days % 5) * 6, isMock: true }); cursor.setUTCDate(cursor.getUTCDate() + 1); } return result; }
  async getMediaInsights(providerAccountId: string, providerMediaId: string): Promise<ProviderMediaInsight[]> { await this.before("insights"); const accountIndex = this.accounts.findIndex((account) => account.providerAccountId === providerAccountId); const mediaIndex = Number(providerMediaId.split("-").pop() ?? 1); const multiplier = 1 + accountIndex * 0.18 + (mediaIndex % 6) * 0.12; return [{ providerMediaId, date: daysAgo(0), metricType: "LIKES", value: Math.round(80 * multiplier), isMock: true }, { providerMediaId, date: daysAgo(0), metricType: "COMMENTS", value: Math.round(12 * multiplier), isMock: true }, { providerMediaId, date: daysAgo(0), metricType: "SAVES", value: Math.round(22 * multiplier), isMock: true }, { providerMediaId, date: daysAgo(0), metricType: "SHARES", value: Math.round(9 * multiplier), isMock: true }, { providerMediaId, date: daysAgo(0), metricType: "REACH", value: Math.round(500 * multiplier), isMock: true }, { providerMediaId, date: daysAgo(0), metricType: "ENGAGEMENT", value: Math.round(64 * multiplier), isMock: true }]; }

  private async before(kind: ProviderFailureMode): Promise<void> { if (this.delayMs) await new Promise((resolve) => setTimeout(resolve, this.delayMs)); if (this.failureMode === "always" || this.failureMode === kind) throw new Error(`MOCK_${kind.toUpperCase()}_FAILURE`); }
  private paginate<T>(items: T[], cursor?: string): Page<T> { const offset = readCursor(cursor); const data = items.slice(offset, offset + this.pageSize); return { data, nextCursor: offset + this.pageSize < items.length ? pageCursor(offset + this.pageSize) : null }; }
}

export class RealMetaProvider implements InstagramDataProvider {
  readonly name = "meta";
  async listAccounts(): Promise<Page<ProviderAccount>> { throw new Error("REAL_META_PROVIDER_REQUIRES_PHASE_3_ACCOUNT_CREDENTIAL_ADAPTER"); }
  async listMedia(): Promise<Page<ProviderMedia>> { throw new Error("REAL_META_PROVIDER_NOT_IMPLEMENTED_FOR_PHASE_4"); }
  async getAccountInsights(): Promise<ProviderInsight[]> { throw new Error("REAL_META_PROVIDER_NOT_IMPLEMENTED_FOR_PHASE_4"); }
  async getMediaInsights(): Promise<ProviderMediaInsight[]> { throw new Error("REAL_META_PROVIDER_NOT_IMPLEMENTED_FOR_PHASE_4"); }
}

export function createInstagramDataProvider(): InstagramDataProvider { return (process.env.DATA_PROVIDER ?? "mock").toLowerCase() === "meta" ? new RealMetaProvider() : new MockMetaProvider(); }
