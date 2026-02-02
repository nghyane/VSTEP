import { env } from "node:process";

const envSchema = {
  DATABASE_URL: env.DATABASE_URL ?? "",
  PORT: parseInt(env.PORT ?? "3000", 10),
  NODE_ENV: (env.NODE_ENV ?? "development") as
    | "development"
    | "production"
    | "test",
};

export const config = {
  DATABASE_URL: envSchema.DATABASE_URL,
  PORT: envSchema.PORT,
  NODE_ENV: envSchema.NODE_ENV,
};

export type EnvConfig = typeof config;
