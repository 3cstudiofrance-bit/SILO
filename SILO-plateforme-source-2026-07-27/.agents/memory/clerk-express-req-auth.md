---
name: Clerk Express req.auth is a function
description: In @clerk/express v2+, req.auth is a branded function, not an object — use getAuth(req).
---

In @clerk/express v2+, `clerkMiddleware` attaches `req.auth` as a **branded function** (`(opts) => AuthObject`), not a plain auth object. Code doing `req.auth?.userId` or `req.auth.sessionClaims` fails typecheck AND silently returns `undefined` at runtime (auth/role checks break).

**How to apply:** Always use `getAuth(req)` from `@clerk/express` in route handlers. In this repo, use the shared helper `getAuthInfo(req)` (api-server `src/lib/auth.ts`) which also extracts the role from `sessionClaims.metadata.role` / `publicMetadata.role`.

Also: Orval-generated Zod bodies coerce `format: date` fields to `Date`, but Drizzle `date()` columns (string mode) expect `YYYY-MM-DD` strings — convert with `.toISOString().slice(0, 10)` before insert.
