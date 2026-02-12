import { env } from "@common/env";
import { drizzle } from "drizzle-orm/bun-sql";
import * as relations from "./relations";
import { table } from "./schema";

/**
 * Drizzle database client with Bun SQL native driver
 * Includes relational query support via db.query.*
 * @see https://orm.drizzle.team/docs/connect-bun-sql
 */
export const db = drizzle(env.DATABASE_URL, {
  schema: { ...table, ...relations },
});

export { table };
export { notDeleted, pagination } from "./helpers";

/** Transaction type derived from the db client — use instead of fragile Parameters<> extraction */
export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type { UserProgress } from "./schema";
