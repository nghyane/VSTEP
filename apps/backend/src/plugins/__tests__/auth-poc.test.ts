/**
 * POC Test: Xác nhận các pattern hoạt động trước khi refactor auth plugin.
 *
 * 1. Macro resolve-as-guard: user non-null trong handler, throw nếu thiếu token
 * 2. jose: phân biệt expired vs invalid vs valid
 * 3. TypeBox Value.Check: runtime validation payload
 */
import { describe, test, expect } from "bun:test";
import { Elysia, t } from "elysia";
import { bearer } from "@elysiajs/bearer";
import { SignJWT, jwtVerify, errors as joseErrors } from "jose";
import { Value } from "@sinclair/typebox/value";

// ── Test constants ──────────────────────────────
const SECRET = new TextEncoder().encode(
  "test-secret-key-must-be-at-least-32-chars-long!!",
);

const PayloadSchema = t.Object({
  sub: t.String(),
  jti: t.String(),
  role: t.Union([
    t.Literal("learner"),
    t.Literal("instructor"),
    t.Literal("admin"),
  ]),
});

// ── Helper: sign token ──────────────────────────
async function signToken(
  payload: Record<string, unknown>,
  exp: string | number = "15m",
) {
  const builder = new SignJWT(payload).setProtectedHeader({ alg: "HS256" });
  if (typeof exp === "string") {
    builder.setExpirationTime(exp);
  } else {
    // epoch seconds
    builder.setExpirationTime(exp);
  }
  return builder.sign(SECRET);
}

// ════════════════════════════════════════════════
// TEST 1: jose — phân biệt expired vs invalid
// ════════════════════════════════════════════════
describe("jose error handling", () => {
  test("valid token → returns payload", async () => {
    const token = await signToken({
      sub: "user-1",
      jti: "jti-1",
      role: "admin",
    });

    const { payload } = await jwtVerify(token, SECRET);
    expect(payload.sub).toBe("user-1");
    expect(payload.role).toBe("admin");
  });

  test("expired token → throws JWTExpired", async () => {
    // Token expired 1 hour ago
    const token = await signToken(
      { sub: "user-1", jti: "jti-1", role: "learner" },
      Math.floor(Date.now() / 1000) - 3600,
    );

    try {
      await jwtVerify(token, SECRET);
      expect(true).toBe(false); // should not reach
    } catch (e) {
      expect(e).toBeInstanceOf(joseErrors.JWTExpired);
    }
  });

  test("tampered token → throws JWSSignatureVerificationFailed", async () => {
    const token = await signToken({
      sub: "user-1",
      jti: "jti-1",
      role: "admin",
    });

    // Tamper with the signature
    const parts = token.split(".");
    parts[2] = parts[2].split("").reverse().join("");
    const tampered = parts.join(".");

    try {
      await jwtVerify(tampered, SECRET);
      expect(true).toBe(false);
    } catch (e) {
      expect(e).toBeInstanceOf(joseErrors.JWSSignatureVerificationFailed);
    }
  });

  test("wrong secret → throws JWSSignatureVerificationFailed", async () => {
    const token = await signToken({
      sub: "user-1",
      jti: "jti-1",
      role: "admin",
    });
    const wrongSecret = new TextEncoder().encode("wrong-secret-at-least-32-chars-long!!");

    try {
      await jwtVerify(token, wrongSecret);
      expect(true).toBe(false);
    } catch (e) {
      expect(e).toBeInstanceOf(joseErrors.JWSSignatureVerificationFailed);
    }
  });

  test("malformed token → throws JWSInvalid", async () => {
    try {
      await jwtVerify("not-a-jwt", SECRET);
      expect(true).toBe(false);
    } catch (e) {
      expect(e).toBeInstanceOf(joseErrors.JWSInvalid);
    }
  });
});

// ════════════════════════════════════════════════
// TEST 2: TypeBox Value.Check — runtime validation
// ════════════════════════════════════════════════
describe("TypeBox Value.Check payload validation", () => {
  test("valid payload → passes", () => {
    const payload = { sub: "user-1", jti: "jti-1", role: "admin" };
    expect(Value.Check(PayloadSchema, payload)).toBe(true);
  });

  test("missing sub → fails", () => {
    const payload = { jti: "jti-1", role: "admin" };
    expect(Value.Check(PayloadSchema, payload)).toBe(false);
  });

  test("missing role → fails", () => {
    const payload = { sub: "user-1", jti: "jti-1" };
    expect(Value.Check(PayloadSchema, payload)).toBe(false);
  });

  test("invalid role value → fails", () => {
    const payload = { sub: "user-1", jti: "jti-1", role: "superadmin" };
    expect(Value.Check(PayloadSchema, payload)).toBe(false);
  });

  test("extra fields → still passes (open schema)", () => {
    const payload = {
      sub: "user-1",
      jti: "jti-1",
      role: "learner",
      exp: 1234567890,
      iat: 1234567800,
    };
    expect(Value.Check(PayloadSchema, payload)).toBe(true);
  });
});

