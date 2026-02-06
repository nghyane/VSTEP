import type { TObject, TSchema } from "@sinclair/typebox";
import type { Table } from "drizzle-orm";
import { createSchemaFactory } from "drizzle-typebox";
import { t } from "elysia";

/**
 * Schema factory bound to Elysia's TypeBox instance.
 * Ensures symbol compatibility between drizzle-typebox and Elysia validation.
 *
 * Usage:
 *   import { createSelectSchema, createInsertSchema } from "@common/schemas";
 *   const userSelect = createSelectSchema(users);
 */
export const { createSelectSchema, createInsertSchema, createUpdateSchema } =
  createSchemaFactory({ typeboxInstance: t });

// ─── Response Schema Helper ──────────────────────────────────────

function isDateSchema(schema: TSchema): boolean {
  if ((schema as { type?: string }).type === "Date") return true;
  if ("anyOf" in schema && Array.isArray(schema.anyOf)) {
    return schema.anyOf.some(
      (v: TSchema) =>
        (v as { type?: string }).type === "Date" || isDateSchema(v),
    );
  }
  return false;
}

function isNullable(schema: TSchema): boolean {
  if ("anyOf" in schema && Array.isArray(schema.anyOf)) {
    return schema.anyOf.some(
      (v: TSchema) => (v as { type?: string }).type === "null",
    );
  }
  return false;
}

/**
 * Convert a Drizzle table → JSON-safe response TypeBox schema.
 * - Converts Date/timestamp columns to t.String({ format: "date-time" })
 * - Respects nullable columns
 * - Omits internal fields (e.g. passwordHash, deletedAt)
 *
 * Usage:
 *   const userResponse = createResponseSchema(users, { omit: ["passwordHash", "deletedAt"] });
 */
export function createResponseSchema<T extends Table>(
  table: T,
  opts: { omit?: string[] } = {},
) {
  const schema = createSelectSchema(table) as TObject;
  const omitSet = new Set(opts.omit || []);
  const props: Record<string, TSchema> = {};

  for (const [key, val] of Object.entries(
    schema.properties as Record<string, TSchema>,
  )) {
    if (omitSet.has(key)) continue;

    if (isDateSchema(val)) {
      const dateStr = t.String({ format: "date-time" });
      props[key] = isNullable(val) ? t.Union([dateStr, t.Null()]) : dateStr;
    } else {
      props[key] = val;
    }
  }
  return t.Object(props);
}

// ─── Shared Schemas ──────────────────────────────────────────────

export const PaginationQuery = t.Object({
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
});

export const IdParam = t.Object({
  id: t.String({ format: "uuid" }),
});

export const ErrorResponse = t.Object({
  error: t.Object({
    code: t.String(),
    message: t.String(),
    details: t.Optional(t.Any()),
  }),
  requestId: t.Optional(t.String()),
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
