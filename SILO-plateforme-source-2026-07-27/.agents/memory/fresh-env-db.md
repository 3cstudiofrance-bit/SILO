---
name: Fresh task-env database is empty
description: Isolated task environments start with an empty Postgres — push schema and seed before e2e tests.
---

Isolated task environments get their own dev Postgres with no tables. Finance/e2e tests fail with "Failed query: insert into …" (HTTP 500) until you run:

- `pnpm --filter @workspace/db run push`
- `pnpm --filter @workspace/scripts run seed-finance` (if finance data is needed)

**Why:** API workflow starts fine even with missing tables; failures only surface at first query.
**How to apply:** Before any DB-backed e2e test in a fresh environment, verify tables exist (`psql "$DATABASE_URL" -c '\d <table>'`) and push/seed first.
