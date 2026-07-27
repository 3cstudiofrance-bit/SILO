import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Journal minimal des webhooks verifies.
 *
 * Les contenus SMS, numeros et payloads bruts ne sont volontairement pas
 * stockes ici. Le journal sert a l'idempotence et a l'audit technique.
 */
export const webhookEventsTable = pgTable(
  "webhook_events",
  {
    id: serial("id").primaryKey(),
    provider: text("provider").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    externalId: text("external_id").notNull(),
    eventType: text("event_type").notNull(),
    status: text("status"),
    errorCode: text("error_code"),
    projectId: integer("project_id"),
    receivedAt: timestamp("received_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("webhook_events_provider_idempotency_key").on(
      table.provider,
      table.idempotencyKey,
    ),
  ],
);

export type WebhookEvent = typeof webhookEventsTable.$inferSelect;
