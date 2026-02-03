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
 * Assert that a value exists or return null
 * Use for optional fields that might be null
 */
export function assertExistsOrNull<T>(
  value: T | null | undefined,
): T | null {
  if (value === null || value === undefined) {
    return null;
  }
  return value;
}

/**
 * Convert Date to ISO string or return undefined if null
 */
export function toISOString(date: Date | null): string | undefined {
  return date?.toISOString();
}

/**
 * Convert Date to ISO string (required)
 */
export function toISOStringRequired(date: Date): string {
  return date.toISOString();
}
