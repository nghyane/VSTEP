import { KnowledgePointCategory } from "@db/enums";
import { t } from "elysia";

// ---------------------------------------------------------------------------
// Response schemas
// ---------------------------------------------------------------------------

export const KnowledgePoint = t.Object({
  id: t.String({ format: "uuid" }),
  category: KnowledgePointCategory,
  name: t.String(),
  createdAt: t.String(),
  updatedAt: t.String(),
});
export type KnowledgePoint = typeof KnowledgePoint.static;

// ---------------------------------------------------------------------------
// Request schemas
// ---------------------------------------------------------------------------

export const KnowledgePointCreateBody = t.Object({
  category: KnowledgePointCategory,
  name: t.String({ minLength: 1, maxLength: 200 }),
});

export const KnowledgePointUpdateBody = t.Object({
  category: t.Optional(KnowledgePointCategory),
  name: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
});

export const KnowledgePointListQuery = t.Object({
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 50 })),
  category: t.Optional(KnowledgePointCategory),
  search: t.Optional(t.String({ maxLength: 255 })),
});

export type KnowledgePointCreateBody = typeof KnowledgePointCreateBody.static;
export type KnowledgePointUpdateBody = typeof KnowledgePointUpdateBody.static;
export type KnowledgePointListQuery = typeof KnowledgePointListQuery.static;
