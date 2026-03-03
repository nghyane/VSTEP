import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema/*.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  // Push-specific settings for development
  tablesFilter: ["!pg_stat_statements"],
  strict: true, // Warn before destructive changes
  verbose: true,
} satisfies Config;
