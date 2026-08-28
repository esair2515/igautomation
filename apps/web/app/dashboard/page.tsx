"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "../../components/DashboardShell";
import { apiFetch } from "../../lib/api";

type DashboardData = {
  accounts: { id: string; username: string; connectionStatus: string; mediaCount: number | null; lastSyncedAt: string | null; dataIsMock: boolean }[];
  metrics: { connectedAccounts: number; contentCreated: number; scheduledContent: number; publishedContent: number; failedPublishingJobs: number; aiGenerations: number };
  recentContent: { id: string; title: string; status: string; scheduledAt: string | null; account: { username: string } | null }[];
  activity: { id: string; action: string; createdAt: string; actor: { name: string } | null }[];
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await apiFetch<DashboardData>("/api/dashboard")); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load dashboard"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  return <DashboardShell><section className="content">
    <div className="header-row"><div><div className="eyebrow">Executive overview</div><h1>Your operations dashboard</h1><p className="subtle">A live view of this workspace’s content, accounts, and publishing health.</p></div><a className="button" href="/ai-studio">Create with AI</a></div>
    {error && <div className="notice error-notice" role="alert">{error}<button className="text-button" onClick={load}>Retry</button></div>}
    {loading ? <div className="card empty">Loading dashboard…</div> : data && <>
      <div className="grid metrics" style={{ marginTop: 16 }}><Metric label="Connected accounts" value={data.metrics.connectedAccounts} href="/accounts" /><Metric label="Content created" value={data.metrics.contentCreated} href="/content" /><Metric label="Scheduled" value={data.metrics.scheduledContent} href="/calendar" /><Metric label="Published" value={data.metrics.publishedContent} href="/content?status=PUBLISHED" /><Metric label="Failed jobs" value={data.metrics.failedPublishingJobs} href="/content?status=FAILED" /><Metric label="AI generations" value={data.metrics.aiGenerations} href="/ai-studio" /></div>
      <div className="quick-actions"><a className="button" href="/ai-studio">Create with AI</a><a className="button secondary" href="/content">Create Content</a><a className="button secondary" href="/calendar">View Calendar</a><a className="button secondary" href="/accounts">View Accounts</a><a className="button secondary" href="/analytics">View Analytics</a></div>
      <div className="grid columns"><div className="card"><div className="card-head"><h2>Recent content</h2><a className="subtle" href="/content">Open library</a></div>{data.recentContent.length ? data.recentContent.map((item) => <a className="activity-item" href={`/content/${item.id}`} key={item.id}><span className={`dot status-dot-${item.status.toLowerCase()}`} /><span><strong>{item.title}</strong><br /><span className="subtle">{item.account ? `@${item.account.username} · ` : ""}{item.status}{item.scheduledAt ? ` · ${new Date(item.scheduledAt).toLocaleString()}` : ""}</span></span></a>) : <div className="empty">No content created yet.</div>}</div>
        <div className="card"><div className="card-head"><h2>Recent activity</h2><span className="subtle">Workspace events</span></div>{data.activity.length ? data.activity.map((event) => <div className="activity-item" key={event.id}><span className="dot" /><span><strong>{event.action.replaceAll("_", " ")}</strong><br /><span className="subtle">{event.actor?.name ?? "System"} · {new Date(event.createdAt).toLocaleString()}</span></span></div>) : <div className="empty">No activity yet.</div>}</div></div>
    </>}
  </section></DashboardShell>;
}

function Metric({ label, value, href }: { label: string; value: number; href: string }) { return <a className="card metric-link" href={href}><div className="metric-label">{label}</div><div className="metric-value">{value.toLocaleString()}</div><div className="metric-note">View details →</div></a>; }
