import { env } from "@common/env";
import type { userRoleEnum } from "@db/schema/users";
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

const ROLE_LEVEL: Record<Role, number> = {
  learner: 0,
  instructor: 1,
  admin: 2,
};

const PayloadSchema = t.Object({
  sub: t.String(),
  jti: t.String(),
  role: t.Union([
    t.Literal("learner"),
    t.Literal("instructor"),
    t.Literal("admin"),
  ]),
});

export const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET!);

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

/** Extract bearer token from Authorization header (validates "Bearer" scheme) */
function extractBearer(request: Request): string | undefined {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return undefined;
  return header.slice(7);
}

/** Shared auth logic — verify bearer token and return JWT payload */
async function authenticate(token: string | undefined): Promise<JWTPayload> {
  if (!token) throw new UnauthorizedError("Authentication required");
  return verifyAccessToken(token);
}

export const authPlugin = new Elysia({ name: "auth" })
  // Elysia macros don't propagate resolve types — this derive provides
  // the type declaration so TypeScript sees `user` on handler context.
  .derive({ as: "scoped" }, () => ({
    user: undefined as unknown as JWTPayload,
  }))
  .macro({
    auth(enabled: boolean) {
      if (!enabled) return;
      return {
        async resolve({ request }: { request: Request }) {
          return { user: await authenticate(extractBearer(request)) };
        },
      };
    },
    role(required: Role) {
      return {
        async resolve({ request }: { request: Request }) {
          const user = await authenticate(extractBearer(request));
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
