import { ErrorResponse } from "@common/schemas";
import { Elysia, t } from "elysia";
import { UserSchema } from "@/modules/users/model";
import { getUserById } from "@/modules/users/service";
import { authPlugin } from "@/plugins/auth";
import {
  AuthLoginBody,
  AuthLogoutBody,
  AuthRefreshBody,
  AuthRegisterBody,
  AuthTokenResponse,
  AuthUserInfo,
} from "./model";
import { login, logout, refresh, register } from "./service";

export const auth = new Elysia({ prefix: "/auth", detail: { tags: ["Auth"] } })
  .use(authPlugin)

  .post(
    "/login",
    ({ body, request }) =>
      login(body, request.headers.get("user-agent") ?? undefined),
    {
      body: AuthLoginBody,
      response: {
        200: t.Object({
          user: AuthUserInfo,
          ...AuthTokenResponse.properties,
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
      set.status = 201;
      return register(body);
    },
    {
      body: AuthRegisterBody,
      response: {
        201: t.Object({ user: AuthUserInfo, message: t.String() }),
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
    ({ body, request }) =>
      refresh(
        body.refreshToken,
        request.headers.get("user-agent") ?? undefined,
      ),
    {
      body: AuthRefreshBody,
      response: {
        200: t.Object({
          user: AuthUserInfo,
          ...AuthTokenResponse.properties,
        }),
        401: ErrorResponse,
      },
      detail: {
        summary: "Refresh token",
        description: "Get new access token using refresh token",
      },
    },
  )

  .post("/logout", ({ body }) => logout(body.refreshToken), {
    body: AuthLogoutBody,
    response: {
      200: t.Object({ message: t.String() }),
    },
    detail: {
      summary: "Logout",
      description: "Logout user and revoke refresh token",
    },
  })

  .get(
    "/me",
    async ({ user }) => ({
      user: await getUserById(user.sub),
    }),
    {
      auth: true,
      response: {
        200: t.Object({ user: UserSchema }),
        401: ErrorResponse,
      },
      detail: {
        summary: "Get current user",
        description: "Get details of the currently authenticated user",
      },
    },
  );
