---
name: Clerk proxy dev vs prod
description: The Clerk proxy path /api/__clerk only activates in production
---

The `clerkProxyMiddleware` mounted at `/api/__clerk` only activates when running in production (deployed on a custom domain / replit.app). In development it's a no-op and the browser connects to Clerk's frontend API directly.

**Why:** Clerk's proxy logic checks for production environment before forwarding.

**How to apply:** Browser console `ERR_CONNECTION_REFUSED` errors from Clerk during local development are expected and harmless — they're Clerk failing to reach its dev instance endpoints. This does not indicate a broken app. Do not try to "fix" these in dev.

The `clerkProxyUrl` in the frontend should be set to `${window.location.origin}/api/__clerk` at runtime (not via env var) so it adapts to both dev and prod domains automatically.
