import { type Actor, ROLES } from "@common/auth-types";
import { ForbiddenError, NotFoundError } from "@common/errors";

export function assertExists<T>(
  value: T | null | undefined,
  resource: string,
): T {
  if (value === null || value === undefined) {
    throw new NotFoundError(`${resource} not found`);
  }
  return value;
}

/** Escape special LIKE characters to prevent wildcard abuse */
export function escapeLike(str: string): string {
  return str.replace(/[%_\\]/g, "\\$&");
}

/** Owner or admin bypass — works with the 3-role hierarchy. Null owner = no owner, only admin can access. */
export function assertAccess(
  resourceUserId: string | null,
  actor: Actor,
  message = "You do not have access to this resource",
): void {
  if (resourceUserId !== null && resourceUserId === actor.sub) return;
  if (actor.is(ROLES.ADMIN)) return;
  throw new ForbiddenError(message);
}
