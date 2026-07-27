---
name: Clerk Express auth access
description: How to read auth/role on the API server with @clerk/express v2
---

Rule: on the Express API server, never read `(req as any).auth?.…` — in `@clerk/express` v2 `req.auth` is not a plain object and this silently yields `undefined` (userId null, role falls back to "client", admin gets 403). Use `getAuth(req)` from `@clerk/express`.

**Why:** cost hours of debugging — `requireAuth()` passed but role checks failed for real admins; symptoms look like a role/metadata problem when it's an accessor problem.

**How to apply:** use the shared helpers in the api-server roles lib (`getRoleAsync`, `getUserId`) which wrap `getAuth(req)`. Also note: the Clerk session token doesn't always embed `publicMetadata.role`; `getRoleAsync` falls back to the Clerk Users API with a 60s in-memory cache. Older routes still reading `req.auth?.sessionClaims` directly are suspect.
