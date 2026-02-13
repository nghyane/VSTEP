import { type Actor, ROLES } from "@common/auth-types";
import { ForbiddenError, NotFoundError } from "@common/errors";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function assertExists<T>(
  value: T | null | undefined,
  resource: string,
): T {
  if (value === null || value === undefined) {
    throw new NotFoundError(`${resource} not found`);
  }
  return value;
}

export function escapeLike(str: string): string {
  return str.replace(/[%_\\]/g, "\\$&");
}

/** Null owner = no owner, only admin can access */
export function assertAccess(
  resourceUserId: string | null,
  actor: Actor,
  message = "You do not have access to this resource",
): void {
  if (resourceUserId !== null && resourceUserId === actor.sub) return;
  if (actor.is(ROLES.ADMIN)) return;
  throw new ForbiddenError(message);
}

/** Generate a cryptographically random invite code (base64url, 16 bytes = 22 chars). */
export function generateInviteCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Buffer.from(bytes).toString("base64url");
}
