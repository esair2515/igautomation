import Link from "next/link";
import { AuthForm } from "../../components/AuthForm";
export default function RegisterPage() { return <main className="auth-page"><section className="auth-card"><div className="brand auth-brand">Social <span>Ops</span></div><div className="eyebrow">Start securely</div><h1>Create your workspace</h1><p className="subtle">Your account becomes the first owner of the new organization.</p><AuthForm mode="register" /><p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p></section></main>; }
