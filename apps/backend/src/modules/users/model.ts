/**
 * Users Module Models
 * TypeBox schemas for user management
 * @see https://elysiajs.com/validation/overview.html
 */

import { t } from "elysia";
import {
  ErrorResponse,
  IdParam,
  PaginationMeta,
  PaginationQuery,
  spread,
} from "@/common/schemas";

/**
 * User roles
 */
export const UserRole = t.Union([
  t.Literal("learner"),
  t.Literal("instructor"),
  t.Literal("admin"),
]);

/**
 * User model namespace
 * All user-related TypeBox schemas
 */
export namespace UserModel {
  // ============ Params ============

  /**
   * User ID parameter
   */
  export const userIdParam = IdParam;
  export type UserIdParam = typeof userIdParam.static;

  // ============ Request Bodies ============

  /**
   * Create user request body
   */
  export const createUserBody = t.Object({
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
  });
  export type CreateUserBody = typeof createUserBody.static;

  /**
   * Update user request body
   */
  export const updateUserBody = t.Partial(
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
  );
  export type UpdateUserBody = typeof updateUserBody.static;

  /**
   * Update password request body
   */
  export const updatePasswordBody = t.Object({
    currentPassword: t.String(),
    newPassword: t.String({
      minLength: 8,
      error: "New password must be at least 8 characters",
    }),
  });
  export type UpdatePasswordBody = typeof updatePasswordBody.static;

  /**
   * Query parameters for listing users
   */
  export const listUsersQuery = t.Object({
    ...spread(PaginationQuery),
    role: t.Optional(UserRole),
    search: t.Optional(t.String()),
  });
  export type ListUsersQuery = typeof listUsersQuery.static;

  // ============ Response Schemas ============

  /**
   * User info in responses
   */
  export const userInfo = t.Object({
    id: t.String({ format: "uuid" }),
    email: t.String(),
    fullName: t.Nullable(t.String()),
    role: UserRole,
    createdAt: t.String(),
    updatedAt: t.String(),
  });

  /**
   * Single user response
   */
  export const userResponse = userInfo;
  export type UserResponse = typeof userResponse.static;

  /**
   * List users response
   */
  export const listUsersResponse = t.Object({
    data: t.Array(userInfo),
    meta: PaginationMeta,
  });
  export type ListUsersResponse = typeof listUsersResponse.static;

  /**
   * Create user response
   */
  export const createUserResponse = userInfo;
  export type CreateUserResponse = typeof createUserResponse.static;

  /**
   * Update user response
   */
  export const updateUserResponse = userInfo;
  export type UpdateUserResponse = typeof updateUserResponse.static;

  /**
   * Delete user response
   */
  export const deleteUserResponse = t.Object({
    id: t.String({ format: "uuid" }),
    deletedAt: t.String(),
  });
  export type DeleteUserResponse = typeof deleteUserResponse.static;

  /**
   * Update password response
   */
  export const updatePasswordResponse = t.Object({
    message: t.String(),
  });
  export type UpdatePasswordResponse = typeof updatePasswordResponse.static;

  // ============ Error Responses ============

  /**
   * User error response
   */
  export const userError = ErrorResponse;
  export type UserError = typeof userError.static;
}

// Re-export for convenience
export { t };
