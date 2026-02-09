import { timestamp, uuid } from "drizzle-orm/pg-core";

/** Standard primary key column */
export const id = uuid("id").primaryKey().defaultRandom();

/** Timestamp config shared across all timestamp columns */
const tsConfig = { withTimezone: true, mode: "string" } as const;

/** Standard createdAt column */
export const createdAt = timestamp("created_at", tsConfig)
  .defaultNow()
  .notNull();

/** Standard updatedAt column with auto-update */
export const updatedAt = timestamp("updated_at", tsConfig)
  .defaultNow()
  .notNull()
  .$onUpdate(() => new Date().toISOString());

/** Standard soft-delete column */
export const deletedAt = timestamp("deleted_at", tsConfig);

/** Spread into pgTable for standard id + timestamp columns */
export const timestamps = { createdAt, updatedAt } as const;

/** Spread into pgTable for standard id + timestamp + soft-delete columns */
export const timestampsWithSoftDelete = {
  createdAt,
  updatedAt,
  deletedAt,
} as const;
