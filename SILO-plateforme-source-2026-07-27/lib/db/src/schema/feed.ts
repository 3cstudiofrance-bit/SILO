import { pgTable, serial, integer, text, timestamp, real, boolean } from "drizzle-orm/pg-core";

/**
 * Feed unique par projet (CDC) — entrées persistées côté serveur.
 * La matrice de visibilité par rôle est appliquée dans l'API (routes/feed.ts),
 * jamais côté client.
 */
export const feedEntriesTable = pgTable("feed_entries", {
  id: serial("id").primaryKey(),
  projectId: text("project_id").notNull(),
  // message | audio | fichier | evenement | note_suivi | note_sensible |
  // escalade_agence_pm | escalade_pm_admin | evaluation | score | appel | validation
  type: text("type").notNull(),
  // client_pm | pm_agency | client_agency (messages / audio / appels)
  channel: text("channel"),
  authorName: text("author_name").notNull(),
  authorRole: text("author_role").notNull(), // client | pm | agency | admin
  authorUserId: text("author_user_id"),
  // Identité Clerk de l'agence ciblée pour les canaux impliquant un partenaire.
  counterpartyUserId: text("counterparty_user_id"),
  recipient: text("recipient"),
  content: text("content").notNull(),
  status: text("status"),
  attachmentName: text("attachment_name"),
  attachmentSize: text("attachment_size"),
  attachmentKind: text("attachment_kind"), // video | image | audio | document
  durationSec: integer("duration_sec"),
  scoreValue: real("score_value"),
  internal: boolean("internal").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type FeedEntryRow = typeof feedEntriesTable.$inferSelect;
export type InsertFeedEntry = typeof feedEntriesTable.$inferInsert;

/** Blocage global admin de la communication directe Client↔Agence (prime sur tout). */
export const commGlobalTable = pgTable("comm_global", {
  id: text("id").primaryKey().default("global"),
  blocageGlobal: boolean("blocage_global").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Réglage par projet : l'admin autorise le PM, puis le PM active.
 * OFF par défaut ; retirer l'autorisation admin réinitialise l'activation PM.
 */
export const commProjectSettingsTable = pgTable("comm_project_settings", {
  projectId: text("project_id").primaryKey(),
  adminAutorisePm: boolean("admin_autorise_pm").notNull().default(false),
  activeParPm: boolean("active_par_pm").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type CommProjectSettingsRow = typeof commProjectSettingsTable.$inferSelect;
