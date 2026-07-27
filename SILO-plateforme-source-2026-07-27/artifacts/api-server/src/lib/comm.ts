import { eq } from "drizzle-orm";
import { db, commGlobalTable, commProjectSettingsTable, type CommProjectSettingsRow } from "@workspace/db";

/**
 * Règles de communication directe Client↔Agence (CDC) :
 * - OFF par défaut ;
 * - l'admin autorise par projet, puis le PM active ;
 * - le blocage global admin prime sur tout ;
 * - retirer l'autorisation admin réinitialise l'activation PM.
 */

export async function getGlobalBlock(): Promise<boolean> {
  const [row] = await db.select().from(commGlobalTable).where(eq(commGlobalTable.id, "global"));
  return row?.blocageGlobal ?? false;
}

export async function setGlobalBlock(blocked: boolean): Promise<void> {
  await db
    .insert(commGlobalTable)
    .values({ id: "global", blocageGlobal: blocked, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: commGlobalTable.id,
      set: { blocageGlobal: blocked, updatedAt: new Date() },
    });
}

export async function getProjectSettings(projectId: string): Promise<{ adminAutorisePm: boolean; activeParPm: boolean }> {
  const [row] = await db
    .select()
    .from(commProjectSettingsTable)
    .where(eq(commProjectSettingsTable.projectId, projectId));
  return { adminAutorisePm: row?.adminAutorisePm ?? false, activeParPm: row?.activeParPm ?? false };
}

export async function listProjectSettings(): Promise<CommProjectSettingsRow[]> {
  return db.select().from(commProjectSettingsTable);
}

/** La communication directe est-elle effective sur ce projet ? */
export async function isDirectEnabled(projectId: string): Promise<boolean> {
  if (await getGlobalBlock()) return false;
  const s = await getProjectSettings(projectId);
  return s.adminAutorisePm && s.activeParPm;
}

export async function upsertProjectSettings(
  projectId: string,
  values: { adminAutorisePm: boolean; activeParPm: boolean },
): Promise<void> {
  await db
    .insert(commProjectSettingsTable)
    .values({ projectId, ...values, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: commProjectSettingsTable.projectId,
      set: { ...values, updatedAt: new Date() },
    });
}
