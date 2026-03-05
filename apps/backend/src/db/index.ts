import { env } from "@common/env";
import { drizzle } from "drizzle-orm/bun-sql";
import * as relations from "./relations";
import { table } from "./schema";

export const db = drizzle({
  connection: {
    url: env.DATABASE_URL,
    max: 10,
    idleTimeout: 30,
    // biome-ignore lint/style/useNamingConvention: PostgreSQL GUC parameter
    connection: { TimeZone: "Asia/Ho_Chi_Minh" },
  },
  schema: { ...table, ...relations },
});

export { table };
export { omitColumns, paginate, takeFirst, takeFirstOrThrow } from "./helpers";

export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type { UserProgress } from "./schema";
