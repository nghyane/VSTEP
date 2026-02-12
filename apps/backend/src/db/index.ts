import { env } from "@common/env";
import { drizzle } from "drizzle-orm/bun-sql";
import * as relations from "./relations";
import { table } from "./schema";

export const db = drizzle(env.DATABASE_URL, {
  schema: { ...table, ...relations },
});

export { table };
export { notDeleted, omitColumns, paginated } from "./helpers";

export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type { UserProgress } from "./schema";
