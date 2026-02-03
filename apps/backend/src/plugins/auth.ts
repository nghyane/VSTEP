/**
 * Shared Authentication Plugin
 * Provides guard macros for authentication
 * Pattern: Elysia derive for type-safe auth context
 */

import { env } from "@common/env";
import { Elysia } from "elysia";
import { AuthService, type JWTPayload } from "@/modules/auth/service";
import { ForbiddenError, UnauthorizedError } from "./error";

/**
 * Auth plugin with derive and guard macros
 * - Derives user from JWT token (cookie or Authorization header)
 * - Provides `auth` macro for authentication guard
 * - Provides `admin` macro for admin-only access
 */
export const authPlugin = new Elysia({ name: "auth" })
  .derive({ as: "global" }, async ({ cookie, headers }) => {
    let token: string | undefined;

    // Check cookie first, then Authorization header
    if (cookie?.auth?.value) {
      token = String(cookie.auth.value);
    } else if (headers.authorization?.startsWith("Bearer ")) {
      token = headers.authorization.slice(7);
    }

    const user = token
      ? await AuthService.verifyToken(token, env.JWT_SECRET)
      : null;

    return {
      user,
      isAuthenticated: !!user,
      isAdmin: user?.role === "admin",
      userId: user?.sub || null,
    } as {
      user: JWTPayload | null;
      isAuthenticated: boolean;
      isAdmin: boolean;
      userId: string | null;
    };
  })
  .macro(({ onBeforeHandle }) => ({
    /**
     * Auth guard - requires authentication
     * Usage: .get("/", () => "ok", { auth: true })
     */
    auth(enabled: boolean) {
      if (!enabled) return;
      onBeforeHandle(({ user }: { user: JWTPayload | null }) => {
        if (!user) {
          throw new UnauthorizedError("Authentication required");
        }
      });
    },
    /**
     * Admin guard - requires admin role
     * Usage: .get("/", () => "ok", { admin: true })
     */
    admin(enabled: boolean) {
      if (!enabled) return;
      onBeforeHandle(({ user }: { user: JWTPayload | null }) => {
        if (!user) {
          throw new UnauthorizedError("Authentication required");
        }
        if (user.role !== "admin") {
          throw new ForbiddenError("Admin access required");
        }
      });
    },
  }));
