import { UserRole } from "@common/enums";
import { t } from "elysia";

export namespace UserModel {
  export const User = t.Object({
    id: t.String({ format: "uuid" }),
    email: t.String(),
    fullName: t.Nullable(t.String()),
    role: UserRole,
    createdAt: t.String({ format: "date-time" }),
    updatedAt: t.String({ format: "date-time" }),
  });

  export const CreateBody = t.Object({
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

  export const UpdateBody = t.Partial(
    t.Object({
      email: t.String({ format: "email" }),
      fullName: t.Optional(
        t.Nullable(t.String({ minLength: 1, maxLength: 100 })),
      ),
      role: UserRole,
      password: t.String({ minLength: 8 }),
    }),
  );

  export const PasswordBody = t.Object({
    currentPassword: t.String(),
    newPassword: t.String({
      minLength: 8,
      error: "New password must be at least 8 characters",
    }),
  });

  export type User = typeof User.static;
  export type CreateBody = typeof CreateBody.static;
  export type UpdateBody = typeof UpdateBody.static;
  export type PasswordBody = typeof PasswordBody.static;
}
