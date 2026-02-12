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
} from "@/test/helpers";
import { USER_MESSAGES } from "../messages";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

describe("users integration", () => {
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

  it("admin can create and list users", async () => {
    const admin = await loginTestUser({ role: "admin" });

    const createResult = await makeRequest({
      method: "POST",
      path: "/api/users",
      token: admin.accessToken,
      body: {
        email: `itest-${crypto.randomUUID()}@test.com`,
        password: "Password123!",
        fullName: "Created By Admin",
        role: "instructor",
      },
    });

    expect(createResult.status).toBe(201);
    expect(isRecord(createResult.data)).toBe(true);
    if (!isRecord(createResult.data)) return;

    expect(typeof createResult.data.email).toBe("string");
    expect(createResult.data.role).toBe("instructor");

    const listResult = await makeRequest({
      method: "GET",
      path: "/api/users?page=1&limit=20",
      token: admin.accessToken,
    });

    expect(listResult.status).toBe(200);
    expect(isRecord(listResult.data)).toBe(true);
    if (!isRecord(listResult.data)) return;

    expect(Array.isArray(listResult.data.data)).toBe(true);
    expect(isRecord(listResult.data.meta)).toBe(true);
    if (!isRecord(listResult.data.meta)) return;

    expect(typeof listResult.data.meta.total).toBe("number");
  });

  it("regular user cannot access admin list endpoint", async () => {
    const learner = await loginTestUser({ role: "learner" });

    const listResult = await makeRequest({
      method: "GET",
      path: "/api/users",
      token: learner.accessToken,
    });

    expect(listResult.status).toBe(403);
    expect(isRecord(listResult.data)).toBe(true);
    if (!isRecord(listResult.data)) return;

    expect(isRecord(listResult.data.error)).toBe(true);
    if (!isRecord(listResult.data.error)) return;

    expect(listResult.data.error.code).toBe("FORBIDDEN");
  });

  it("owner can read and update own profile", async () => {
    const learner = await loginTestUser({ role: "learner" });

    const getMeById = await makeRequest({
      method: "GET",
      path: `/api/users/${learner.user.id}`,
      token: learner.accessToken,
    });

    expect(getMeById.status).toBe(200);
    expect(isRecord(getMeById.data)).toBe(true);
    if (!isRecord(getMeById.data)) return;

    expect(getMeById.data.id).toBe(learner.user.id);

    const patchResult = await makeRequest({
      method: "PATCH",
      path: `/api/users/${learner.user.id}`,
      token: learner.accessToken,
      body: {
        fullName: "Updated Learner",
      },
    });

    expect(patchResult.status).toBe(200);
    expect(isRecord(patchResult.data)).toBe(true);
    if (!isRecord(patchResult.data)) return;

    expect(patchResult.data.fullName).toBe("Updated Learner");
  });

  it("regular user cannot change role", async () => {
    const learner = await loginTestUser({ role: "learner" });

    const patchResult = await makeRequest({
      method: "PATCH",
      path: `/api/users/${learner.user.id}`,
      token: learner.accessToken,
      body: {
        role: "admin",
      },
    });

    expect(patchResult.status).toBe(403);
    expect(isRecord(patchResult.data)).toBe(true);
    if (!isRecord(patchResult.data)) return;

    expect(isRecord(patchResult.data.error)).toBe(true);
    if (!isRecord(patchResult.data.error)) return;

    expect(patchResult.data.error.code).toBe("FORBIDDEN");
    expect(patchResult.data.error.message).toBe(USER_MESSAGES.adminRoleOnly);
  });

  it("admin can update another user and delete user", async () => {
    const admin = await loginTestUser({ role: "admin" });
    const learner = await createTestUser({ role: "learner" });

    const patchResult = await makeRequest({
      method: "PATCH",
      path: `/api/users/${learner.user.id}`,
      token: admin.accessToken,
      body: {
        role: "instructor",
      },
    });

    expect(patchResult.status).toBe(200);
    expect(isRecord(patchResult.data)).toBe(true);
    if (!isRecord(patchResult.data)) return;

    expect(patchResult.data.role).toBe("instructor");

    const deleteResult = await makeRequest({
      method: "DELETE",
      path: `/api/users/${learner.user.id}`,
      token: admin.accessToken,
    });

    expect(deleteResult.status).toBe(200);
    expect(isRecord(deleteResult.data)).toBe(true);
    if (!isRecord(deleteResult.data)) return;

    expect(deleteResult.data.id).toBe(learner.user.id);
    expect(typeof deleteResult.data.deletedAt).toBe("string");

    const getDeleted = await makeRequest({
      method: "GET",
      path: `/api/users/${learner.user.id}`,
      token: admin.accessToken,
    });

    expect(getDeleted.status).toBe(404);
    expect(isRecord(getDeleted.data)).toBe(true);
    if (!isRecord(getDeleted.data)) return;

    expect(isRecord(getDeleted.data.error)).toBe(true);
    if (!isRecord(getDeleted.data.error)) return;

    expect(getDeleted.data.error.code).toBe("NOT_FOUND");
  });

  it("owner can change password and login with new password", async () => {
    const learner = await loginTestUser({
      role: "learner",
      password: "OldPass123!",
    });

    const updatePassword = await makeRequest({
      method: "POST",
      path: `/api/users/${learner.user.id}/password`,
      token: learner.accessToken,
      body: {
        currentPassword: "OldPass123!",
        newPassword: "NewPass123!",
      },
    });

    expect(updatePassword.status).toBe(200);
    expect(isRecord(updatePassword.data)).toBe(true);
    if (!isRecord(updatePassword.data)) return;

    expect(updatePassword.data.message).toBe("Password updated successfully");

    const loginWithNewPassword = await makeRequest({
      method: "POST",
      path: "/api/auth/login",
      body: {
        email: learner.user.email,
        password: "NewPass123!",
      },
    });

    expect(loginWithNewPassword.status).toBe(200);
  });

  it("admin can change another user password when current password is known", async () => {
    const admin = await loginTestUser({ role: "admin" });
    const learner = await createTestUser({
      role: "learner",
      password: "KnownPass123!",
    });

    const updatePassword = await makeRequest({
      method: "POST",
      path: `/api/users/${learner.user.id}/password`,
      token: admin.accessToken,
      body: {
        currentPassword: "KnownPass123!",
        newPassword: "ChangedByAdmin123!",
      },
    });

    expect(updatePassword.status).toBe(200);

    const loginWithNewPassword = await makeRequest({
      method: "POST",
      path: "/api/auth/login",
      body: {
        email: learner.user.email,
        password: "ChangedByAdmin123!",
      },
    });

    expect(loginWithNewPassword.status).toBe(200);
  });

  it("rejects password change with incorrect current password", async () => {
    const learner = await loginTestUser({
      role: "learner",
      password: "Correct123!",
    });

    const updatePassword = await makeRequest({
      method: "POST",
      path: `/api/users/${learner.user.id}/password`,
      token: learner.accessToken,
      body: {
        currentPassword: "Wrong123!",
        newPassword: "NeverApplied123!",
      },
    });

    expect(updatePassword.status).toBe(401);
    expect(isRecord(updatePassword.data)).toBe(true);
    if (!isRecord(updatePassword.data)) return;

    expect(isRecord(updatePassword.data.error)).toBe(true);
    if (!isRecord(updatePassword.data.error)) return;

    expect(updatePassword.data.error.code).toBe("UNAUTHORIZED");
    expect(updatePassword.data.error.message).toBe(
      USER_MESSAGES.incorrectPassword,
    );
  });
});
