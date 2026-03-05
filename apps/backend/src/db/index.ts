import { env } from "@common/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as relations from "./relations";
import { table } from "./schema";

const client = postgres(env.DATABASE_URL, {
	max: 10,
	idle_timeout: 30,
	connection: { TimeZone: "Asia/Ho_Chi_Minh" },
});

export const db = drizzle(client, {
	schema: { ...table, ...relations },
});

export { table };
export { omitColumns, paginate, takeFirst, takeFirstOrThrow } from "./helpers";

export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type { UserProgress } from "./schema";