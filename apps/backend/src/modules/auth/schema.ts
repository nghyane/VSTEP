import { t } from "elysia";
import { User } from "@/modules/users/schema";

export const AuthUser = t.Pick(User, ["id", "email", "fullName", "role"]);

export const TokenResponse = t.Object({
  accessToken: t.String(),
  refreshToken: t.String(),
  expiresIn: t.Number(),
});

export const LoginResponse = t.Composite([
  t.Object({ user: AuthUser }),
  TokenResponse,
]);

export const LoginBody = t.Object({
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 1 }),
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

export type AuthUser = typeof AuthUser.static;
export type TokenResponse = typeof TokenResponse.static;
export type LoginResponse = typeof LoginResponse.static;
export type LoginBody = typeof LoginBody.static;
export type RegisterBody = typeof RegisterBody.static;
export type RefreshBody = typeof RefreshBody.static;
export type LogoutBody = typeof LogoutBody.static;
