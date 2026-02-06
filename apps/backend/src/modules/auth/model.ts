import { t } from "elysia";

export namespace AuthModel {
  export const UserInfo = t.Object({
    id: t.String({ format: "uuid" }),
    email: t.String(),
    fullName: t.Nullable(t.String()),
    role: t.Union([
      t.Literal("learner"),
      t.Literal("instructor"),
      t.Literal("admin"),
    ]),
  });

  export const TokenResponse = t.Object({
    accessToken: t.String(),
    refreshToken: t.String(),
    expiresIn: t.Number(),
  });

  export const LoginBody = t.Object({
    email: t.String({ format: "email" }),
    password: t.String({ minLength: 6 }),
  });

  export const RegisterBody = t.Object({
    email: t.String({ format: "email" }),
    password: t.String({ minLength: 8 }),
    fullName: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  });

  export const RefreshBody = t.Object({
    refreshToken: t.String(),
  });

  export const LogoutBody = t.Object({
    refreshToken: t.String(),
  });

  export type UserInfo = typeof UserInfo.static;
  export type TokenResponse = typeof TokenResponse.static;
  export type LoginBody = typeof LoginBody.static;
  export type RegisterBody = typeof RegisterBody.static;
}
