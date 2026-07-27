/**
 * test-admin-access — vérifie que le compte admin peut accéder aux 4 espaces API.
 * Ne lit ni n'imprime aucun identifiant sensible.
 * Run: pnpm --filter @workspace/scripts run test-admin-access
 */
import { mintSessionJwt } from "./clerk-test-users";

const BASE   = "http://localhost:80";
const CLERK_SK = process.env.CLERK_SECRET_KEY ?? "";

let passed = 0; let failed = 0;
function ok(label: string, status: number) { console.log(`  ✓  ${label} (${status})`); passed++; }
function ko(label: string, detail: string)  { console.error(`  ✗  ${label}: ${detail}`); failed++; }

async function adminId(): Promise<string> {
  const r = await fetch(
    "https://api.clerk.com/v1/users?email_address=3cstudiofrance@gmail.com",
    { headers: { Authorization: `Bearer ${CLERK_SK}` } }
  );
  const users = (await r.json()) as Array<Record<string, unknown>>;
  const u = users.find((x: any) =>
    Array.isArray(x.email_addresses) &&
    x.email_addresses.some((e: any) => e.email_address === "3cstudiofrance@gmail.com")
  );
  if (!u) throw new Error("admin non trouvé");
  if ((u as any).public_metadata?.role !== "admin") throw new Error(`rôle inattendu: ${(u as any).public_metadata?.role}`);
  return u.id as string; // jamais imprimé
}

async function hit(method: string, path: string, token: string, body?: unknown) {
  const opts: RequestInit = {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    redirect: "manual",
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  return fetch(`${BASE}${path}`, opts);
}

(async () => {
  console.log("\n═══ Tests admin → espaces API ═══\n");

  const id    = await adminId();
  const token = await mintSessionJwt(id);

  // Espace Client — transactions lisibles par l'admin
  let r = await hit("GET", "/api/transactions", token);
  r.status === 200 ? ok("admin → GET /api/transactions (espace Client)", r.status)
                   : ko("admin → GET /api/transactions", `${r.status}`);

  // Espace PM — projets
  r = await hit("GET", "/api/projects", token);
  r.status === 200 ? ok("admin → GET /api/projects (espace PM)", r.status)
                   : ko("admin → GET /api/projects", `${r.status}`);

  // Espace Partenaire — comptes FRP scoped
  r = await hit("GET", "/api/frp/accounts", token);
  r.status === 200 ? ok("admin → GET /api/frp/accounts (espace Partenaire/Admin)", r.status)
                   : ko("admin → GET /api/frp/accounts", `${r.status}`);

  // Espace Admin — feature-flags + création de transaction
  r = await hit("PUT", "/api/feature-flags/global/messagerie_client_pm", token, { enabled: true });
  r.status === 200 ? ok("admin → PUT /api/feature-flags (espace Admin)", r.status)
                   : ko("admin → PUT /api/feature-flags", `${r.status}`);

  r = await hit("POST", "/api/transactions", token, {
    agencyId: "test", agencyName: "TestAgence", title: "Vérif admin promo",
    amountHt: 1000, date: "2025-01-01", kind: "ponctuel",
  });
  (r.status === 201 || r.status === 200) ? ok("admin → POST /api/transactions (espace Admin)", r.status)
                                         : ko("admin → POST /api/transactions", `${r.status}`);

  // mouvements FRP
  r = await hit("GET", "/api/frp/movements", token);
  r.status === 200 ? ok("admin → GET /api/frp/movements", r.status)
                   : ko("admin → GET /api/frp/movements", `${r.status}`);

  console.log(`\n─── Résultat : ${passed} réussis, ${failed} échecs ───\n`);
  if (failed > 0) process.exit(1);
})();
