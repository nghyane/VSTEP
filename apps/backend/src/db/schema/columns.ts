import { timestamp } from "drizzle-orm/pg-core";

const tsConfig = { withTimezone: true, mode: "string" } as const;

export const createdAt = timestamp("created_at", tsConfig)
  .defaultNow()
  .notNull();

export const updatedAt = timestamp("updated_at", tsConfig)
  .defaultNow()
  .notNull()
  .$onUpdate(() => new Date().toISOString());

export const deletedAt = timestamp("deleted_at", tsConfig);

export const timestamps = { createdAt, updatedAt } as const;

export const timestampsWithSoftDelete = {
  createdAt,
  updatedAt,
  deletedAt,
} as const;
