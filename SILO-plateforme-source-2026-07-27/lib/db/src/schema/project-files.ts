import {
  bigint,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const projectFilesTable = pgTable("project_files", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  name: text("name").notNull(),
  storageBucket: text("storage_bucket").notNull(),
  storagePath: text("storage_path").notNull(),
  mimeType: text("mime_type"),
  sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
  uploadedByUserId: text("uploaded_by_user_id").notNull(),
  sourceRole: text("source_role").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ProjectFile = typeof projectFilesTable.$inferSelect;
