import { UserRole } from "@common/enums";
import {
  ErrorResponse,
  IdParam,
  PaginationMeta,
  PaginationQuery,
  SuccessResponse,
} from "@common/schemas";
import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { ForbiddenError } from "@/plugins/error";
import { UserModel } from "./model";
import { UserService } from "./service";

export const users = new Elysia({
  prefix: "/users",
  detail: { tags: ["Users"] },
})
  .use(authPlugin)

  .get(
    "/:id",
    async ({ params, user, set }) => {
      if (user.role !== "admin" && params.id !== user.sub) {
        throw new ForbiddenError("You can only view your own profile");
      }
      const result = await UserService.getById(params.id);
      set.status = 200;
      return result;
    },
    {
      auth: true,
      params: IdParam,
      response: {
        200: UserModel.User,
        401: ErrorResponse,
        403: ErrorResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: "Get user",
        description: "Get user details by ID",
      },
    },
  )

  .get(
    "/",
    async ({ query, set }) => {
      const result = await UserService.list(query);
      set.status = 200;
      return result;
    },
    {
      role: "admin",
      query: t.Object({
        ...PaginationQuery.properties,
        role: t.Optional(UserRole),
        search: t.Optional(t.String()),
      }),
      response: {
        200: t.Object({
          data: t.Array(UserModel.User),
          meta: PaginationMeta,
        }),
        401: ErrorResponse,
        403: ErrorResponse,
      },
      detail: {
        summary: "List users",
        description: "List users with pagination and filtering (Admin only)",
      },
    },
  )

  .post(
    "/",
    async ({ body, set }) => {
      const result = await UserService.create(body);
      set.status = 201;
      return result;
    },
    {
      role: "admin",
      body: UserModel.CreateBody,
      response: {
        201: UserModel.User,
        401: ErrorResponse,
        403: ErrorResponse,
        409: ErrorResponse,
      },
      detail: {
        summary: "Create user",
        description: "Create a new user account (Admin only)",
      },
    },
  )

  .patch(
    "/:id",
    async ({ params, body, user, set }) => {
      const result = await UserService.update(
        params.id,
        body,
        user.sub,
        user.role === "admin",
      );
      set.status = 200;
      return result;
    },
    {
      auth: true,
      params: IdParam,
      body: UserModel.UpdateBody,
      response: {
        200: UserModel.User,
        401: ErrorResponse,
        404: ErrorResponse,
        409: ErrorResponse,
      },
      detail: {
        summary: "Update user",
        description: "Update user details",
      },
    },
  )

  .delete(
    "/:id",
    async ({ params, set }) => {
      const result = await UserService.remove(params.id);
      set.status = 200;
      return result;
    },
    {
      role: "admin",
      params: IdParam,
      response: {
        200: t.Object({
          id: t.String({ format: "uuid" }),
          deletedAt: t.String(),
        }),
        401: ErrorResponse,
        403: ErrorResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: "Delete user",
        description: "Soft delete a user account (Admin only)",
      },
    },
  )

  .post(
    "/:id/password",
    async ({ params, body, user, set }) => {
      const result = await UserService.updatePassword(
        params.id,
        body,
        user.sub,
        user.role === "admin",
      );
      set.status = 200;
      return result;
    },
    {
      auth: true,
      params: IdParam,
      body: UserModel.PasswordBody,
      response: {
        200: SuccessResponse,
        401: ErrorResponse,
        403: ErrorResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: "Update password",
        description: "Update user password",
      },
    },
  );
