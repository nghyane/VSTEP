import { env } from "@common/env";
import { ErrorResponse } from "@common/schemas";
import { Elysia, t } from "elysia";
import { UserService } from "@/modules/users/service";
import { authPlugin } from "@/plugins/auth";
import { AuthService, parseExpiry } from "./service";

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

export const auth = new Elysia({ prefix: "/auth", detail: { tags: ["Auth"] } })
  .use(authPlugin)

  .post(
    "/login",
    async ({ body, jwt, request }) => {
      const deviceInfo = request.headers.get("user-agent") ?? undefined;
      const { user, refreshToken, jti } = await AuthService.login({
        ...body,
        deviceInfo,
      });

      const accessToken = await jwt.sign({
        sub: user.id,
        role: user.role,
        jti,
      });

      const expiresIn = parseExpiry(env.JWT_EXPIRES_IN);
      return { user, accessToken, refreshToken, expiresIn };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 6 }),
      }),
      response: {
        200: t.Object({ user: UserInfo, ...TokenResponse.properties }),
      },
      detail: {
        summary: "Login",
        description: "Authenticate user with email and password",
      },
    },
  )

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
      },
    },
  )

  .post(
    "/refresh",
    async ({ body, jwt, request }) => {
      const deviceInfo = request.headers.get("user-agent") ?? undefined;
      const { user, newRefreshToken, jti } = await AuthService.refreshToken(
        body.refreshToken,
        deviceInfo,
      );

      const accessToken = await jwt.sign({
        sub: user.id,
        role: user.role,
        jti,
      });

      const expiresIn = parseExpiry(env.JWT_EXPIRES_IN);
      return { accessToken, refreshToken: newRefreshToken, expiresIn };
    },
    {
      body: t.Object({ refreshToken: t.String() }),
      response: {
        200: TokenResponse,
        401: ErrorResponse,
      },
      detail: {
        summary: "Refresh token",
        description: "Get new access token using refresh token",
      },
    },
  )

  .post(
    "/logout",
    async ({ body }) => {
      return AuthService.logout(body.refreshToken);
    },
    {
      body: t.Object({ refreshToken: t.String() }),
      response: {
        200: t.Object({ message: t.String() }),
      },
      detail: {
        summary: "Logout",
        description: "Logout user and revoke refresh token",
      },
    },
  )

  .get(
    "/me",
    async ({ user }) => ({
      user: await UserService.getById(user.sub),
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
      },
    },
  );
