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
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toResponse(requestId?: string): Response {
    return Response.json(
      {
        error: {
          code: this.code,
          message: this.message,
        },
        requestId,
      },
      { status: this.status },
    );
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
 * 422 - Unprocessable Entity - Validation failed
 */
export class ValidationError extends AppError {
  constructor(message = "Validation failed") {
    super(422, message, "VALIDATION_ERROR");
  }
}

/**
 * 429 - Too Many Requests - Rate limit exceeded
 */
export class RateLimitError extends AppError {
  constructor(message = "Rate limit exceeded") {
    super(429, message, "RATE_LIMIT_EXCEEDED");
  }

  override toResponse(requestId?: string, retryAfter?: number): Response {
    const headers: Record<string, string> = {};
    if (retryAfter) {
      headers["retry-after"] = String(retryAfter);
    }
    return Response.json(
      {
        error: {
          code: this.code,
          message: this.message,
        },
        requestId,
      },
      { status: this.status, headers },
    );
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
    FORBIDDEN: ForbiddenError,
    NOT_FOUND: NotFoundError,
    CONFLICT: ConflictError,
    VALIDATION_ERROR: ValidationError,
    RATE_LIMIT: RateLimitError,
    INTERNAL_ERROR: InternalError,
  })
  .onError(function onError({ code, error, set, store }) {
    const requestId = store.requestId;

    // Handle custom AppErrors
    if (error instanceof AppError) {
      // Log error for server-side errors (5xx)
      if (error.status >= 500) {
        logger.error(`[${requestId}] ${code}`, {
          requestId,
          code,
          error:
            error instanceof Error
              ? { name: error.name, message: error.message, stack: error.stack }
              : error,
        });
      }

      set.status = error.status;

      // Handle rate limit with retry-after header
      if (error instanceof RateLimitError) {
        return error.toResponse(requestId, 60);
      }

      return error.toResponse(requestId);
    }

    // Handle Elysia validation errors
    if (code === "VALIDATION") {
      const validationError = error as Error & { validator?: unknown };
      set.status = 422;
      return {
        error: {
          code: "VALIDATION_ERROR",
          message: validationError.message || "Validation failed",
        },
        requestId,
      };
    }

    // Handle not found errors
    if (code === "NOT_FOUND") {
      set.status = 404;
      return {
        error: {
          code: "NOT_FOUND",
          message: "Resource not found",
        },
        requestId,
      };
    }

    // Handle unknown errors
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
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
      requestId,
    };
  });
