import {
  type Actor,
  type JWTPayload,
  ROLE_LEVEL,
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

function toActor(payload: JWTPayload): Actor {
  return {
    ...payload,
    is: (required: Role) => ROLE_LEVEL[payload.role] >= ROLE_LEVEL[required],
  };
}

const PayloadSchema = t.Object({
  sub: t.String(),
  role: t.UnionEnum(["learner", "instructor", "admin"]),
});

const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);

export async function verifyAccessToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET).catch((e) => {
    if (e instanceof joseErrors.JWTExpired) throw new TokenExpiredError();
    throw new UnauthorizedError("Invalid token");
  });

  if (!Value.Check(PayloadSchema, payload)) {
    throw new UnauthorizedError("Malformed token payload");
  }

  const p = payload as Static<typeof PayloadSchema>;
  return { sub: p.sub, role: p.role };
}

/** Shared: extract bearer → verify → Actor (throws on failure) */
async function resolveActor(token: string | undefined): Promise<Actor> {
  if (!token) throw new UnauthorizedError("Authentication required");
  return toActor(await verifyAccessToken(token));
}

export const authPlugin = new Elysia({ name: "auth" })
  .use(bearer())
  .derive({ as: "scoped" }, () => ({
    user: undefined as unknown as Actor,
  }))
  .macro({
    auth(enabled: boolean) {
      if (!enabled) return;
      return {
        async resolve({ bearer: token }: { bearer: string | undefined }) {
          return { user: await resolveActor(token) };
        },
      };
    },
    role(required: Role) {
      return {
        async resolve({ bearer: token }: { bearer: string | undefined }) {
          const user = await resolveActor(token);
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
