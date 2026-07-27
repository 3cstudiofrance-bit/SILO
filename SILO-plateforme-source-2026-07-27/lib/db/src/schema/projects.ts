import { pgTable, serial, text, timestamp, numeric, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // mariage | clip | corporate | reseaux
  status: text("status").notNull().default("lead"), // lead | devis | production | post_production | livraison | termine | annule
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").notNull(),
  clientUserId: text("client_user_id"),
  advisorUserId: text("advisor_user_id"),
  description: text("description"),
  amount: numeric("amount", { precision: 14, scale: 2, mode: "number" }),
  shootingDate: date("shooting_date"),
  deliveryDate: date("delivery_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;
