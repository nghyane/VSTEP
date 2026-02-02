import type { Config } from "drizzle-kit";

/**
 * Drizzle Kit Configuration
 * Using 'push' mode for development (schema changes frequently during capstone)
 * Switch to 'generate' + 'migrate' when schema stabilizes
 *
 * Note: drizzle-kit runs in Node.js context, not Bun
 * Use 'bunx tsx node_modules/.bin/drizzle-kit push' to run with Bun compatibility
 */
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
