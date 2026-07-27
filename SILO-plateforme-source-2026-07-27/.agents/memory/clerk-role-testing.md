---
name: Testing role-gated Clerk pages
description: How to e2e-test routes that require a Clerk publicMetadata.role (pm/admin/partner).
---

The rule: the Playwright testing subagent (`runTest` with `testClerkAuth: true`) can sign in arbitrary users but cannot set `publicMetadata`, so role-gated routes redirect to /dashboard.

**Why:** roles live in Clerk publicMetadata, only settable server-side; the sign-in helper has no metadata parameter and no app table stores roles.

**How to apply:** before the test, create or patch a fixed test user via the Clerk backend API using `$CLERK_SECRET_KEY` (present even though not shown in the secrets list):
`POST https://api.clerk.com/v1/users` with `{"email_address":["pm.claire.test@silovisuel.fr"],"public_metadata":{"role":"pm"},"skip_password_requirement":true}` (or `PATCH /v1/users/<id>/metadata` if it exists). Then instruct the test plan to sign in as that EXACT existing email.

**Gotcha:** test users and their publicMetadata can silently disappear or be wiped between sessions (dev Clerk instance). ALWAYS verify roles via `GET /v1/users?email_address=…` right before running a role-gated test, and recreate/patch as needed. Test users: admin.test@silovisuel.fr (admin), pm.claire.test@silovisuel.fr (pm), agence.test@silovisuel.fr (partner), 3cstudiofrance+client@gmail.com (client).

**API-only e2e (no browser):** mint a real session JWT server-side — `POST /v1/sessions {user_id}` then `POST /v1/sessions/{id}/tokens {"expires_in_seconds":300}` — and curl the API with `Authorization: Bearer <jwt>` through the proxy (`localhost:80/api/...`). Much faster than Playwright for pure API role checks.
