import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const deliverablesTable = pgTable("deliverables", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  type: text("type").notNull().default("video"), // video | photo | audio | document | autre
  size: text("size"),
  status: text("status").notNull().default("pending_review"), // pending_review | approved | changes_requested
  version: integer("version").notNull().default(1),
  submittedByUserId: text("submitted_by_user_id"),
  reviewedByUserId: text("reviewed_by_user_id"),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  clientStatus: text("client_status").notNull().default("pending"), // pending | approved | changes_requested
  clientReviewedByUserId: text("client_reviewed_by_user_id"),
  clientReviewedAt: timestamp("client_reviewed_at"),
  clientReviewNotes: text("client_review_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDeliverableSchema = createInsertSchema(
  deliverablesTable,
).omit({ id: true, createdAt: true });
export type InsertDeliverable = z.infer<typeof insertDeliverableSchema>;
export type Deliverable = typeof deliverablesTable.$inferSelect;
