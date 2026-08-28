"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../lib/api";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter(); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setLoading(true); setError(""); const form = new FormData(event.currentTarget); const payload = Object.fromEntries(form.entries()); try { await apiFetch(`/api/auth/${mode}`, { method: "POST", body: JSON.stringify(payload) }); router.push("/dashboard"); router.refresh(); } catch (e) { setError(e instanceof Error ? e.message : "Unable to continue"); } finally { setLoading(false); } }
  return <form className="auth-form" onSubmit={submit}>{mode === "register" && <label>Name<input name="name" required minLength={2} autoComplete="name" /></label>}<label>Email<input name="email" type="email" required autoComplete="email" /></label><label>Password<input name="password" type="password" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>{mode === "register" && <label>Workspace name <span className="subtle">(optional)</span><input name="organizationName" minLength={2} /></label>}{error && <div className="form-error" role="alert">{error}</div>}<button className="button" disabled={loading}>{loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create workspace"}</button></form>;
}
