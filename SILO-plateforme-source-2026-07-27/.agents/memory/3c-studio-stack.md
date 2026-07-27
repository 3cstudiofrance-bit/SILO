---
name: 3C Studio stack
description: Architecture overview for the 3C Studio audiovisual platform
---

Single react-vite artifact at `/` (artifact id: `artifacts/3c-studio`). API server at `artifacts/api-server` serving under `/api`.

**Public site routes:** `/`, `/services`, `/tarifs`, `/contact`

**Client portal routes:** `/dashboard`, `/dashboard/projets`, `/dashboard/projets/:id`, `/dashboard/devis`, `/dashboard/devis/:id`

**Admin routes:** `/admin`, `/admin/projets`, `/admin/projets/:id`, `/admin/devis`

**Auth:** Clerk (Replit-managed, app `app_3Fs9zU44Y6EBC88vQs3aqwN05E0`). Admin check: `user?.publicMetadata?.role === "admin"` on frontend, `req.auth?.sessionClaims?.metadata?.role === "admin"` on backend.

**DB tables:** projects, quotes, deliverables, contacts, activity (5 tables, all migrated).

**Key files:**
- Frontend entry: `artifacts/3c-studio/src/App.tsx`
- API routes: `artifacts/api-server/src/routes/` (contacts, projects, deliverables, quotes, dashboard)
- DB schema: `lib/db/src/schema/index.ts`
- Generated hooks: `lib/api-client-react/src/generated/api.ts`

**Theme:** Dark, crimson red primary `hsl(348 83% 47%)`, Inter + Playfair Display fonts.
