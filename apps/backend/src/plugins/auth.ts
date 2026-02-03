import { jwt } from "@elysiajs/jwt";
import type { Elysia } from "elysia";
import { env } from "../common/env";

export interface JWTPayload {
  sub: string;
  email: string;
  role: "learner" | "instructor" | "admin";
}

export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password, {
    algorithm: "argon2id",
    memoryCost: 65536,
    timeCost: 3,
  });
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return Bun.password.verify(password, hash);
}

export const authPlugin = () => (app: Elysia) =>
  app
    .use(
      jwt({
        name: "jwt",
        secret: env.JWT_SECRET,
        exp: env.JWT_EXPIRES_IN,
      }),
    )
    .derive(
      async ({
        jwt,
        cookie,
      }): Promise<{
        user: JWTPayload | null;
        isAuthenticated: boolean;
        setAuthCookie: (token: string) => void;
        clearAuthCookie: () => void;
      }> => {
        const auth = cookie.auth;
        let user: JWTPayload | null = null;

        const token = auth?.value;
        if (token && typeof token === "string") {
          try {
            const payload = await jwt.verify(token);
            if (payload && typeof payload === "object" && "email" in payload) {
              user = payload as unknown as JWTPayload;
            }
          } catch {
            user = null;
          }
        }

        return {
          user,
          isAuthenticated: !!user,
          setAuthCookie: (token: string): void => {
            if (!auth) return;
            auth.set({
              value: token,
              httpOnly: true,
              secure: env.NODE_ENV === "production",
              sameSite: "strict",
              maxAge: 7 * 24 * 60 * 60,
              path: "/",
            });
          },
          clearAuthCookie: (): void => {
            if (!auth) return;
            auth.remove();
          },
        };
      },
    )
    .macro(({ onBeforeHandle }) => ({
      auth(enabled: boolean) {
        if (!enabled) return;
        onBeforeHandle(
          (ctx: {
            user: JWTPayload | null;
            error: (status: number, body: unknown) => void;
          }) => {
            if (!ctx.user) {
              return ctx.error(401, { error: "Unauthorized" });
            }
          },
        );
      },
      roles(allowedRoles: Array<"learner" | "instructor" | "admin">) {
        onBeforeHandle(
          (ctx: {
            user: JWTPayload | null;
            error: (status: number, body: unknown) => void;
          }) => {
            if (!ctx.user) {
              return ctx.error(401, { error: "Unauthorized" });
            }
            if (!allowedRoles.includes(ctx.user.role)) {
              return ctx.error(403, { error: "Forbidden" });
            }
          },
        );
      },
    }));
