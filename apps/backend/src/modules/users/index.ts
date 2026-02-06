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
import { UserService } from "./service";

const UserResponse = t.Object({
  id: t.String({ format: "uuid" }),
  email: t.String(),
  fullName: t.Nullable(t.String()),
  role: UserRole,
  createdAt: t.String({ format: "date-time" }),
  updatedAt: t.String({ format: "date-time" }),
});

export const users = new Elysia({
  prefix: "/users",
  detail: { tags: ["Users"] },
})
  .use(authPlugin)

  .get(
    "/:id",
    async ({ params, set }) => {
      const result = await UserService.getById(params.id);
      set.status = 200;
      return result;
    },
    {
      auth: true,
      params: IdParam,
      response: {
        200: UserResponse,
        401: ErrorResponse,
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
          data: t.Array(UserResponse),
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
      body: t.Object({
        email: t.String({
          format: "email",
          error: "Valid email is required",
        }),
        password: t.String({
          minLength: 8,
          error: "Password must be at least 8 characters",
        }),
        fullName: t.Optional(
          t.String({
            minLength: 1,
            maxLength: 100,
          }),
        ),
        role: t.Optional(UserRole),
      }),
      response: {
        201: UserResponse,
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
      body: t.Partial(
        t.Object({
          email: t.String({ format: "email" }),
          fullName: t.Optional(
            t.Nullable(
              t.String({
                minLength: 1,
                maxLength: 100,
              }),
            ),
          ),
          role: UserRole,
          password: t.String({
            minLength: 8,
          }),
        }),
      ),
      response: {
        200: UserResponse,
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
      body: t.Object({
        currentPassword: t.String(),
        newPassword: t.String({
          minLength: 8,
          error: "New password must be at least 8 characters",
        }),
      }),
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
