import { pgTable, serial, integer, text, timestamp, real, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const partnerMissionsTable = pgTable("partner_missions", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id"),
  partnerId: text("partner_id").notNull(),
  partnerName: text("partner_name").notNull(),
  title: text("title").notNull(),
  brief: text("brief"),
  status: text("status").notNull().default("en_attente"), // en_attente | accepte | en_cours | livre | valide | refuse
  dueDate: text("due_date"),
  rating: real("rating"),
  notes: text("notes"),
  amount: numeric("amount", { precision: 14, scale: 2, mode: "number" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPartnerMissionSchema = createInsertSchema(partnerMissionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPartnerMission = z.infer<typeof insertPartnerMissionSchema>;
export type PartnerMission = typeof partnerMissionsTable.$inferSelect;
