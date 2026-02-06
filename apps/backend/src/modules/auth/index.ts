/**
 * Auth Module Controller
 * Elysia routes for authentication
 * JWT signing via @elysiajs/jwt plugin — service handles business logic only
 * @see https://elysiajs.com/pattern/mvc.html
 */

import { env } from "@common/env";
import { ErrorResponse } from "@common/schemas";
import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { AuthService, parseExpiry } from "./service";

// ─── Shared Response Schemas ─────────────────────────────────────

const UserInfo = t.Object({
  id: t.String({ format: "uuid" }),
  email: t.String(),
  fullName: t.Nullable(t.String()),
  role: t.Union([
    t.Literal("learner"),
    t.Literal("instructor"),
    t.Literal("admin"),
  ]),
});

const TokenResponse = t.Object({
  accessToken: t.String(),
  refreshToken: t.String(),
  expiresIn: t.Number(),
});

// ─── Controller ──────────────────────────────────────────────────

export const auth = new Elysia({ prefix: "/auth" })
  .use(authPlugin)

  // POST /auth/login
  .post(
    "/login",
    async ({ body, jwt, cookie: { auth: authCookie } }) => {
      const { user, refreshToken } = await AuthService.login(body);

      const accessToken = await jwt.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName ?? "",
      });

      const expiresIn = parseExpiry(env.JWT_EXPIRES_IN);

      authCookie.set({
        value: accessToken,
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: expiresIn,
        path: "/",
      });

      return { user, accessToken, refreshToken, expiresIn };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 6 }),
      }),
      cookie: t.Object({ auth: t.Optional(t.String()) }),
      response: {
        200: t.Object({ user: UserInfo, ...TokenResponse.properties }),
      },
      detail: {
        summary: "Login",
        description: "Authenticate user with email and password",
        tags: ["Auth"],
      },
    },
  )

  // POST /auth/register
  .post(
    "/register",
    async ({ body, set }) => {
      const result = await AuthService.register(body);
      set.status = 201;
      return result;
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 8 }),
        fullName: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
      }),
      response: {
        201: t.Object({ user: UserInfo, message: t.String() }),
        409: ErrorResponse,
      },
      detail: {
        summary: "Register",
        description: "Register a new user account",
        tags: ["Auth"],
      },
    },
  )

  // POST /auth/refresh
  .post(
    "/refresh",
    async ({ body, jwt, cookie: { auth: authCookie } }) => {
      const { user, newRefreshToken } = await AuthService.refreshToken(
        body.refreshToken,
      );

      const accessToken = await jwt.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName ?? "",
      });

      const expiresIn = parseExpiry(env.JWT_EXPIRES_IN);

      authCookie.set({
        value: accessToken,
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: expiresIn,
        path: "/",
      });

      return { accessToken, refreshToken: newRefreshToken, expiresIn };
    },
    {
      body: t.Object({ refreshToken: t.String() }),
      cookie: t.Object({ auth: t.Optional(t.String()) }),
      response: {
        200: TokenResponse,
        401: ErrorResponse,
      },
      detail: {
        summary: "Refresh token",
        description: "Get new access token using refresh token",
        tags: ["Auth"],
      },
    },
  )

  // POST /auth/logout
  .post(
    "/logout",
    async ({ body, cookie: { auth: authCookie } }) => {
      const result = await AuthService.logout(body.refreshToken);
      authCookie.remove();
      return result;
    },
    {
      body: t.Object({ refreshToken: t.String() }),
      cookie: t.Object({ auth: t.Optional(t.String()) }),
      response: {
        200: t.Object({ message: t.String() }),
      },
      detail: {
        summary: "Logout",
        description: "Logout user and revoke refresh token",
        tags: ["Auth"],
      },
    },
  )

  // GET /auth/me
  .get(
    "/me",
    ({ user }) => ({
      user: {
        id: user.sub,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    }),
    {
      auth: true,
      response: {
        200: t.Object({ user: UserInfo }),
        401: ErrorResponse,
      },
      detail: {
        summary: "Get current user",
        description: "Get details of the currently authenticated user",
        tags: ["Auth"],
      },
    },
  );
