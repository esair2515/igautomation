# Security

Authentication uses bcrypt password hashing, random session tokens stored only as SHA-256 hashes, and HTTP-only cookies with `SameSite=Lax`, `Secure` in production, and a 14-day expiry. Every protected endpoint loads the session and verifies the active organization membership; role checks are server-side and use the membership role rather than frontend state. Login and registration have IP-based rate limits, all request bodies are Zod-validated, and authentication/team actions write audit records.

The frontend middleware only improves navigation by redirecting requests without a session cookie. It is not a security boundary; the API remains authoritative. Before production, add a distributed rate limiter for multi-instance deployments and deploy a CSRF strategy appropriate to the chosen frontend/API origin.
