import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const partnerReviewsTable = pgTable(
  "partner_reviews",
  {
    id: serial("id").primaryKey(),
    missionId: integer("mission_id").notNull(),
    projectId: integer("project_id").notNull(),
    clientUserId: text("client_user_id").notNull(),
    partnerId: text("partner_id").notNull(),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("partner_reviews_mission_key").on(table.missionId)],
);

export type PartnerReview = typeof partnerReviewsTable.$inferSelect;
