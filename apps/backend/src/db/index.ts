import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "../common/env";
import { schema } from "./schema/all";

const client = postgres(config.DATABASE_URL);

export const db = drizzle(client, { schema });

// Export schema for direct access
export { schema };

// Export types
export type * from "./schema/index";
