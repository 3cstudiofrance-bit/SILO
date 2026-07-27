import {
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const advisorsTable = pgTable("advisors", {
  userId: text("user_id").primaryKey(),
  displayName: text("display_name").notNull(),
  email: text("email").notNull(),
  status: text("status").notNull().default("active"),
  capacityLimit: integer("capacity_limit").notNull().default(80),
  warningThreshold: integer("warning_threshold").notNull().default(72),
  partnerPortfolioTarget: integer("partner_portfolio_target")
    .notNull()
    .default(50),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Advisor = typeof advisorsTable.$inferSelect;
