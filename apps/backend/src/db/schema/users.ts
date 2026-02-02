import { sql } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "learner",
  "instructor",
  "admin",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    fullName: varchar("full_name", { length: 255 }),
    role: userRoleEnum("role").default("learner").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    emailUnique: uniqueIndex("users_email_unique")
      .on(table.email)
      .where(sql`${table.deletedAt} IS NULL`),
    roleIdx: index("users_role_idx").on(table.role),
    activeIdx: index("users_active_idx")
      .on(table.id)
      .where(sql`${table.deletedAt} IS NULL`),
  }),
);

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    jti: varchar("jti", { length: 36 }).notNull(),
    replacedByJti: varchar("replaced_by_jti", { length: 36 }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    tokenHashIdx: index("refresh_tokens_hash_idx").on(table.tokenHash),
    userIdIdx: index("refresh_tokens_user_id_idx").on(table.userId),
    activeIdx: index("refresh_tokens_active_idx")
      .on(table.userId)
      .where(sql`${table.revokedAt} IS NULL`),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;