// ════════════════════════════════════════════════
// TEST 3: Elysia macro resolve-as-guard pattern
// ════════════════════════════════════════════════
describe("Elysia macro resolve-as-guard", () => {
  // Simulated verifyAccessToken
  async function verifyAccessToken(
    token: string,
  ): Promise<{ sub: string; jti: string; role: string }> {
    try {
      const { payload } = await jwtVerify(token, SECRET);
      if (!Value.Check(PayloadSchema, payload)) {
        throw new Error("Malformed payload");
      }
      return {
        sub: payload.sub as string,
        jti: payload.jti as string,
        role: payload.role as string,
      };
    } catch (e) {
      if (e instanceof joseErrors.JWTExpired)
        throw new Error("TOKEN_EXPIRED");
      throw new Error("UNAUTHORIZED");
    }
  }

  // Build test app with the proposed macro pattern
  const app = new Elysia()
    .use(bearer())
    .macro({
      auth(enabled: boolean) {
        if (!enabled) return;
        return {
          async resolve({
            bearer: token,
          }: {
            bearer: string | undefined;
          }) {
            if (!token) throw new Error("UNAUTHORIZED");
            return { user: await verifyAccessToken(token) };
          },
        };
      },
      role(required: string) {
        const ROLE_LEVEL: Record<string, number> = {
          learner: 0,
          instructor: 1,
          admin: 2,
        };
        return {
          async resolve({
            bearer: token,
          }: {
            bearer: string | undefined;
          }) {
            if (!token) throw new Error("UNAUTHORIZED");
            const user = await verifyAccessToken(token);
            if ((ROLE_LEVEL[user.role] ?? 0) < (ROLE_LEVEL[required] ?? 0)) {
              throw new Error("FORBIDDEN");
            }
            return { user };
          },
        };
      },
    })
    // Public route — no auth
    .get("/public", () => ({ message: "public" }))
    // Auth-required route
    .get(
      "/protected",
      ({ user }) => ({
        userId: user.sub,
        role: user.role,
      }),
      { auth: true },
    )
    // Role-required route
    .get(
      "/admin",
      ({ user }) => ({
        userId: user.sub,
        role: user.role,
      }),
      { role: "admin" },
    )
    .onError(({ error, set }) => {
      if (error.message === "TOKEN_EXPIRED") {
        set.status = 401;
        return { error: "TOKEN_EXPIRED" };
      }
      if (error.message === "UNAUTHORIZED") {
        set.status = 401;
        return { error: "UNAUTHORIZED" };
      }
      if (error.message === "FORBIDDEN") {
        set.status = 403;
        return { error: "FORBIDDEN" };
      }
      set.status = 500;
      return { error: error.message };
    });

  test("public route — no token needed", async () => {
    const res = await app.handle(new Request("http://localhost/public"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("public");
  });

  test("protected route — no token → 401", async () => {
    const res = await app.handle(new Request("http://localhost/protected"));
    expect(res.status).toBe(401);
  });

  test("protected route — valid token → 200 with user", async () => {
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

  test("protected route — expired token → 401 TOKEN_EXPIRED", async () => {
    const token = await signToken(
      { sub: "user-123", jti: "jti-abc", role: "learner" },
      Math.floor(Date.now() / 1000) - 3600,
    );
    const res = await app.handle(
      new Request("http://localhost/protected", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("TOKEN_EXPIRED");
  });

  test("protected route — tampered token → 401 UNAUTHORIZED", async () => {
    const token = await signToken({
      sub: "user-123",
      jti: "jti-abc",
      role: "learner",
    });
    const tampered = token.slice(0, -5) + "XXXXX";
    const res = await app.handle(
      new Request("http://localhost/protected", {
        headers: { Authorization: `Bearer ${tampered}` },
      }),
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("UNAUTHORIZED");
  });

  test("admin route — learner token → 403 FORBIDDEN", async () => {
    const token = await signToken({
      sub: "user-123",
      jti: "jti-abc",
      role: "learner",
    });
    const res = await app.handle(
      new Request("http://localhost/admin", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("FORBIDDEN");
  });

  test("admin route — admin token → 200", async () => {
    const token = await signToken({
      sub: "admin-1",
      jti: "jti-xyz",
      role: "admin",
    });
    const res = await app.handle(
      new Request("http://localhost/admin", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.userId).toBe("admin-1");
    expect(body.role).toBe("admin");
  });

  test("admin route — instructor token → 403", async () => {
    const token = await signToken({
      sub: "inst-1",
      jti: "jti-xyz",
      role: "instructor",
    });
    const res = await app.handle(
      new Request("http://localhost/admin", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    expect(res.status).toBe(403);
  });

  test("protected route — missing payload fields → 401", async () => {
    // Token with missing 'jti' field
    const token = await signToken({ sub: "user-1", role: "admin" });
    const res = await app.handle(
      new Request("http://localhost/protected", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    expect(res.status).toBe(401);
  });
});
