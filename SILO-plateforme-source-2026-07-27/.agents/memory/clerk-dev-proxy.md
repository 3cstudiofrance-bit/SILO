---
name: Clerk dev proxy / publishableKey wiring
description: Why Clerk JS 404s in dev and the canonical ClerkProvider wiring to avoid it
---

# Clerk dev proxy & publishableKey

**Rule:** In the web artifact, wire ClerkProvider exactly per the clerk-auth skill:
- `clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL` (NOT hardcoded `${origin}/api/__clerk`). Empty in dev, auto-populated in prod.
- `clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)` from `@clerk/react/internal` (NOT the raw env var).

**Why:** The server-side `clerkProxyMiddleware` only runs when `NODE_ENV==="production"`; in dev it just calls `next()`, so any request to `/api/__clerk/...` 404s. If `proxyUrl` is hardcoded to the proxy path, Clerk JS tries to load `clerk.browser.js` through the dead proxy → `failed_to_load_clerk_js`, and every protected portal breaks. With `VITE_CLERK_PROXY_URL` empty in dev, Clerk loads directly from its CDN.

**How to apply:** If you see `Failed to load Clerk JS` + repeated 404s on `/api/__clerk/npm/@clerk/clerk-js@6/...`, check App.tsx for a hardcoded proxyUrl. `Clerk has been loaded with development keys` in console is the SUCCESS state, not an error — do not try to fix it.
