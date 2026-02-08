import { env } from "@common/env";
import type { userRoleEnum } from "@db/schema/users";
import { bearer } from "@elysiajs/bearer";
import { Value } from "@sinclair/typebox/value";
import { Elysia, t } from "elysia";
import { errors as joseErrors, jwtVerify } from "jose";
import { ForbiddenError, TokenExpiredError, UnauthorizedError } from "./error";

export type Role = (typeof userRoleEnum.enumValues)[number];

export interface JWTPayload {
  sub: string;
  jti: string;
  role: Role;
}

export interface Actor extends JWTPayload {
  is(required: Role): boolean;
}

const ROLE_LEVEL: Record<Role, number> = {
  learner: 0,
  instructor: 1,
  admin: 2,
};

function toActor(payload: JWTPayload): Actor {
  return {
    ...payload,
    is: (required: Role) => ROLE_LEVEL[payload.role] >= ROLE_LEVEL[required],
  };
}

const PayloadSchema = t.Object({
  sub: t.String(),
  jti: t.String(),
  role: t.Union([
    t.Literal("learner"),
    t.Literal("instructor"),
    t.Literal("admin"),
  ]),
});

if (!env.JWT_SECRET) throw new Error("JWT_SECRET is required");
const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);

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
