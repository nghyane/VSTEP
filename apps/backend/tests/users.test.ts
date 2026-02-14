import { afterAll, beforeEach, describe, expect, it } from "bun:test";
import {
  api,
  cleanupTestData,
  createTestUser,
  expectError,
  loginTestUser,
} from "./helpers";

describe("users integration", () => {
  beforeEach(() => cleanupTestData());
  afterAll(() => cleanupTestData());

  it("admin can create user and find them in list", async () => {
    const admin = await loginTestUser({ role: "admin" });
    const email = `itest-${crypto.randomUUID()}@test.com`;

    const { status, data } = await api.post("/api/users", {
      token: admin.accessToken,
      body: {
        email,
        password: "Password123!",
        fullName: "Created By Admin",
        role: "instructor",
      },
    });

    expect(status).toBe(201);
    expect(data.email).toBe(email);
    expect(data.role).toBe("instructor");
    expect(data.fullName).toBe("Created By Admin");

    const list = await api.get("/api/users?page=1&limit=100", {
      token: admin.accessToken,
    });

    expect(list.status).toBe(200);
    const users = list.data.data as Record<string, unknown>[];
    const found = users.find((u) => u.email === email);
    expect(found).toBeDefined();
    expect(found?.role).toBe("instructor");

    const meta = list.data.meta as Record<string, unknown>;
    expect(meta.total).toBeGreaterThanOrEqual(2);
  });

  it("regular user cannot access admin list endpoint", async () => {
    const learner = await loginTestUser({ role: "learner" });
    const result = await api.get("/api/users", { token: learner.accessToken });
    expectError(result, 403, "FORBIDDEN");
  });

  it("owner can read and update own profile", async () => {
    const learner = await loginTestUser({ role: "learner" });

    const get = await api.get(`/api/users/${learner.user.id}`, {
      token: learner.accessToken,
    });
    expect(get.status).toBe(200);
    expect(get.data.id).toBe(learner.user.id);

    const patch = await api.patch(`/api/users/${learner.user.id}`, {
      token: learner.accessToken,
      body: { fullName: "Updated Learner" },
    });
    expect(patch.status).toBe(200);
    expect(patch.data.fullName).toBe("Updated Learner");
    expect(patch.data.role).toBe("learner");
  });

  it("learner cannot view another user profile", async () => {
    const learner = await loginTestUser({ role: "learner" });
    const other = await createTestUser({ role: "learner" });

    const result = await api.get(`/api/users/${other.user.id}`, {
      token: learner.accessToken,
    });
    expectError(result, 403, "FORBIDDEN");
  });

  it("regular user cannot change role", async () => {
    const learner = await loginTestUser({ role: "learner" });

    const result = await api.patch(`/api/users/${learner.user.id}`, {
      token: learner.accessToken,
      body: { role: "admin" },
    });
    expectError(result, 403, "FORBIDDEN", "Only admins can change user roles");
  });

  it("admin can update another user role and delete user", async () => {
    const admin = await loginTestUser({ role: "admin" });
    const learner = await createTestUser({ role: "learner" });

    const patch = await api.patch(`/api/users/${learner.user.id}`, {
      token: admin.accessToken,
      body: { role: "instructor" },
    });
    expect(patch.status).toBe(200);
    expect(patch.data.role).toBe("instructor");

    const del = await api.delete(`/api/users/${learner.user.id}`, {
      token: admin.accessToken,
    });
    expect(del.status).toBe(200);
    expect(del.data.id).toBe(learner.user.id);
    expect(del.data.deletedAt).toBeString();

    const getDeleted = await api.get(`/api/users/${learner.user.id}`, {
      token: admin.accessToken,
    });
    expectError(getDeleted, 404, "NOT_FOUND");
  });

  it("rejects update with duplicate email", async () => {
    const admin = await loginTestUser({ role: "admin" });
    const userA = await createTestUser({ role: "learner" });
    const userB = await createTestUser({ role: "learner" });

    const result = await api.patch(`/api/users/${userA.user.id}`, {
      token: admin.accessToken,
      body: { email: userB.user.email },
    });
    expectError(result, 409, "CONFLICT", "Email already in use");
  });

  it("owner can change password and login with new password", async () => {
    const learner = await loginTestUser({
      role: "learner",
      password: "OldPass123!",
    });

    const { status, data } = await api.post(
      `/api/users/${learner.user.id}/password`,
      {
        token: learner.accessToken,
        body: { currentPassword: "OldPass123!", newPassword: "NewPass123!" },
      },
    );
    expect(status).toBe(200);
    expect(data.message).toBe("Password updated successfully");

    const loginNew = await api.post("/api/auth/login", {
      body: { email: learner.user.email, password: "NewPass123!" },
    });
    expect(loginNew.status).toBe(200);

    const loginOld = await api.post("/api/auth/login", {
      body: { email: learner.user.email, password: "OldPass123!" },
    });
    expect(loginOld.status).toBe(401);
  });

  it("admin can change another user password when current password is known", async () => {
    const admin = await loginTestUser({ role: "admin" });
    const learner = await createTestUser({
      role: "learner",
      password: "KnownPass123!",
    });

    const result = await api.post(`/api/users/${learner.user.id}/password`, {
      token: admin.accessToken,
      body: {
        currentPassword: "KnownPass123!",
        newPassword: "ChangedByAdmin123!",
      },
    });
    expect(result.status).toBe(200);

    const login = await api.post("/api/auth/login", {
      body: { email: learner.user.email, password: "ChangedByAdmin123!" },
    });
    expect(login.status).toBe(200);
  });

  it("rejects password change with incorrect current password", async () => {
    const learner = await loginTestUser({
      role: "learner",
      password: "Correct123!",
    });

    const result = await api.post(`/api/users/${learner.user.id}/password`, {
      token: learner.accessToken,
      body: { currentPassword: "Wrong123!", newPassword: "NeverApplied123!" },
    });
    expectError(result, 401, "UNAUTHORIZED", "Current password is incorrect");
  });
});
