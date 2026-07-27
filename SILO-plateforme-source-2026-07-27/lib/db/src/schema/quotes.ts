import { pgTable, serial, text, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const quotesTable = pgTable("quotes", {
  id: serial("id").primaryKey(),
  serviceType: text("service_type").notNull(), // mariage | clip | corporate | reseaux | autre
  status: text("status").notNull().default("en_attente"), // en_attente | envoye | accepte | refuse
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").notNull(),
  clientUserId: text("client_user_id"),
  advisorUserId: text("advisor_user_id"),
  workflowStatus: text("workflow_status").notNull().default("new"), // new | in_progress | waiting | follow_up | closed
  waitReason: text("wait_reason"),
  waitUntil: timestamp("wait_until"),
  followUpUntil: timestamp("follow_up_until"),
  reservedAt: timestamp("reserved_at"),
  lastTreatedAt: timestamp("last_treated_at"),
  closedAt: timestamp("closed_at"),
  details: text("details"),
  budget: text("budget"),
  amount: numeric("amount", { precision: 14, scale: 2, mode: "number" }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertQuoteSchema = createInsertSchema(quotesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = typeof quotesTable.$inferSelect;
