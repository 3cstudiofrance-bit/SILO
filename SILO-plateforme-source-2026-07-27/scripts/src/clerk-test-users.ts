/** Helpers Clerk pour les comptes de test (dev). */

function clerkKey(): string {
  const key = process.env.CLERK_SECRET_KEY;
  if (!key) throw new Error("CLERK_SECRET_KEY manquant");
  return key;
}

export async function getPartnerClerkId(): Promise<string> {
  const res = await fetch(
    "https://api.clerk.com/v1/users?email_address=3cstudiofrance%2Bagence%40gmail.com",
    { headers: { Authorization: `Bearer ${clerkKey()}` } },
  );
  if (!res.ok) throw new Error(`Clerk API ${res.status}`);
  const users = (await res.json()) as Array<{ id: string }>;
  if (!users.length) throw new Error("Compte partenaire de test introuvable dans Clerk");
  return users[0].id;
}

/** Compte client de test : créé s'il n'existe pas, rôle publicMetadata "client". */
export async function ensureClientClerkId(): Promise<string> {
  const email = "3cstudiofrance+client@gmail.com";
  const headers = { Authorization: `Bearer ${clerkKey()}`, "Content-Type": "application/json" };
  const res = await fetch(
    `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`,
    { headers },
  );
  if (!res.ok) throw new Error(`Clerk API ${res.status}`);
  const users = (await res.json()) as Array<{ id: string; public_metadata?: { role?: string } }>;
  if (users.length) {
    const u = users[0];
    if (u.public_metadata?.role !== "client") {
      await fetch(`https://api.clerk.com/v1/users/${u.id}/metadata`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ public_metadata: { role: "client" } }),
      });
    }
    return u.id;
  }
  const created = await fetch("https://api.clerk.com/v1/users", {
    method: "POST",
    headers,
    body: JSON.stringify({
      email_address: [email],
      public_metadata: { role: "client" },
      skip_password_requirement: true,
    }),
  });
  if (!created.ok) throw new Error(`Clerk création client ${created.status}`);
  return ((await created.json()) as { id: string }).id;
}

/** JWT de session réel pour un user Clerk (tests API sans navigateur). */
export async function mintSessionJwt(userId: string): Promise<string> {
  const headers = { Authorization: `Bearer ${clerkKey()}`, "Content-Type": "application/json" };
  const sessRes = await fetch("https://api.clerk.com/v1/sessions", {
    method: "POST",
    headers,
    body: JSON.stringify({ user_id: userId }),
  });
  if (!sessRes.ok) throw new Error(`Clerk création session ${sessRes.status}`);
  const session = (await sessRes.json()) as { id: string };
  const tokRes = await fetch(`https://api.clerk.com/v1/sessions/${session.id}/tokens`, {
    method: "POST",
    headers,
    body: JSON.stringify({ expires_in_seconds: 300 }),
  });
  if (!tokRes.ok) throw new Error(`Clerk création token ${tokRes.status}`);
  return ((await tokRes.json()) as { jwt: string }).jwt;
}
