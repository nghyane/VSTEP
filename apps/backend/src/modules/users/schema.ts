import { UserRole } from "@db/enums";
import { users } from "@db/schema";
import { getTableColumns } from "drizzle-orm";
import { createSelectSchema } from "drizzle-typebox";
import { t } from "elysia";

/** Drizzle select columns (no passwordHash/deletedAt) for .select()/.returning() */
const { passwordHash: _, deletedAt: __, ...columns } = getTableColumns(users);
export const USER_COLUMNS = columns;

/** Response schema — derived from Drizzle table, omit internal fields */
const UserRow = createSelectSchema(users);
export const User = t.Omit(UserRow, ["passwordHash", "deletedAt"]);
export type User = typeof User.static;

// ── Request schemas ──────────────────────────────────────────────────
// Manual: `password` (API) ≠ `passwordHash` (DB) — cannot derive from createInsertSchema

export const UserCreateBody = t.Object({
  email: t.String({ format: "email", error: "Valid email is required" }),
  password: t.String({
    minLength: 8,
    error: "Password must be at least 8 characters",
  }),
  fullName: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  role: t.Optional(UserRole),
});

export const UserUpdateBody = t.Partial(
  t.Object({
    email: t.String({ format: "email" }),
    fullName: t.Optional(
      t.Nullable(t.String({ minLength: 1, maxLength: 100 })),
    ),
    role: UserRole,
  }),
);

export const UserPasswordBody = t.Object({
  currentPassword: t.String({ minLength: 1 }),
  newPassword: t.String({
    minLength: 8,
    error: "New password must be at least 8 characters",
  }),
});

export const UserListQuery = t.Object({
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
  search: t.Optional(t.String({ maxLength: 255 })),
  role: t.Optional(UserRole),
});

export type UserCreateBody = typeof UserCreateBody.static;
export type UserUpdateBody = typeof UserUpdateBody.static;
export type UserPasswordBody = typeof UserPasswordBody.static;
export type UserListQuery = typeof UserListQuery.static;
