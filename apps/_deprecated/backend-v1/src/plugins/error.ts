import { AppError } from "@common/errors";
import { logger } from "@common/logger";
import { Elysia } from "elysia";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function resolveRequestId(request: Request) {
  const header = request.headers.get("x-request-id");
  return header && UUID_RE.test(header) ? header : crypto.randomUUID();
}

export const errorPlugin = new Elysia({ name: "error" })
  .derive({ as: "scoped" }, ({ request }) => ({
    requestId: resolveRequestId(request),
  }))
  .onAfterHandle({ as: "scoped" }, ({ requestId, set }) => {
    set.headers["x-request-id"] = requestId;
  })
  .error({ APP_ERROR: AppError })
  .onError(function onError({ code, error, set, requestId }) {
    set.headers["x-request-id"] = requestId;

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
      return error.toResponse(requestId || "");
    }

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
