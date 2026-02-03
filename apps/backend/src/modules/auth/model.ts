/**
 * Auth Module Models
 * TypeBox schemas for request/response validation
 * @see https://elysiajs.com/validation/overview.html
 */

import { t } from "elysia";
import { ErrorResponse } from "@/common/schemas";

/**
 * User roles
 */
export const UserRole = t.Union([
  t.Literal("learner"),
  t.Literal("instructor"),
  t.Literal("admin"),
]);

/**
 * Auth model namespace
 * All auth-related TypeBox schemas
 */
export namespace AuthModel {
  // ============ Request Bodies ============

  /**
   * Sign in request body
   */
  export const signInBody = t.Object({
    email: t.String({
      format: "email",
      error: "Valid email is required",
    }),
    password: t.String({
      minLength: 6,
      error: "Password must be at least 6 characters",
    }),
  });
  export type SignInBody = typeof signInBody.static;

  /**
   * Sign up request body
   */
  export const signUpBody = t.Object({
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
  export type SignUpBody = typeof signUpBody.static;

  /**
   * Refresh token request body
   */
  export const refreshTokenBody = t.Object({
    refreshToken: t.String(),
  });
  export type RefreshTokenBody = typeof refreshTokenBody.static;

  /**
   * Logout request body
   */
  export const logoutBody = t.Object({
    refreshToken: t.String(),
  });
  export type LogoutBody = typeof logoutBody.static;

  // ============ Response Schemas ============

  /**
   * User info in auth responses
   */
  export const userInfo = t.Object({
    id: t.String({ format: "uuid" }),
    email: t.String(),
    fullName: t.Nullable(t.String()),
    role: UserRole,
  });

  /**
   * Sign in success response
   */
  export const signInResponse = t.Object({
    user: userInfo,
    accessToken: t.String(),
    refreshToken: t.String(),
    expiresIn: t.Number(),
  });
  export type SignInResponse = typeof signInResponse.static;

  /**
   * Sign up success response
   */
  export const signUpResponse = t.Object({
    user: userInfo,
    message: t.String(),
  });
  export type SignUpResponse = typeof signUpResponse.static;

  /**
   * Token refresh response
   */
  export const refreshTokenResponse = t.Object({
    accessToken: t.String(),
    refreshToken: t.String(),
    expiresIn: t.Number(),
  });
  export type RefreshTokenResponse = typeof refreshTokenResponse.static;

  /**
   * Logout response
   */
  export const logoutResponse = t.Object({
    message: t.String(),
  });
  export type LogoutResponse = typeof logoutResponse.static;

  /**
   * Get current user response
   */
  export const meResponse = t.Object({
    user: userInfo,
  });
  export type MeResponse = typeof meResponse.static;

  // ============ Error Responses ============

  /**
   * Auth error response
   */
  export const authError = ErrorResponse;
  export type AuthError = typeof authError.static;

  /**
   * Validation error response
   */
  export const validationError = t.Object({
    error: t.Object({
      code: t.Literal("VALIDATION_ERROR"),
      message: t.String(),
    }),
    requestId: t.Optional(t.String()),
  });
  export type ValidationError = typeof validationError.static;
}

// Re-export for convenience
export { t };
