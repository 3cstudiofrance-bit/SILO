import { and, count, eq, inArray, notInArray } from "drizzle-orm";
import { db, projectsTable, quotesTable } from "@workspace/db";
import {
  advisorCapacityState,
  type AdvisorCapacityState,
} from "@workspace/domain";

const TERMINAL_PROJECT_STATUSES = ["termine", "annule"] as const;
type CapacityDatabase = Pick<typeof db, "select">;

export async function getAdvisorCapacity(
  advisorUserId: string,
  database: CapacityDatabase = db,
): Promise<AdvisorCapacityState> {
  const [projectRows, quoteRows] = await Promise.all([
    database
      .select({ value: count() })
      .from(projectsTable)
      .where(
        and(
          eq(projectsTable.advisorUserId, advisorUserId),
          notInArray(projectsTable.status, [...TERMINAL_PROJECT_STATUSES]),
        ),
      ),
    database
      .select({ value: count() })
      .from(quotesTable)
      .where(
        and(
          eq(quotesTable.advisorUserId, advisorUserId),
          inArray(quotesTable.status, ["en_attente", "envoye"]),
        ),
      ),
  ]);

  return advisorCapacityState(
    (projectRows[0]?.value ?? 0) + (quoteRows[0]?.value ?? 0),
  );
}
