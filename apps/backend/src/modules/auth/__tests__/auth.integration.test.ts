import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "bun:test";
import {
  cleanupTestData,
  createTestApp,
  createTestUser,
  loginTestUser,
  makeRequest,
  testEmailPrefix,
} from "@/test/helpers";
import { AUTH_MESSAGES } from "../messages";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function buildEmail(): string {
  return `${testEmailPrefix}${crypto.randomUUID()}@test.com`;
}

describe("auth integration", () => {
  beforeAll(async () => {
    createTestApp();
    await cleanupTestData();
  });

  beforeEach(async () => {
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  it("registers a learner account", async () => {
    const email = buildEmail();
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

  it("rejects duplicate register email", async () => {
    const email = buildEmail();

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
    expect(duplicate.data.error.message).toBe(
      AUTH_MESSAGES.emailAlreadyRegistered,
    );
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
    expect(loginResult.data.error.message).toBe(
      AUTH_MESSAGES.invalidCredentials,
    );
  });

  it("refreshes token with a valid refresh token", async () => {
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
