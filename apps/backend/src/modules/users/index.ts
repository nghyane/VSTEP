/**
 * Users Module Controller
 * Elysia routes for user management
 * Pattern: Elysia instance with direct service calls
 * @see https://elysiajs.com/pattern/mvc.html
 */

import {
  createResponseSchema,
  ErrorResponse,
  IdParam,
  PaginationMeta,
  PaginationQuery,
  SuccessResponse,
} from "@common/schemas";
import { Elysia, t } from "elysia";
import { table } from "@/db";
import { authPlugin } from "@/plugins/auth";
import { UserService } from "./service";

// ─── Shared Schemas ─────────────────────────────────────────────

const UserRole = t.Union([
  t.Literal("learner"),
  t.Literal("instructor"),
  t.Literal("admin"),
]);

const UserResponse = createResponseSchema(table.users, {
  omit: ["passwordHash", "deletedAt"],
});

// ─── Controller ─────────────────────────────────────────────────

/**
 * Users controller mounted at /users
 * Direct service calls - no .decorate() needed for static methods
 */
export const users = new Elysia({ prefix: "/users" })
  .use(authPlugin)

  // ============ Protected Routes ============

  /**
   * GET /users/:id
   * Get user by ID
   */
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
        tags: ["Users"],
      },
    },
  )

  /**
   * GET /users
   * List users (admin only)
   */
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
        tags: ["Users"],
      },
    },
  )

  /**
   * POST /users
   * Create new user (admin only)
   */
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
        tags: ["Users"],
      },
    },
  )

  /**
   * PATCH /users/:id
   * Update user
   */
  .patch(
    "/:id",
    async ({ params, body, set }) => {
      const result = await UserService.update(params.id, body);
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
        tags: ["Users"],
      },
    },
  )

  /**
   * DELETE /users/:id
   * Soft delete user (admin only)
   */
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
        tags: ["Users"],
      },
    },
  )

  /**
   * POST /users/:id/password
   * Update user password
   */
  .post(
    "/:id/password",
    async ({ params, body, set }) => {
      const result = await UserService.updatePassword(params.id, body);
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
        404: ErrorResponse,
      },
      detail: {
        summary: "Update password",
        description: "Update user password",
        tags: ["Users"],
      },
    },
  );
