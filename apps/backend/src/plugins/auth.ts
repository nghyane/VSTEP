import {
  type Actor,
  type JWTPayload,
  ROLE_LEVEL,
  ROLES,
  type Role,
} from "@common/auth-types";
import { env } from "@common/env";
import {
  ForbiddenError,
  TokenExpiredError,
  UnauthorizedError,
} from "@common/errors";
import { bearer } from "@elysiajs/bearer";
import type { Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { Elysia, t } from "elysia";
import { errors as joseErrors, jwtVerify } from "jose";

export type { Actor, JWTPayload, Role };

function toActor(payload: JWTPayload): Actor {
  return {
    ...payload,
    is: (required: Role) => ROLE_LEVEL[payload.role] >= ROLE_LEVEL[required],
  };
}

const PayloadSchema = t.Object({
  sub: t.String(),
  jti: t.String(),
  role: t.Union(Object.values(ROLES).map((r) => t.Literal(r))),
});

if (!env.JWT_SECRET) throw new Error("JWT_SECRET is required");
const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);

export async function verifyAccessToken(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (!Value.Check(PayloadSchema, payload)) {
      throw new UnauthorizedError("Malformed token payload");
    }

    const validated = payload as Static<typeof PayloadSchema>;
    return { sub: validated.sub, jti: validated.jti, role: validated.role };
  } catch (e) {
    if (e instanceof joseErrors.JWTExpired) throw new TokenExpiredError();
    if (e instanceof UnauthorizedError) throw e;
    throw new UnauthorizedError("Invalid token");
  }
}

export const authPlugin = new Elysia({ name: "auth" })
  .use(bearer())
  // Elysia macro typing workaround: `user` is overwritten by auth/role
  // resolvers before any handler that requires authentication accesses it.
  .derive({ as: "scoped" }, () => ({
    user: undefined as unknown as Actor,
  }))
  .macro({
    auth(enabled: boolean) {
      if (!enabled) return;
      return {
        async resolve({ bearer: token }: { bearer: string | undefined }) {
          if (!token) throw new UnauthorizedError("Authentication required");
          return { user: toActor(await verifyAccessToken(token)) };
        },
      };
    },
    role(required: Role) {
      return {
        async resolve({ bearer: token }: { bearer: string | undefined }) {
          if (!token) throw new UnauthorizedError("Authentication required");
          const user = toActor(await verifyAccessToken(token));
          if (!user.is(required)) {
            throw new ForbiddenError(
              `${required.charAt(0).toUpperCase() + required.slice(1)} access required`,
            );
          }
          return { user };
        },
      };
    },
  });
