import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "bun:test";
import {
  buildTestEmail,
  cleanupTestData,
  createTestApp,
  createTestUser,
  isRecord,
  loginTestUser,
  makeRequest,
  testEmailPrefix,
} from "./helpers";

describe("auth integration", () => {
  beforeAll(() => {
    createTestApp();
  });

  beforeEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  it("registers a learner account", async () => {
    const email = buildTestEmail();
    const result = await makeRequest({
      method: "POST",
      path: "/api/auth/register",
      body: {
        email,
        password: "Password123!",
        fullName: "Integration Learner",
      },
    });

    expect(result.status).toBe(201);
    expect(isRecord(result.data)).toBe(true);
    if (!isRecord(result.data)) return;

    expect(result.data.message).toBe("Account created successfully");
    expect(isRecord(result.data.user)).toBe(true);
    if (!isRecord(result.data.user)) return;

    expect(result.data.user.email).toBe(email);
    expect(result.data.user.role).toBe("learner");
  });

  it("normalizes email to lowercase on register", async () => {
    const rawEmail = `${testEmailPrefix}${crypto.randomUUID()}@TEST.COM`;
    const result = await makeRequest({
      method: "POST",
      path: "/api/auth/register",
      body: {
        email: rawEmail,
        password: "Password123!",
        fullName: "Case Test",
      },
    });

    expect(result.status).toBe(201);
    expect(isRecord(result.data)).toBe(true);
    if (!isRecord(result.data)) return;

    expect(isRecord(result.data.user)).toBe(true);
    if (!isRecord(result.data.user)) return;

    expect(result.data.user.email).toBe(rawEmail.toLowerCase());
  });

  it("rejects duplicate register email", async () => {
    const email = buildTestEmail();

    await makeRequest({
      method: "POST",
      path: "/api/auth/register",
      body: {
        email,
        password: "Password123!",
        fullName: "Duplicate User",
      },
    });

    const duplicate = await makeRequest({
      method: "POST",
      path: "/api/auth/register",
      body: {
        email,
        password: "Password123!",
        fullName: "Duplicate User",
      },
    });

    expect(duplicate.status).toBe(409);
    expect(isRecord(duplicate.data)).toBe(true);
    if (!isRecord(duplicate.data)) return;

    expect(isRecord(duplicate.data.error)).toBe(true);
    if (!isRecord(duplicate.data.error)) return;

    expect(duplicate.data.error.code).toBe("CONFLICT");
    expect(duplicate.data.error.message).toBe("Email already registered");
  });

  it("logs in with valid credentials", async () => {
    const testUser = await createTestUser({ role: "learner" });

    const loginResult = await makeRequest({
      method: "POST",
      path: "/api/auth/login",
      body: {
        email: testUser.user.email,
        password: testUser.password,
      },
    });

    expect(loginResult.status).toBe(200);
    expect(isRecord(loginResult.data)).toBe(true);
    if (!isRecord(loginResult.data)) return;

    expect(typeof loginResult.data.accessToken).toBe("string");
    expect(typeof loginResult.data.refreshToken).toBe("string");
    expect(typeof loginResult.data.expiresIn).toBe("number");
    expect(isRecord(loginResult.data.user)).toBe(true);
  });

  it("rejects login with invalid password", async () => {
    const testUser = await createTestUser();

    const loginResult = await makeRequest({
      method: "POST",
      path: "/api/auth/login",
      body: {
        email: testUser.user.email,
        password: "WrongPassword123!",
      },
    });

    expect(loginResult.status).toBe(401);
    expect(isRecord(loginResult.data)).toBe(true);
    if (!isRecord(loginResult.data)) return;

    expect(isRecord(loginResult.data.error)).toBe(true);
    if (!isRecord(loginResult.data.error)) return;

    expect(loginResult.data.error.code).toBe("UNAUTHORIZED");
    expect(loginResult.data.error.message).toBe("Invalid email or password");
  });

  it("refreshes token and revokes old refresh token", async () => {
    const loginResult = await loginTestUser({ role: "learner" });

    const refreshed = await makeRequest({
      method: "POST",
      path: "/api/auth/refresh",
      body: {
        refreshToken: loginResult.refreshToken,
      },
    });

    expect(refreshed.status).toBe(200);
    expect(isRecord(refreshed.data)).toBe(true);
    if (!isRecord(refreshed.data)) return;

    expect(typeof refreshed.data.accessToken).toBe("string");
    expect(typeof refreshed.data.refreshToken).toBe("string");
    expect(refreshed.data.refreshToken).not.toBe(loginResult.refreshToken);

    // Old refresh token should no longer work after rotation
    const reuse = await makeRequest({
      method: "POST",
      path: "/api/auth/refresh",
      body: {
        refreshToken: loginResult.refreshToken,
      },
    });

    expect(reuse.status).toBe(401);
  });

  it("detects refresh token reuse and revokes all sessions", async () => {
    const loginResult = await loginTestUser({ role: "learner" });

    // Rotate token A → token B
    const refreshed = await makeRequest({
      method: "POST",
      path: "/api/auth/refresh",
      body: { refreshToken: loginResult.refreshToken },
    });

    expect(refreshed.status).toBe(200);
    expect(isRecord(refreshed.data)).toBe(true);
    if (!isRecord(refreshed.data)) return;

    const tokenB = refreshed.data.refreshToken as string;

    // Reuse token A → should trigger reuse detection
    const reuseA = await makeRequest({
      method: "POST",
      path: "/api/auth/refresh",
      body: { refreshToken: loginResult.refreshToken },
    });

    expect(reuseA.status).toBe(401);
    expect(isRecord(reuseA.data)).toBe(true);
    if (!isRecord(reuseA.data)) return;

    expect(isRecord(reuseA.data.error)).toBe(true);
    if (!isRecord(reuseA.data.error)) return;

    expect(reuseA.data.error.message).toBe(
      "Refresh token reuse detected, all sessions revoked",
    );

    // Token B should also be revoked
    const tryB = await makeRequest({
      method: "POST",
      path: "/api/auth/refresh",
      body: { refreshToken: tokenB },
    });

    expect(tryB.status).toBe(401);
  });

  it("evicts oldest refresh token when max sessions exceeded", async () => {
    // MAX_REFRESH_TOKENS_PER_USER = 3
    const user = await createTestUser({
      role: "learner",
      password: "Test123!",
    });

    const tokens: string[] = [];
    for (let i = 0; i < 4; i++) {
      const res = await makeRequest({
        method: "POST",
        path: "/api/auth/login",
        body: { email: user.user.email, password: "Test123!" },
      });
      expect(res.status).toBe(200);
      expect(isRecord(res.data)).toBe(true);
      if (!isRecord(res.data)) return;
      tokens.push(res.data.refreshToken as string);
    }

    expect(tokens).toHaveLength(4);
    const firstToken = tokens[0] as string;
    const lastToken = tokens[3] as string;

    // 1st token should be evicted (FIFO)
    const try1 = await makeRequest({
      method: "POST",
      path: "/api/auth/refresh",
      body: { refreshToken: firstToken },
    });
    expect(try1.status).toBe(401);

    // 4th token should still work
    const try4 = await makeRequest({
      method: "POST",
      path: "/api/auth/refresh",
      body: { refreshToken: lastToken },
    });
    expect(try4.status).toBe(200);
  });

  it("logs out and revokes refresh token", async () => {
    const loginResult = await loginTestUser({ role: "learner" });

    const logoutResult = await makeRequest({
      method: "POST",
      path: "/api/auth/logout",
      token: loginResult.accessToken,
      body: {
        refreshToken: loginResult.refreshToken,
      },
    });

    expect(logoutResult.status).toBe(200);
    expect(isRecord(logoutResult.data)).toBe(true);
    if (!isRecord(logoutResult.data)) return;

    expect(logoutResult.data.message).toBe("Logged out successfully");

    // Refresh after logout should fail with specific message
    const refreshAfterLogout = await makeRequest({
      method: "POST",
      path: "/api/auth/refresh",
      body: {
        refreshToken: loginResult.refreshToken,
      },
    });

    expect(refreshAfterLogout.status).toBe(401);
    expect(isRecord(refreshAfterLogout.data)).toBe(true);
    if (!isRecord(refreshAfterLogout.data)) return;

    expect(isRecord(refreshAfterLogout.data.error)).toBe(true);
    if (!isRecord(refreshAfterLogout.data.error)) return;

    expect(refreshAfterLogout.data.error.code).toBe("UNAUTHORIZED");
    expect(refreshAfterLogout.data.error.message).toBe(
      "Refresh token has been revoked",
    );
  });

  it("returns current user from /me with bearer token", async () => {
    const loginResult = await loginTestUser({ role: "instructor" });

    const meResult = await makeRequest({
      method: "GET",
      path: "/api/auth/me",
      token: loginResult.accessToken,
    });

    expect(meResult.status).toBe(200);
    expect(isRecord(meResult.data)).toBe(true);
    if (!isRecord(meResult.data)) return;

    expect(isRecord(meResult.data.user)).toBe(true);
    if (!isRecord(meResult.data.user)) return;

    expect(meResult.data.user.id).toBe(loginResult.user.id);
    expect(meResult.data.user.email).toBe(loginResult.user.email);
  });

  it("rejects /me without token", async () => {
    const meResult = await makeRequest({
      method: "GET",
      path: "/api/auth/me",
    });

    expect(meResult.status).toBe(401);
    expect(isRecord(meResult.data)).toBe(true);
    if (!isRecord(meResult.data)) return;

    expect(isRecord(meResult.data.error)).toBe(true);
    if (!isRecord(meResult.data.error)) return;

    expect(meResult.data.error.code).toBe("UNAUTHORIZED");
    expect(meResult.data.error.message).toBe("Authentication required");
  });
});
