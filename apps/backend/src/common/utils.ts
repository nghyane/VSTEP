/**
 * Common utilities for the application
 */

import { NotFoundError } from "@/plugins/error";

/**
 * Assert that a value exists or throw NotFoundError
 */
export function assertExists<T>(
  value: T | null | undefined,
  resource: string,
): T {
  if (value === null || value === undefined) {
    throw new NotFoundError(`${resource} not found`);
  }
  return value;
}

/**
 * Convert all Date fields in an object to ISO-8601 strings.
 * Elysia validates responses before JSON serialization, so Date objects
 * would fail against t.String({ format: "date-time" }) schemas.
 */
export function serializeDates<T extends Record<string, unknown>>(obj: T) {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    result[key] = val instanceof Date ? val.toISOString() : val;
  }
  return result;
}
