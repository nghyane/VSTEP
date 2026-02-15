import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * Type-safe environment variables with runtime validation.
 * 2026 Stack: Bun auto-loads .env files, no dotenv needed.
 * @see https://env.t3.gg/docs/core
 */
export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z
      .string()
      .regex(/^\s*\d+\s*[smhd]\s*$/i, "Must be a duration like 15m, 1h, 7d")
      .default("15m"),
    JWT_REFRESH_EXPIRES_IN: z
      .string()
      .regex(/^\s*\d+\s*[smhd]\s*$/i, "Must be a duration like 15m, 1h, 7d")
      .default("7d"),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
    ALLOWED_ORIGINS: z.string().optional(),
    REDIS_URL: z.url().optional(),
  },
  runtimeEnv: Bun.env,
  skipValidation: !!Bun.env.CI,
  emptyStringAsUndefined: true,
});
