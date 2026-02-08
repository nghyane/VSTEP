import { UserRole } from "@common/enums";
import { t } from "elysia";

export const UserSchema = t.Object({
  id: t.String({ format: "uuid" }),
  email: t.String(),
  fullName: t.Nullable(t.String()),
  role: UserRole,
  createdAt: t.String({ format: "date-time" }),
  updatedAt: t.String({ format: "date-time" }),
});

export const UserCreateBody = t.Object({
  email: t.String({
    format: "email",
    error: "Valid email is required",
  }),
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
  currentPassword: t.String(),
  newPassword: t.String({
    minLength: 8,
    error: "New password must be at least 8 characters",
  }),
});

export const UserListQuery = t.Object({
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
  role: t.Optional(UserRole),
  search: t.Optional(t.String()),
});

export type UserSchema = typeof UserSchema.static;
export type UserCreateBody = typeof UserCreateBody.static;
export type UserUpdateBody = typeof UserUpdateBody.static;
export type UserPasswordBody = typeof UserPasswordBody.static;
export type UserListQuery = typeof UserListQuery.static;
