import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * Type-safe environment variables with runtime validation.
 * 2026 Stack: Bun auto-loads .env files, no dotenv needed.
 * @see https://env.t3.gg/docs/core
 */
export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    PORT: z.string().default("3000"),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.string().default("7d"),
    REDIS_URL: z.string().url().optional(),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.CI,
  emptyStringAsUndefined: true,
});
