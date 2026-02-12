import { QuestionLevel, Skill } from "@db/enums";
import { t } from "elysia";

export const PaginationQuery = t.Object({
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
});

export const IdParam = t.Object({
  id: t.String({ format: "uuid" }),
});

export const SkillFilter = t.Object({
  skill: t.Optional(Skill),
});

export const LevelFilter = t.Object({
  level: t.Optional(QuestionLevel),
});

export const SearchFilter = t.Object({
  search: t.Optional(t.String({ maxLength: 255 })),
});

export const ActiveFilter = t.Object({
  isActive: t.Optional(t.Boolean()),
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
