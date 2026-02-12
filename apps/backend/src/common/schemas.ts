import { t } from "elysia";

export const IdParam = t.Object({
  id: t.String({ format: "uuid" }),
});

export const ErrorResponse = t.Object({
  requestId: t.Optional(t.String()),
  error: t.Object({
    code: t.String(),
    message: t.String(),
    details: t.Optional(t.Any()),
  }),
});

export const SuccessResponse = t.Object({
  message: t.String(),
});

export const PaginationMeta = t.Object({
  page: t.Number(),
  limit: t.Number(),
  total: t.Number(),
  totalPages: t.Number(),
});

export const AuthErrors = { 401: ErrorResponse, 403: ErrorResponse } as const;
export const CrudErrors = { ...AuthErrors, 404: ErrorResponse } as const;
export const CrudWithConflictErrors = {
  ...CrudErrors,
  409: ErrorResponse,
} as const;
