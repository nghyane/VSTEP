import { env } from "@common/env";
import { ErrorResponse } from "@common/schemas";
import { Elysia, t } from "elysia";
import { UserModel } from "@/modules/users/model";
import { UserService } from "@/modules/users/service";
import { authPlugin } from "@/plugins/auth";
import { AuthModel } from "./model";
import { AuthService, parseExpiry } from "./service";

export const auth = new Elysia({ prefix: "/auth", detail: { tags: ["Auth"] } })
  .use(authPlugin)

  .post(
    "/login",
    async ({ body, request }) => {
      const deviceInfo = request.headers.get("user-agent") ?? undefined;
      const { user, refreshToken, jti } = await AuthService.login({
        ...body,
        deviceInfo,
      });

      const accessToken = await AuthService.signAccessToken({
        sub: user.id,
        role: user.role,
        jti,
      });

      const expiresIn = parseExpiry(env.JWT_EXPIRES_IN);
      return { user, accessToken, refreshToken, expiresIn };
    },
    {
      body: AuthModel.LoginBody,
      response: {
        200: t.Object({
          user: AuthModel.UserInfo,
          ...AuthModel.TokenResponse.properties,
        }),
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
      body: AuthModel.RegisterBody,
      response: {
        201: t.Object({ user: AuthModel.UserInfo, message: t.String() }),
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
    async ({ body, request }) => {
      const deviceInfo = request.headers.get("user-agent") ?? undefined;
      const { user, newRefreshToken, jti } = await AuthService.refreshToken(
        body.refreshToken,
        deviceInfo,
      );

      const accessToken = await AuthService.signAccessToken({
        sub: user.id,
        role: user.role,
        jti,
      });

      const expiresIn = parseExpiry(env.JWT_EXPIRES_IN);
      return { user, accessToken, refreshToken: newRefreshToken, expiresIn };
    },
    {
      body: AuthModel.RefreshBody,
      response: {
        200: t.Object({
          user: AuthModel.UserInfo,
          ...AuthModel.TokenResponse.properties,
        }),
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
      body: AuthModel.LogoutBody,
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
        200: t.Object({ user: UserModel.User }),
        401: ErrorResponse,
      },
      detail: {
        summary: "Get current user",
        description: "Get details of the currently authenticated user",
      },
    },
  );
