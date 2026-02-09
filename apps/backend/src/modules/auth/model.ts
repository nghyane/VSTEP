import { UserSchema } from "@db/typebox";
import { t } from "elysia";

export const AuthUserInfo = t.Pick(UserSchema, [
  "id",
  "email",
  "fullName",
  "role",
]);

export const AuthTokenResponse = t.Object({
  accessToken: t.String(),
  refreshToken: t.String(),
  expiresIn: t.Number(),
});

export const AuthLoginBody = t.Object({
  email: t.String({ format: "email" }),
  password: t.String(),
});

export const AuthRegisterBody = t.Object({
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 8 }),
  fullName: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
});

export const AuthRefreshBody = t.Object({
  refreshToken: t.String(),
});

export const AuthLogoutBody = t.Object({
  refreshToken: t.String(),
});

export type AuthUserInfo = typeof AuthUserInfo.static;
export type AuthTokenResponse = typeof AuthTokenResponse.static;
export type AuthLoginBody = typeof AuthLoginBody.static;
export type AuthRegisterBody = typeof AuthRegisterBody.static;
export type AuthRefreshBody = typeof AuthRefreshBody.static;
export type AuthLogoutBody = typeof AuthLogoutBody.static;
