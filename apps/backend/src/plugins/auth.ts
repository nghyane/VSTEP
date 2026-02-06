import { env } from "@common/env";
import { bearer } from "@elysiajs/bearer";
import { jwt } from "@elysiajs/jwt";
import { Elysia } from "elysia";
import { ForbiddenError, UnauthorizedError } from "./error";

export interface JWTPayload {
  sub: string;
  email: string;
  role: "learner" | "instructor" | "admin";
  fullName: string | null;
}

/**
 * Auth plugin — @elysiajs/jwt + @elysiajs/bearer + resolve + macro
 *
 * Provides:
 *   context.jwt        — sign/verify access tokens
 *   context.refreshJwt  — sign/verify refresh tokens
 *   context.bearer      — extracted Bearer token string
 *   context.user        — JWTPayload | null (resolved per request)
 *
 * Macros:
 *   { auth: true }                    — require authenticated user
 *   { role: "admin" }                 — require specific role
 *   { role: "instructor" }            — require instructor or admin
 */
export const authPlugin = new Elysia({ name: "auth" })
  .use(bearer())
  .use(
    jwt({
      name: "jwt",
      secret: env.JWT_SECRET,
      exp: env.JWT_EXPIRES_IN,
    }),
  )
  .use(
    jwt({
      name: "refreshJwt",
      secret: env.JWT_REFRESH_SECRET || env.JWT_SECRET,
      exp: env.JWT_REFRESH_EXPIRES_IN,
    }),
  )
  .resolve({ as: "global" }, async ({ jwt: jwtCtx, bearer: token }) => {
    if (!token) return { user: null as JWTPayload | null };

    const payload = await jwtCtx.verify(token);
    if (!payload) return { user: null as JWTPayload | null };

    return {
      user: {
        sub: payload.sub as string,
        email: payload.email as string,
        role: (payload.role as JWTPayload["role"]) || "learner",
        fullName: (payload.fullName as string) || null,
      } satisfies JWTPayload,
    };
  })
  .macro({
    auth(enabled: boolean) {
      if (!enabled) return;
      return {
        beforeHandle({ user }: { user: JWTPayload | null }) {
          if (!user) throw new UnauthorizedError("Authentication required");
        },
      };
    },
    role(required: "admin" | "instructor") {
      return {
        beforeHandle({ user }: { user: JWTPayload | null }) {
          if (!user) throw new UnauthorizedError("Authentication required");
          if (required === "admin" && user.role !== "admin") {
            throw new ForbiddenError("Admin access required");
          }
          if (
            required === "instructor" &&
            user.role !== "instructor" &&
            user.role !== "admin"
          ) {
            throw new ForbiddenError("Instructor access required");
          }
        },
      };
    },
  });
