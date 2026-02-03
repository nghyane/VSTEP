/**
 * Auth Module Controller
 * Elysia routes for authentication
 * Pattern: Elysia instance with direct service calls
 * @see https://elysiajs.com/pattern/mvc.html
 */

import { env } from "@common/env";
import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { errorPlugin } from "@/plugins/error";
import { AuthModel } from "./model";
import { AuthService } from "./service";

/**
 * Auth controller mounted at /auth
 * Direct service calls - no .decorate() needed for static methods
 */
export const auth = new Elysia({ prefix: "/auth" })
  .use(errorPlugin)
  .use(authPlugin)

  // ============ Public Routes ============

  /**
   * POST /auth/sign-in
   * Sign in with email and password
   */
  .post(
    "/sign-in",
    async ({ body, set, cookie: { auth } }) => {
      const result = await AuthService.signIn(body);

      // Set auth cookie
      auth.set({
        value: result.accessToken,
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: result.expiresIn,
        path: "/",
      });

      set.status = 200;
      return result;
    },
    {
      body: AuthModel.signInBody,
      cookie: t.Object({
        auth: t.Optional(t.String()),
      }),
      response: {
        200: AuthModel.signInResponse,
        401: AuthModel.authError,
      },
      detail: {
        summary: "Sign in",
        description: "Authenticate user with email and password",
        tags: ["Auth"],
      },
    },
  )

  /**
   * POST /auth/sign-up
   * Register new user account
   */
  .post(
    "/sign-up",
    async ({ body, set }) => {
      const result = await AuthService.signUp(body);
      set.status = 201;
      return result;
    },
    {
      body: AuthModel.signUpBody,
      response: {
        201: AuthModel.signUpResponse,
        409: AuthModel.authError,
      },
      detail: {
        summary: "Sign up",
        description: "Register a new user account",
        tags: ["Auth"],
      },
    },
  )

  /**
   * POST /auth/refresh
   * Refresh access token using refresh token
   */
  .post(
    "/refresh",
    async ({ body, set, cookie: { auth } }) => {
      const result = await AuthService.refreshToken(body.refreshToken);

      // Update auth cookie with new token
      auth.set({
        value: result.accessToken,
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: result.expiresIn,
        path: "/",
      });

      set.status = 200;
      return result;
    },
    {
      body: AuthModel.refreshTokenBody,
      cookie: t.Object({
        auth: t.Optional(t.String()),
      }),
      response: {
        200: AuthModel.refreshTokenResponse,
        401: AuthModel.authError,
      },
      detail: {
        summary: "Refresh token",
        description: "Get new access token using refresh token",
        tags: ["Auth"],
      },
    },
  )

  /**
   * POST /auth/logout
   * Logout user and revoke refresh token
   */
  .post(
    "/logout",
    async ({ body, set, cookie: { auth } }) => {
      const result = await AuthService.logout(body.refreshToken);

      // Clear auth cookie
      auth.remove();

      set.status = 200;
      return result;
    },
    {
      body: AuthModel.logoutBody,
      cookie: t.Object({
        auth: t.Optional(t.String()),
      }),
      response: {
        200: AuthModel.logoutResponse,
      },
      detail: {
        summary: "Logout",
        description: "Logout user and revoke refresh token",
        tags: ["Auth"],
      },
    },
  )

  /**
   * GET /auth/me
   * Get current authenticated user
   */
  .get(
    "/me",
    async ({ user, set }) => {
      // user is injected by authPlugin derive
      if (!user) {
        set.status = 401;
        return {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        };
      }

      set.status = 200;
      return {
        user: {
          id: user.sub,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      };
    },
    {
      auth: true,
      response: {
        200: AuthModel.meResponse,
        401: AuthModel.authError,
      },
      detail: {
        summary: "Get current user",
        description: "Get details of the currently authenticated user",
        tags: ["Auth"],
      },
    },
  );
