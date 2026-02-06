import { env } from "@common/env";
import { bearer } from "@elysiajs/bearer";
import { jwt } from "@elysiajs/jwt";
import { Elysia } from "elysia";
import { ForbiddenError, TokenExpiredError, UnauthorizedError } from "./error";

export interface JWTPayload {
  sub: string;
  jti: string;
  role: "learner" | "instructor" | "admin";
}

/** Decode JWT payload without signature verification (for expiry detection) */
function decodePayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  } catch {
    return null;
  }
}

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
    if (!payload) {
      // Distinguish expired from invalid
      const decoded = decodePayload(token);
      if (decoded?.exp && (decoded.exp as number) < Date.now() / 1000) {
        throw new TokenExpiredError();
      }
      return { user: null as JWTPayload | null };
    }

    return {
      user: {
        sub: payload.sub as string,
        jti: (payload.jti as string) || "",
        role: (payload.role as JWTPayload["role"]) || "learner",
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
