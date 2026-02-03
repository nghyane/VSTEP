/**
 * Users Module Controller
 * Elysia routes for user management
 * Pattern: Elysia instance with direct service calls
 * @see https://elysiajs.com/pattern/mvc.html
 */

import { Elysia } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { errorPlugin } from "@/plugins/error";
import { UserModel } from "./model";
import { UserService } from "./service";

/**
 * Users controller mounted at /users
 * Direct service calls - no .decorate() needed for static methods
 */
export const users = new Elysia({ prefix: "/users" })
  .use(errorPlugin)
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
      params: UserModel.userIdParam,
      response: {
        200: UserModel.userResponse,
        401: UserModel.userError,
        404: UserModel.userError,
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
      admin: true,
      query: UserModel.listUsersQuery,
      response: {
        200: UserModel.listUsersResponse,
        401: UserModel.userError,
        403: UserModel.userError,
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
      admin: true,
      body: UserModel.createUserBody,
      response: {
        201: UserModel.createUserResponse,
        401: UserModel.userError,
        403: UserModel.userError,
        409: UserModel.userError,
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
      params: UserModel.userIdParam,
      body: UserModel.updateUserBody,
      response: {
        200: UserModel.updateUserResponse,
        401: UserModel.userError,
        404: UserModel.userError,
        409: UserModel.userError,
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
      admin: true,
      params: UserModel.userIdParam,
      response: {
        200: UserModel.deleteUserResponse,
        401: UserModel.userError,
        403: UserModel.userError,
        404: UserModel.userError,
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
      params: UserModel.userIdParam,
      body: UserModel.updatePasswordBody,
      response: {
        200: UserModel.updatePasswordResponse,
        401: UserModel.userError,
        404: UserModel.userError,
      },
      detail: {
        summary: "Update password",
        description: "Update user password",
        tags: ["Users"],
      },
    },
  );
