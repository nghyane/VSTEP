function has<K extends string>(v: unknown, k: K): v is Record<K, unknown> {
  return typeof v === "object" && v !== null && k in v;
}

function pgCode(v: unknown) {
  if (has(v, "code") && String(v.code) === "23505") return "23505";
  if (has(v, "errno") && String(v.errno) === "23505") return "23505";
  return null;
}

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

  toResponse(requestId: string) {
    return {
      requestId,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details !== undefined && { details: this.details }),
      },
    };
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

export function isUniqueViolation(err: unknown) {
  if (pgCode(err) === "23505") return true;
  if (has(err, "cause") && pgCode(err.cause) === "23505") return true;
  return false;
}
