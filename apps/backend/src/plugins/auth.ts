/**
 * Authentication & authorization plugin for Elysia.
 *
 * Pattern: macro resolve-as-guard — `user` is non-null in protected handlers.
 * JWT verification via jose (granular error handling).
 *
 * @example
 *   .get("/me", ({ user }) => user.sub, { auth: true })
 *   .get("/admin", ({ user }) => user, { role: "admin" })
 */

import { env } from "@common/env";
import { bearer } from "@elysiajs/bearer";
import { Elysia, t } from "elysia";
import { jwtVerify, errors as joseErrors } from "jose";
import { Value } from "@sinclair/typebox/value";
import { ForbiddenError, TokenExpiredError, UnauthorizedError } from "./error";

// ── Types ───────────────────────────────────────────────────────

export type Role = "learner" | "instructor" | "admin";

export interface JWTPayload {
  sub: string;
  jti: string;
  role: Role;
}

// ── Role hierarchy ──────────────────────────────────────────────

const ROLE_LEVEL: Record<Role, number> = {
  learner: 0,
  instructor: 1,
  admin: 2,
};

// ── Runtime validation schema ───────────────────────────────────

const PayloadSchema = t.Object({
  sub: t.String(),
  jti: t.String(),
  role: t.Union([
    t.Literal("learner"),
    t.Literal("instructor"),
    t.Literal("admin"),
  ]),
});

// ── JWT secret (encoded once at startup) ────────────────────────

const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET!);

// ── Verify access token ─────────────────────────────────────────

export async function verifyAccessToken(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (!Value.Check(PayloadSchema, payload)) {
      throw new UnauthorizedError("Malformed token payload");
    }

    return {
      sub: payload.sub as string,
      jti: payload.jti as string,
      role: payload.role as Role,
    };
  } catch (e) {
    if (e instanceof joseErrors.JWTExpired) throw new TokenExpiredError();
    if (e instanceof UnauthorizedError) throw e;
    throw new UnauthorizedError("Invalid token");
  }
}

// ── Plugin ──────────────────────────────────────────────────────

export const authPlugin = new Elysia({ name: "auth" })
  .use(bearer())
  // Type hint: macro resolve injects `user` at runtime, this derive
  // provides the type declaration so TypeScript can see `user` on context.
  // The actual value is always overwritten by the macro resolve guard.
  .derive({ as: "scoped" }, () => ({
    user: undefined as unknown as JWTPayload,
  }))
  .macro({
    auth(enabled: boolean) {
      if (!enabled) return;
      return {
        async resolve({ bearer: token }: { bearer: string | undefined }) {
          if (!token)
            throw new UnauthorizedError("Authentication required");
          return { user: await verifyAccessToken(token) };
        },
      };
    },
    role(required: Role) {
      return {
        async resolve({ bearer: token }: { bearer: string | undefined }) {
          if (!token)
            throw new UnauthorizedError("Authentication required");
          const user = await verifyAccessToken(token);
          if (ROLE_LEVEL[user.role] < ROLE_LEVEL[required]) {
            throw new ForbiddenError(
              `${required.charAt(0).toUpperCase() + required.slice(1)} access required`,
            );
          }
          return { user };
        },
      };
    },
  });
