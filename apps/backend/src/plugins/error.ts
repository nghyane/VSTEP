/**
 * Error handling plugin for Elysia
 * Provides custom error classes, requestId tracking, and standardized error responses
 * @see https://elysiajs.com/pattern/error-handling.html
 */

import { logger } from "@common/logger";
import { Elysia } from "elysia";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Base custom error class with HTTP status code
 * All custom errors should extend this class
 */
export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
    public code: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toResponse(requestId: string): Record<string, unknown> {
    const body: Record<string, unknown> = {
      requestId,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details !== undefined && { details: this.details }),
      },
    };
    return body;
  }
}

/**
 * 400 - Bad Request - Invalid input data
 */
export class BadRequestError extends AppError {
  constructor(message = "Bad request") {
    super(400, message, "BAD_REQUEST");
  }
}

/**
 * 401 - Unauthorized - Authentication required
 */
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, message, "UNAUTHORIZED");
  }
}

/**
 * 401 - Token Expired - Access token expired, client should refresh
 */
export class TokenExpiredError extends AppError {
  constructor(message = "Token expired") {
    super(401, message, "TOKEN_EXPIRED");
  }
}

/**
 * 403 - Forbidden - Insufficient permissions
 */
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(403, message, "FORBIDDEN");
  }
}

/**
 * 404 - Not Found - Resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(404, message, "NOT_FOUND");
  }
}

/**
 * 409 - Conflict - Resource conflict (e.g., duplicate email)
 */
export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(409, message, "CONFLICT");
  }
}

/**
 * 400 - Validation Error - Invalid input
 */
export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: unknown) {
    super(400, message, "VALIDATION_ERROR", details);
  }
}

/**
 * 429 - Too Many Requests - Rate limit exceeded
 */
export class RateLimitError extends AppError {
  constructor(
    message = "Rate limit exceeded",
    public retryAfter?: number,
  ) {
    super(429, message, "RATE_LIMITED");
  }
}

/**
 * 500 - Internal Server Error - Unexpected server error
 */
export class InternalError extends AppError {
  constructor(message = "Internal server error") {
    super(500, message, "INTERNAL_ERROR");
  }
}

/** Extract or generate a UUID v4 requestId from the incoming request */
function resolveRequestId(request: Request): string {
  const header = request.headers.get("x-request-id");
  if (header && UUID_RE.test(header)) return header;
  return crypto.randomUUID();
}

/**
 * Error plugin with requestId tracking and custom error handling
 * Must be registered early in the Elysia pipeline
 */
export const errorPlugin = new Elysia({ name: "error" })
  .state("requestId", "")
  .onRequest(({ store, request, set }) => {
    const requestId = resolveRequestId(request);
    store.requestId = requestId;
    set.headers["x-request-id"] = requestId;
  })
  .error({
    APP_ERROR: AppError,
    BAD_REQUEST: BadRequestError,
    UNAUTHORIZED: UnauthorizedError,
    TOKEN_EXPIRED: TokenExpiredError,
    FORBIDDEN: ForbiddenError,
    NOT_FOUND: NotFoundError,
    CONFLICT: ConflictError,
    VALIDATION_ERROR: ValidationError,
    RATE_LIMITED: RateLimitError,
    INTERNAL_ERROR: InternalError,
  })
  .onError(function onError({ code, error, set, store }) {
    const requestId = store.requestId;

    // Handle custom AppErrors
    if (error instanceof AppError) {
      if (error.status >= 500) {
        logger.error(`[${requestId}] ${code}`, {
          requestId,
          code,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        });
      }

      set.status = error.status;
      if (error instanceof RateLimitError && error.retryAfter) {
        set.headers["retry-after"] = String(error.retryAfter);
      }
      return error.toResponse(requestId);
    }

    // Handle Elysia built-in errors
    if (code === "VALIDATION") {
      set.status = 400;
      return {
        requestId,
        error: {
          code: "VALIDATION_ERROR",
          message: error.message || "Validation failed",
        },
      };
    }

    if (code === "NOT_FOUND") {
      set.status = 404;
      return {
        requestId,
        error: { code: "NOT_FOUND", message: "Resource not found" },
      };
    }

    // Unknown errors
    logger.error(`[${requestId}] Unexpected error (${code})`, {
      requestId,
      code,
      error:
        error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : error,
    });
    set.status = 500;
    return {
      requestId,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    };
  });
