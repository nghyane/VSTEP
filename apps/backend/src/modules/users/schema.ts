import { PaginationQuery, SearchFilter } from "@common/schemas";
import { UserRole } from "@db/enums";
import { userView } from "@db/views";
import { t } from "elysia";

export const User = userView.schema;
export type User = typeof User.static;

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
  currentPassword: t.String({ minLength: 1 }),
  newPassword: t.String({
    minLength: 8,
    error: "New password must be at least 8 characters",
  }),
});

export const UserListQuery = t.Composite([
  PaginationQuery,
  SearchFilter,
  t.Object({
    role: t.Optional(UserRole),
  }),
]);

export type UserCreateBody = typeof UserCreateBody.static;
export type UserUpdateBody = typeof UserUpdateBody.static;
export type UserPasswordBody = typeof UserPasswordBody.static;
export type UserListQuery = typeof UserListQuery.static;
