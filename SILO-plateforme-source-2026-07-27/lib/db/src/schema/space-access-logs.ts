import {
  index,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const spaceAccessLogsTable = pgTable(
  "space_access_logs",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    userEmail: text("user_email"),
    userName: text("user_name"),
    role: text("role").notNull(),
    space: text("space").notNull(),
    path: text("path").notNull(),
    accessedAt: timestamp("accessed_at").notNull().defaultNow(),
  },
  (table) => [
    index("space_access_logs_user_idx").on(table.userId),
    index("space_access_logs_accessed_at_idx").on(table.accessedAt),
  ],
);

export type SpaceAccessLog = typeof spaceAccessLogsTable.$inferSelect;
