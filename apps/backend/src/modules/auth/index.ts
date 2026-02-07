import { AuthErrors, ErrorResponse } from "@common/schemas";
import { Elysia, t } from "elysia";
import { UserModel } from "@/modules/users/model";
import { UserService } from "@/modules/users/service";
import { authPlugin } from "@/plugins/auth";
import { AuthModel } from "./model";
import { AuthService } from "./service";

const TokenResponseSchema = t.Object({
  user: AuthModel.UserInfo,
  ...AuthModel.TokenResponse.properties,
});

export const auth = new Elysia({ prefix: "/auth", detail: { tags: ["Auth"] } })
  .use(authPlugin)

  .post(
    "/login",
    ({ body, request }) => {
      const deviceInfo = request.headers.get("user-agent") ?? undefined;
      return AuthService.login({ ...body, deviceInfo });
    },
    {
      body: AuthModel.LoginBody,
      response: { 200: TokenResponseSchema, 401: ErrorResponse },
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
      return AuthService.register(body);
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
    ({ body, request }) => {
      const deviceInfo = request.headers.get("user-agent") ?? undefined;
      return AuthService.refreshToken(body.refreshToken, deviceInfo);
    },
    {
      body: AuthModel.RefreshBody,
      response: { 200: TokenResponseSchema, 401: ErrorResponse },
      detail: {
        summary: "Refresh token",
        description: "Get new access token using refresh token",
      },
    },
  )

  .post("/logout", ({ body }) => AuthService.logout(body.refreshToken), {
    body: AuthModel.LogoutBody,
    response: { 200: t.Object({ message: t.String() }) },
    detail: {
      summary: "Logout",
      description: "Logout user and revoke refresh token",
    },
  })

  .get(
    "/me",
    async ({ user }) => ({ user: await UserService.getById(user.sub) }),
    {
      auth: true,
      response: { 200: t.Object({ user: UserModel.User }), ...AuthErrors },
      detail: {
        summary: "Get current user",
        description: "Get details of the currently authenticated user",
      },
    },
  );
