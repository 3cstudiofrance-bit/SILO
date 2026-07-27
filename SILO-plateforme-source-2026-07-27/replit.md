# Silo (silovisuel)

Plateforme SaaS de mise en relation audiovisuelle : connecte clients (entreprises, artistes, particuliers) avec des agences et professionnels partenaires, via un chef de projet Silo dédié. Design system bleu foncé/jaune, thème clair (8h–17h) / sombre (17h–8h) automatique avec bascule manuelle.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

- Feed unique et règles de communication : désormais côté serveur (tâche #15). Tables Drizzle `lib/db/src/schema/feed.ts` (feed_entries, comm_global, comm_project_settings). Matrice de visibilité par rôle et redaction (évaluation résumée pour l'agence) dans `artifacts/api-server/src/routes/feed.ts` ; règles comm dans `routes/comm.ts` + `lib/comm.ts` (admin : blocage global & autorisation, retrait ⇒ reset activation PM ; PM : activation). Client via hooks générés (`feed-data.ts` et `comm-settings.ts` = présentation/hooks seulement) ; mocks localStorage `silo:feed:additions`/`silo:comm-settings` supprimés. Pas de scoping membre-projet (suivi #20). Seed dev : `pnpm --filter @workspace/scripts run seed-feed`.
- Comm directe Client↔Agence : OFF par défaut ; l'admin autorise par projet, puis le PM active ; le blocage global admin prime sur tout ; retirer l'autorisation admin réinitialise l'activation PM.
- Espaces par rôle, finances et FRP (tâche #4) : répartition 70/20/10 sur HT, planchers devis 800/600 € HT, packs sociaux 690/1190/1990 € HT, parcours transaction 11 étapes (`components/shared/TransactionJourney.tsx`). Visibilité des montants par rôle : client = total seul, agence = sa part 70 % seule, Admin/PM = tout.
- Finances & feature flags côté serveur (tâche #8) : enforcement dans l'API. Source de vérité : `artifacts/api-server/src/lib/finance.ts` (split 70/20/10 calculé serveur, planchers, FRP seuil 24 tx/an), `routes/finance.ts` (réponses shaped par rôle ; POST /transactions admin/pm seulement, crédit FRP 10 % auto), `routes/feature-flags.ts` (globals/délégations admin-only, overrides PM si clé déléguée ; résolution user > project > subscription > role > global > défaut, sensibles OFF). Tables Drizzle dans `lib/db/src/schema/transactions.ts`. Rôles Clerk : toujours via `lib/roles.ts` (`getRoleAsync` — getAuth(req) + repli API Clerk). Le client lit via hooks générés ; les mocks localStorage `silo:feature-flags` et `frp-data.ts` sont supprimés. Seed dev : `pnpm --filter @workspace/scripts run seed-finance`.

## Comptes de test Clerk (dev)

- Trois comptes de test existent dans Clerk (rôles publicMetadata.role) : 3cstudiofrance+admin@gmail.com (admin), 3cstudiofrance@gmail.com (pm), 3cstudiofrance+agence@gmail.com (partner). Les trois arrivent dans la même boîte Gmail 3cstudiofrance@gmail.com (alias +). Les mots de passe ne sont pas stockés dans le dépôt — communiqués à l'utilisateur dans le chat ; réinitialisables via le dashboard Clerk si perdus. Attention : ces comptes/rôles peuvent être effacés sur l'instance dev — vérifier via l'API Clerk (`GET /v1/users`) et recréer/re-patcher les rôles avant tout test e2e role-gated.
- Clerk peut exiger une vérification email sur nouvel appareil ; les tests e2e utilisent la connexion programmatique (`testClerkAuth`).

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
