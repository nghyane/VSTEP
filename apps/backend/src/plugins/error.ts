import { logger } from "@common/logger";
import { Elysia } from "elysia";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

export class BadRequestError extends AppError {
  constructor(message = "Bad request") {
    super(400, message, "BAD_REQUEST");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, message, "UNAUTHORIZED");
  }
}

export class TokenExpiredError extends AppError {
  constructor(message = "Token expired") {
    super(401, message, "TOKEN_EXPIRED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(403, message, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(404, message, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(409, message, "CONFLICT");
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: unknown) {
    super(400, message, "VALIDATION_ERROR", details);
  }
}

export class RateLimitError extends AppError {
  constructor(
    message = "Rate limit exceeded",
    public retryAfter?: number,
  ) {
    super(429, message, "RATE_LIMITED");
  }
}

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

export const errorPlugin = new Elysia({ name: "error" })
  .state("requestId", "")
  .onRequest(({ store, request, set }) => {
    const requestId = resolveRequestId(request);
    store.requestId = requestId;
    set.headers["x-request-id"] = requestId;
  })
  .error({ APP_ERROR: AppError })
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
