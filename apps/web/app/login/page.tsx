import Link from "next/link";
import { AuthForm } from "../../components/AuthForm";
export default function LoginPage() { return <main className="auth-page"><section className="auth-card"><div className="brand auth-brand">Social <span>Ops</span></div><div className="eyebrow">Secure workspace access</div><h1>Welcome back</h1><p className="subtle">Sign in to manage your social operations workspace.</p><AuthForm mode="login" /><p className="auth-switch">New to Social Ops? <Link href="/register">Create an account</Link></p></section></main>; }
