import { afterAll, beforeEach, describe, expect, it } from "bun:test";
import {
  api,
  buildTestEmail,
  cleanupTestData,
  createTestUser,
  expectError,
  loginTestUser,
  testEmailPrefix,
} from "./helpers";

describe("auth integration", () => {
  beforeEach(() => cleanupTestData());
  afterAll(() => cleanupTestData());

  it("registers a learner account", async () => {
    const email = buildTestEmail();
    const { status, data } = await api.post("/api/auth/register", {
      body: {
        email,
        password: "Password123!",
        fullName: "Integration Learner",
      },
    });

    expect(status).toBe(201);
    expect(data.message).toBe("Account created successfully");

    const user = data.user as Record<string, unknown>;
    expect(user.email).toBe(email);
    expect(user.role).toBe("learner");
  });

  it("normalizes email to lowercase on register", async () => {
    const rawEmail = `${testEmailPrefix}${crypto.randomUUID()}@TEST.COM`;
    const { status, data } = await api.post("/api/auth/register", {
      body: {
        email: rawEmail,
        password: "Password123!",
        fullName: "Case Test",
      },
    });

    expect(status).toBe(201);
    const user = data.user as Record<string, unknown>;
    expect(user.email).toBe(rawEmail.toLowerCase());
  });

  it("rejects duplicate register email", async () => {
    const email = buildTestEmail();
    const body = {
      email,
      password: "Password123!",
      fullName: "Duplicate User",
    };

    await api.post("/api/auth/register", { body });
    const result = await api.post("/api/auth/register", { body });

    expectError(result, 409, "CONFLICT", "Email already registered");
  });

  it("logs in with valid credentials", async () => {
    const testUser = await createTestUser({ role: "learner" });
    const { status, data } = await api.post("/api/auth/login", {
      body: { email: testUser.user.email, password: testUser.password },
    });

    expect(status).toBe(200);
    expect(data.accessToken).toBeString();
    expect(data.refreshToken).toBeString();
    expect(data.expiresIn).toBeNumber();
    expect(data.user).toBeDefined();
  });

  it("rejects login with invalid password", async () => {
    const testUser = await createTestUser();
    const result = await api.post("/api/auth/login", {
      body: { email: testUser.user.email, password: "WrongPassword123!" },
    });

    expectError(result, 401, "UNAUTHORIZED", "Invalid email or password");
  });

  it("refreshes token and revokes old refresh token", async () => {
    const login = await loginTestUser({ role: "learner" });

    const { status, data } = await api.post("/api/auth/refresh", {
      body: { refreshToken: login.refreshToken },
    });

    expect(status).toBe(200);
    expect(data.accessToken).toBeString();
    expect(data.refreshToken).toBeString();
    expect(data.refreshToken).not.toBe(login.refreshToken);

    const reuse = await api.post("/api/auth/refresh", {
      body: { refreshToken: login.refreshToken },
    });
    expect(reuse.status).toBe(401);
  });

  it("detects refresh token reuse and revokes all sessions", async () => {
    const login = await loginTestUser({ role: "learner" });

    const { data } = await api.post("/api/auth/refresh", {
      body: { refreshToken: login.refreshToken },
    });
    const tokenB = data.refreshToken as string;

    const reuseA = await api.post("/api/auth/refresh", {
      body: { refreshToken: login.refreshToken },
    });
    expectError(
      reuseA,
      401,
      "UNAUTHORIZED",
      "Refresh token reuse detected, all sessions revoked",
    );

    const tryB = await api.post("/api/auth/refresh", {
      body: { refreshToken: tokenB },
    });
    expect(tryB.status).toBe(401);
  });

  it("evicts oldest refresh token when max sessions exceeded", async () => {
    const user = await createTestUser({
      role: "learner",
      password: "Test123!",
    });

    const tokens: string[] = [];
    for (let i = 0; i < 4; i++) {
      const { status, data } = await api.post("/api/auth/login", {
        body: { email: user.user.email, password: "Test123!" },
      });
      expect(status).toBe(200);
      tokens.push(data.refreshToken as string);
    }

    expect(tokens).toHaveLength(4);

    const try1 = await api.post("/api/auth/refresh", {
      body: { refreshToken: tokens[0] as string },
    });
    expect(try1.status).toBe(401);

    const try4 = await api.post("/api/auth/refresh", {
      body: { refreshToken: tokens[3] as string },
    });
    expect(try4.status).toBe(200);
  });

  it("logs out and revokes refresh token", async () => {
    const login = await loginTestUser({ role: "learner" });

    const { status, data } = await api.post("/api/auth/logout", {
      token: login.accessToken,
      body: { refreshToken: login.refreshToken },
    });

    expect(status).toBe(200);
    expect(data.message).toBe("Logged out successfully");

    const refreshAfter = await api.post("/api/auth/refresh", {
      body: { refreshToken: login.refreshToken },
    });
    expectError(
      refreshAfter,
      401,
      "UNAUTHORIZED",
      "Refresh token has been revoked",
    );
  });

  it("returns current user from /me with bearer token", async () => {
    const login = await loginTestUser({ role: "instructor" });

    const { status, data } = await api.get("/api/auth/me", {
      token: login.accessToken,
    });

    expect(status).toBe(200);
    const user = data.user as Record<string, unknown>;
    expect(user.id).toBe(login.user.id);
    expect(user.email).toBe(login.user.email);
  });

  it("rejects /me without token", async () => {
    const result = await api.get("/api/auth/me");
    expectError(result, 401, "UNAUTHORIZED", "Authentication required");
  });
});
