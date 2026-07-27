import {
  boolean,
  date,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Transactions financières Silo.
 * La répartition 70/20/10 est TOUJOURS calculée côté serveur sur le HT
 * (jamais fournie par le client) et stockée pour audit.
 */
export const transactionsTable = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id"),
    title: text("title").notNull(),
    clientUserId: text("client_user_id"),
    agencyId: text("agency_id").notNull(),
    agencyName: text("agency_name").notNull(),
    advisorUserId: text("advisor_user_id"),
    kind: text("kind").notNull(), // ponctuel | abonnement
    status: text("status").notNull().default("en_attente_paiement"),
    amountHt: numeric("amount_ht", {
      precision: 14,
      scale: 2,
      mode: "number",
    }).notNull(),
    tva: numeric("tva", {
      precision: 14,
      scale: 2,
      mode: "number",
    }).notNull(),
    ttc: numeric("ttc", {
      precision: 14,
      scale: 2,
      mode: "number",
    }).notNull(),
    partAgence: numeric("part_agence", {
      precision: 14,
      scale: 2,
      mode: "number",
    }).notNull(),
    partSilo: numeric("part_silo", {
      precision: 14,
      scale: 2,
      mode: "number",
    }).notNull(),
    partFrp: numeric("part_frp", {
      precision: 14,
      scale: 2,
      mode: "number",
    }).notNull(),
    fraisPspTotal: numeric("frais_psp_total", {
      precision: 14,
      scale: 2,
      mode: "number",
    })
      .notNull()
      .default(0),
    fraisPspAgence: numeric("frais_psp_agence", {
      precision: 14,
      scale: 2,
      mode: "number",
    })
      .notNull()
      .default(0),
    fraisPspSilo: numeric("frais_psp_silo", {
      precision: 14,
      scale: 2,
      mode: "number",
    })
      .notNull()
      .default(0),
    partAgenceApresPsp: numeric("part_agence_apres_psp", {
      precision: 14,
      scale: 2,
      mode: "number",
    })
      .notNull()
      .default(0),
    partSiloApresPsp: numeric("part_silo_apres_psp", {
      precision: 14,
      scale: 2,
      mode: "number",
    })
      .notNull()
      .default(0),
    reserveIncidents: numeric("reserve_incidents", {
      precision: 14,
      scale: 2,
      mode: "number",
    })
      .notNull()
      .default(0),
    primeConseiller: numeric("prime_conseiller", {
      precision: 14,
      scale: 2,
      mode: "number",
    })
      .notNull()
      .default(0),
    contributionSiloApresVariables: numeric(
      "contribution_silo_apres_variables",
      {
        precision: 14,
        scale: 2,
        mode: "number",
      },
    )
      .notNull()
      .default(0),
    calculationVersion: text("calculation_version")
      .notNull()
      .default("bp-2026-07-25-v1"),
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    paidAt: timestamp("paid_at"),
    date: date("date").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("transactions_stripe_checkout_session_key").on(
      table.stripeCheckoutSessionId,
    ),
    uniqueIndex("transactions_stripe_payment_intent_key").on(
      table.stripePaymentIntentId,
    ),
  ],
);

export const insertTransactionSchema = createInsertSchema(
  transactionsTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;

/** Mouvements du Fonds de Réinvestissement Partenaire (10 % du HT). */
export const frpMovementsTable = pgTable("frp_movements", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id"),
  agencyId: text("agency_id").notNull(),
  agencyName: text("agency_name").notNull(),
  date: date("date").notNull(),
  label: text("label").notNull(),
  projectTitle: text("project_title"),
  type: text("type").notNull(), // credit | reversement | reinvestissement
  amount: numeric("amount", {
    precision: 14,
    scale: 2,
    mode: "number",
  }).notNull(), // positif = crédit, négatif = sortie
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type FrpMovement = typeof frpMovementsTable.$inferSelect;

/** Activation globale des fonctionnalités (CDC §14) — admin uniquement. */
export const featureFlagGlobalsTable = pgTable("feature_flag_globals", {
  featureKey: text("feature_key").primaryKey(),
  enabled: boolean("enabled").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** Overrides ciblés (rôle, utilisateur, projet, abonnement). */
export const featureFlagOverridesTable = pgTable("feature_flag_overrides", {
  id: serial("id").primaryKey(),
  featureKey: text("feature_key").notNull(),
  scope: text("scope").notNull(), // global | role | user | project | subscription
  target: text("target").notNull().default(""),
  enabled: boolean("enabled").notNull(),
  createdBy: text("created_by").notNull(), // admin | pm
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type FeatureFlagOverride = typeof featureFlagOverridesTable.$inferSelect;

/** Clés déléguées par l'admin au PM. */
export const featureFlagDelegationsTable = pgTable("feature_flag_delegations", {
  featureKey: text("feature_key").primaryKey(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
