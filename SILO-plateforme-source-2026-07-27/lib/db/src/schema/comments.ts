import { pgTable, serial, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const commentsTable = pgTable("comments", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  userId: text("user_id").notNull(),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull().default("comment"), // comment | correction
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCommentSchema = createInsertSchema(commentsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof commentsTable.$inferSelect;
