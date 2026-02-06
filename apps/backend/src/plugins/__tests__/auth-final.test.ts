import "./test-env";
import { describe, test, expect } from "bun:test";
import { Elysia } from "elysia";
import { SignJWT } from "jose";
import { authPlugin, type Role } from "../auth";
import { errorPlugin } from "../error";

const SECRET = new TextEncoder().encode(
  "test-secret-key-must-be-at-least-32-chars-long!!",
);

async function signToken(
  payload: Record<string, unknown>,
  exp: string | number = "15m",
) {
  const builder = new SignJWT(payload).setProtectedHeader({ alg: "HS256" });
  builder.setExpirationTime(exp);
  return builder.sign(SECRET);
}

const app = new Elysia()
  .use(errorPlugin)
  .use(authPlugin)
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

describe("Auth Plugin", () => {
  test("GET /public — no token → 200", async () => {
    const res = await app.handle(new Request("http://localhost/public"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: "public" });
  });

  test("GET /protected — no token → 401 UNAUTHORIZED", async () => {
    const res = await app.handle(
      new Request("http://localhost/protected"),
    );
    expect(res.status).toBe(401);
    const body: any = await res.json();
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
    const body: any = await res.json();
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
    const body: any = await res.json();
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
    const body: any = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  test("GET /protected — malformed token → 401 UNAUTHORIZED", async () => {
    const res = await app.handle(
      new Request("http://localhost/protected", {
        headers: { Authorization: "Bearer not-a-jwt" },
      }),
    );
    expect(res.status).toBe(401);
    const body: any = await res.json();
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
    const body: any = await res.json();
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
    const body: any = await res.json();
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
    const body: any = await res.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  test("GET /admin-only — no token → 401", async () => {
    const res = await app.handle(
      new Request("http://localhost/admin-only"),
    );
    expect(res.status).toBe(401);
  });

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

  test("GET /instructor-up — admin token → 200 (admin > instructor)", async () => {
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
