import { t } from "elysia";

// ─── Shared Schemas ──────────────────────────────────────────────

export const PaginationQuery = t.Object({
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
});

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
