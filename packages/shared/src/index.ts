export const roles = ["OWNER", "ADMIN", "EDITOR", "VIEWER"] as const;
export type Role = (typeof roles)[number];

export const navItems = [
  ["Dashboard", "/dashboard"], ["Accounts", "/accounts"], ["Analytics", "/analytics"],
  ["AI Studio", "/ai-studio"], ["Content", "/content"], ["Calendar", "/calendar"], ["Campaigns", "/campaigns"],
  ["Inbox", "/inbox"], ["Media", "/media"], ["Campus Profiles", "/campus-profiles"],
  ["Team", "/team"], ["Audit Log", "/audit"], ["Settings", "/settings"]
] as const;

export type AccountSummary = { id: string; username: string; campus: string; status: "CONNECTED" | "RECONNECT_REQUIRED" | "PAUSED"; followers?: number; engagement?: number; lastSync?: string };
export type DashboardSnapshot = { accounts: number; followers: number; reach: number; engagementRate: number; scheduled: number; failed: number; setupRequired: boolean };

export const syncQueueNames = { account: "account-sync", media: "media-sync", insights: "insights-sync" } as const;
export type SyncJobKind = keyof typeof syncQueueNames;
export type SyncJobData = { syncRunId: string; organizationId: string; instagramAccountId?: string; requestedByUserId?: string; from?: string; to?: string; provider?: "mock" | "meta" };
export const publishingQueueName = "publishing";
export type PublishingJobData = { scheduledPostId: string; organizationId: string; requestedByUserId?: string };
