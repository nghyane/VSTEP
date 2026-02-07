import type { Actor } from "@/plugins/auth";
import { ForbiddenError, NotFoundError } from "@/plugins/error";

export function assertExists<T>(
  value: T | null | undefined,
  resource: string,
): T {
  if (value === null || value === undefined) {
    throw new NotFoundError(`${resource} not found`);
  }
  return value;
}

/** ISO timestamp — use a single call per operation for consistent timestamps */
export function now(): string {
  return new Date().toISOString();
}

/** Escape special LIKE characters to prevent wildcard abuse */
export function escapeLike(str: string): string {
  return str.replace(/[%_\\]/g, "\\$&");
}

/** Owner or admin bypass — works with the 3-role hierarchy */
export function assertAccess(
  resourceUserId: string,
  actor: Actor,
  message = "You do not have access to this resource",
): void {
  if (resourceUserId === actor.sub || actor.is("admin")) return;
  throw new ForbiddenError(message);
}
