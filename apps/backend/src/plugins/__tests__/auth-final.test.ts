/**
 * Final POC: Test pattern chính xác sẽ triển khai.
 *
 * Pattern: macro resolve-as-guard + jose + custom error classes + role hierarchy
 */
import { describe, test, expect } from "bun:test";
import { Elysia, t } from "elysia";
import { bearer } from "@elysiajs/bearer";
import { SignJWT, jwtVerify, errors as joseErrors } from "jose";
import { Value } from "@sinclair/typebox/value";

// ── Simulated error classes (như error.ts) ───────
class AppError extends Error {
  constructor(
    public status: number,
    message: string,
    public code: string,
  ) {
    super(message);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, message, "UNAUTHORIZED");
  }
}

class TokenExpiredError extends AppError {
  constructor(message = "Token expired") {
    super(401, message, "TOKEN_EXPIRED");
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(403, message, "FORBIDDEN");
  }
}

// ── Constants ───────────────────────────────────
const SECRET = new TextEncoder().encode(
  "test-secret-key-must-be-at-least-32-chars-long!!",
);

type Role = "learner" | "instructor" | "admin";

interface JWTPayload {
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

// ── Core verify function ────────────────────────
async function verifyAccessToken(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, SECRET);

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
    if (e instanceof AppError) throw e;
    throw new UnauthorizedError("Invalid token");
  }
}

// ── Helper: sign token ──────────────────────────
async function signToken(
  payload: Record<string, unknown>,
  exp: string | number = "15m",
) {
  const builder = new SignJWT(payload).setProtectedHeader({ alg: "HS256" });
  if (typeof exp === "string") {
    builder.setExpirationTime(exp);
  } else {
    builder.setExpirationTime(exp);
  }
  return builder.sign(SECRET);
}

// ── Build app: chuẩn xác pattern sẽ triển khai ─
const app = new Elysia()
  .use(bearer())
  // Error handling (giống errorPlugin)
  .error({
    APP_ERROR: AppError,
    UNAUTHORIZED: UnauthorizedError,
    TOKEN_EXPIRED: TokenExpiredError,
    FORBIDDEN: ForbiddenError,
  })
  .onError(({ error, set }) => {
    if (error instanceof AppError) {
      set.status = error.status;
      return { error: { code: error.code, message: error.message } };
    }
  })
  // Auth macros
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
  })
  // Routes
  .get("/public", () => ({ message: "public" }))
  .get(
    "/protected",
    ({ user }) => ({ userId: user.sub, role: user.role }),
    { auth: true },
  )
  .get(
    "/admin-only",
    ({ user }) => ({ userId: user.sub, role: user.role }),
    { role: "admin" as Role },
  )
  .get(
    "/instructor-up",
    ({ user }) => ({ userId: user.sub, role: user.role }),
    { role: "instructor" as Role },
  );

// ════════════════════════════════════════════════
// TESTS
// ════════════════════════════════════════════════
describe("Auth Plugin — Final Pattern", () => {
  // ── Public routes ─────────────────────────────
  test("GET /public — no token → 200", async () => {
    const res = await app.handle(new Request("http://localhost/public"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: "public" });
  });

  // ── auth: true ────────────────────────────────
  test("GET /protected — no token → 401 UNAUTHORIZED", async () => {
    const res = await app.handle(
      new Request("http://localhost/protected"),
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  test("GET /protected — valid token → 200 with user", async () => {
    const token = await signToken({
      sub: "user-123",
      jti: "jti-abc",
      role: "learner",
    });
    const res = await app.handle(
      new Request("http://localhost/protected", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.userId).toBe("user-123");
    expect(body.role).toBe("learner");
  });

  test("GET /protected — expired token → 401 TOKEN_EXPIRED", async () => {
    const token = await signToken(
      { sub: "user-1", jti: "jti-1", role: "learner" },
      Math.floor(Date.now() / 1000) - 3600,
    );
    const res = await app.handle(
      new Request("http://localhost/protected", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("TOKEN_EXPIRED");
  });

  test("GET /protected — tampered token → 401 UNAUTHORIZED", async () => {
    const token = await signToken({
      sub: "user-1",
      jti: "jti-1",
      role: "admin",
    });
    const tampered = token.slice(0, -5) + "XXXXX";
    const res = await app.handle(
      new Request("http://localhost/protected", {
        headers: { Authorization: `Bearer ${tampered}` },
      }),
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  test("GET /protected — malformed token → 401 UNAUTHORIZED", async () => {
    const res = await app.handle(
      new Request("http://localhost/protected", {
        headers: { Authorization: "Bearer not-a-jwt" },
      }),
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  test("GET /protected — missing payload fields (no jti) → 401", async () => {
    const token = await signToken({ sub: "user-1", role: "admin" });
    const res = await app.handle(
      new Request("http://localhost/protected", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    expect(res.status).toBe(401);
  });

  test("GET /protected — invalid role in token → 401", async () => {
    const token = await signToken({
      sub: "user-1",
      jti: "jti-1",
      role: "superadmin",
    });
    const res = await app.handle(
      new Request("http://localhost/protected", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    expect(res.status).toBe(401);
  });

  // ── role: "admin" ─────────────────────────────
  test("GET /admin-only — admin token → 200", async () => {
    const token = await signToken({
      sub: "admin-1",
      jti: "jti-1",
      role: "admin",
    });
    const res = await app.handle(
      new Request("http://localhost/admin-only", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.role).toBe("admin");
  });

  test("GET /admin-only — learner token → 403 FORBIDDEN", async () => {
    const token = await signToken({
      sub: "user-1",
      jti: "jti-1",
      role: "learner",
    });
    const res = await app.handle(
      new Request("http://localhost/admin-only", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  test("GET /admin-only — instructor token → 403 FORBIDDEN", async () => {
    const token = await signToken({
      sub: "inst-1",
      jti: "jti-1",
      role: "instructor",
    });
    const res = await app.handle(
      new Request("http://localhost/admin-only", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  test("GET /admin-only — no token → 401", async () => {
    const res = await app.handle(
      new Request("http://localhost/admin-only"),
    );
    expect(res.status).toBe(401);
  });

  // ── role: "instructor" (instructor OR admin) ──
  test("GET /instructor-up — instructor token → 200", async () => {
    const token = await signToken({
      sub: "inst-1",
      jti: "jti-1",
      role: "instructor",
    });
    const res = await app.handle(
      new Request("http://localhost/instructor-up", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    expect(res.status).toBe(200);
  });

  test("GET /instructor-up — admin token → 200 (admin ⊃ instructor)", async () => {
    const token = await signToken({
      sub: "admin-1",
      jti: "jti-1",
      role: "admin",
    });
    const res = await app.handle(
      new Request("http://localhost/instructor-up", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    expect(res.status).toBe(200);
  });

  test("GET /instructor-up — learner token → 403", async () => {
    const token = await signToken({
      sub: "user-1",
      jti: "jti-1",
      role: "learner",
    });
    const res = await app.handle(
      new Request("http://localhost/instructor-up", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    expect(res.status).toBe(403);
  });
});
