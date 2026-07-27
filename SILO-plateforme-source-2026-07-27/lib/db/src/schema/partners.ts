import {
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const partnersTable = pgTable(
  "partners",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    kind: text("kind").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    city: text("city"),
    specialties: jsonb("specialties")
      .$type<string[]>()
      .notNull()
      .default([]),
    portfolioUrl: text("portfolio_url"),
    status: text("status").notNull().default("pending"),
    advisorUserId: text("advisor_user_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("partners_user_id_key").on(table.userId),
  ],
);

export type Partner = typeof partnersTable.$inferSelect;
