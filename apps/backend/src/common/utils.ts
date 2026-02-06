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
