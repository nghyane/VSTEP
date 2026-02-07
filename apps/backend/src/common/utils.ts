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

/** Reusable ownership + admin check */
export function assertOwnerOrAdmin(
  resourceUserId: string,
  currentUserId: string,
  isAdmin: boolean,
  message = "You do not have access to this resource",
): void {
  if (resourceUserId !== currentUserId && !isAdmin) {
    throw new ForbiddenError(message);
  }
}
