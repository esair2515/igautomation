"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardShell } from "../../components/DashboardShell";
import { apiFetch } from "../../lib/api";

type Event = { id: string; contentId: string; title: string; type: string; caption: string | null; account: { username: string }; scheduledFor: string; status: string; failureReason: string | null };

export default function CalendarPage() {
  const [cursor, setCursor] = useState(new Date()); const [events, setEvents] = useState<Event[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1); const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59);
  const load = useCallback(async () => { setLoading(true); setError(""); try { const result = await apiFetch<{ data: Event[] }>(`/api/calendar?from=${first.toISOString()}&to=${last.toISOString()}`); setEvents(result.data); } catch (e) { setError(e instanceof Error ? e.message : "Unable to load calendar"); } finally { setLoading(false); } }, [cursor]);
  useEffect(() => { load(); }, [load]);
  const days = useMemo(() => Array.from({ length: last.getDate() }, (_, index) => new Date(cursor.getFullYear(), cursor.getMonth(), index + 1)), [cursor]);
  return <DashboardShell><section className="content"><div className="header-row"><div><div className="eyebrow">Publishing calendar</div><h1>Calendar</h1><p className="subtle">Scheduled, publishing, published, failed, and canceled posts for this workspace.</p></div><div className="editor-actions"><button className="button secondary" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>Previous</button><strong className="calendar-month">{cursor.toLocaleString(undefined, { month: "long", year: "numeric" })}</strong><button className="button secondary" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>Next</button></div></div>{error && <div className="notice error-notice" role="alert">{error}<button className="text-button" onClick={load}>Retry</button></div>}{loading ? <div className="card empty">Loading calendar…</div> : <div className="calendar-grid">{days.map((day) => { const dayEvents = events.filter((event) => new Date(event.scheduledFor).toDateString() === day.toDateString()); return <div className="calendar-day card" key={day.toISOString()}><strong>{day.getDate()}</strong>{dayEvents.map((event) => <a className={`calendar-event event-${event.status.toLowerCase()}`} href={`/content/${event.contentId}`} key={event.id}><b>@{event.account.username}</b><span>{event.title}</span><small>{event.status} · {new Date(event.scheduledFor).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</small>{event.failureReason && <small className="table-error">{event.failureReason}</small>}</a>)}</div>; })}</div>}</section></DashboardShell>;
}
