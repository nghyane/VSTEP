import { t } from "elysia";

/**
 * Drizzle-Typebox utilities
 * Helps with spreading schemas and creating consistent models
 */

/**
 * Spread a TypeBox object schema's properties
 * Useful for composing schemas
 */
export function spread(schema: any) {
  return schema.properties;
}

/**
 * Common pagination schema
 */
export const PaginationQuery = t.Object({
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
});

/**
 * Common ID parameter schema
 */
export const IdParam = t.Object({
  id: t.String({ format: "uuid" }),
});

/**
 * Standard error response schema
 */
export const ErrorResponse = t.Object({
  error: t.Object({
    code: t.String(),
    message: t.String(),
  }),
  requestId: t.Optional(t.String()),
});

/**
 * Standard success message response
 */
export const SuccessMessageResponse = t.Object({
  message: t.String(),
});

/**
 * Standard ID response
 */
export const IdResponse = t.Object({
  id: t.String({ format: "uuid" }),
});

/**
 * Metadata for paginated responses
 */
export const PaginationMeta = t.Object({
  page: t.Number(),
  limit: t.Number(),
  total: t.Number(),
  totalPages: t.Number(),
});
