import { ErrorResponse } from "@common/schemas";
import { Elysia, t } from "elysia";
import { User } from "@/modules/users/schema";
import { getUserById } from "@/modules/users/service";
import { authPlugin } from "@/plugins/auth";
import {
  AuthUser,
  LoginBody,
  LoginResponse,
  LogoutBody,
  RefreshBody,
  RegisterBody,
} from "./schema";
import { login, logout, refresh, register } from "./service";

export const auth = new Elysia({
  name: "module:auth",
  prefix: "/auth",
  detail: { tags: ["Auth"] },
})
  .use(authPlugin)

  .post(
    "/login",
    ({ body, request }) =>
      login(body, request.headers.get("user-agent") ?? undefined),
    {
      body: LoginBody,
      response: {
        200: LoginResponse,
      },
      detail: {
        summary: "Log in",
        description:
          "Authenticate with email and password. Returns access and refresh tokens.",
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
      body: RegisterBody,
      response: {
        201: t.Object({ user: AuthUser, message: t.String() }),
        409: ErrorResponse,
      },
      detail: {
        summary: "Register",
        description: "Create a new learner account with email and password.",
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
      body: RefreshBody,
      response: {
        200: LoginResponse,
        401: ErrorResponse,
      },
      detail: {
        summary: "Refresh token",
        description:
          "Exchange a valid refresh token for a new access/refresh token pair. The old refresh token is revoked.",
      },
    },
  )

  .post("/logout", ({ body, user }) => logout(body.refreshToken, user.sub), {
    auth: true,
    body: LogoutBody,
    response: {
      200: t.Object({ message: t.String() }),
      401: ErrorResponse,
    },
    detail: {
      summary: "Log out",
      description: "Revoke the given refresh token, ending the session.",
      security: [{ bearerAuth: [] }],
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
        200: t.Object({ user: User }),
        401: ErrorResponse,
      },
      detail: {
        summary: "Get current user",
        description:
          "Return the profile of the authenticated user identified by the access token.",
        security: [{ bearerAuth: [] }],
      },
    },
  );
