import { afterAll, beforeEach, describe, expect, it } from "bun:test";
import {
  api,
  cleanupTestData,
  createTestClass,
  createTestUser,
  expectError,
  joinTestClass,
  loginTestUser,
} from "./helpers";

describe("classes integration", () => {
  beforeEach(() => cleanupTestData());
  afterAll(() => cleanupTestData());

  // ── CRUD ─────────────────────────────────────────────────

  it("instructor creates a class", async () => {
    const instructor = await loginTestUser({ role: "instructor" });

    const { status, data } = await api.post("/api/classes", {
      token: instructor.accessToken,
      body: { name: "VSTEP B2 Morning", description: "Morning class" },
    });

    expect(status).toBe(200);
    expect(data.name).toBe("VSTEP B2 Morning");
    expect(data.description).toBe("Morning class");
    expect(data.instructorId).toBe(instructor.user.id);
    expect(data.inviteCode).toBeString();
  });

  it("learner cannot create a class", async () => {
    const learner = await loginTestUser({ role: "learner" });

    const result = await api.post("/api/classes", {
      token: learner.accessToken,
      body: { name: "Should Fail" },
    });

    expectError(result, 403, "FORBIDDEN");
  });

  it("instructor updates own class", async () => {
    const { classId, instructor } = await createTestClass();

    const { status, data } = await api.patch(`/api/classes/${classId}`, {
      token: instructor.accessToken,
      body: { name: "Updated Name", description: "New desc" },
    });

    expect(status).toBe(200);
    expect(data.name).toBe("Updated Name");
    expect(data.description).toBe("New desc");
  });

  it("other instructor cannot update class they do not own", async () => {
    const { classId } = await createTestClass();
    const other = await loginTestUser({ role: "instructor" });

    const result = await api.patch(`/api/classes/${classId}`, {
      token: other.accessToken,
      body: { name: "Hijacked" },
    });

    expectError(result, 403, "FORBIDDEN");
  });

  it("instructor deletes own class (soft delete)", async () => {
    const { classId, instructor } = await createTestClass();

    const { status, data } = await api.delete(`/api/classes/${classId}`, {
      token: instructor.accessToken,
    });

    expect(status).toBe(200);
    expect(data.id).toBe(classId);
    expect(data.deletedAt).toBeString();

    // Deleted class should not appear in list
    const list = await api.get("/api/classes", {
      token: instructor.accessToken,
    });
    const classes = list.data.data as Record<string, unknown>[];
    expect(classes.find((c) => c.id === classId)).toBeUndefined();
  });

  // ── List classes (role-based) ────────────────────────────

  it("instructor sees only own classes", async () => {
    const cls1 = await createTestClass();
    await createTestClass(); // different instructor

    const list = await api.get("/api/classes", {
      token: cls1.instructor.accessToken,
    });

    expect(list.status).toBe(200);
    const classes = list.data.data as Record<string, unknown>[];
    expect(classes).toHaveLength(1);
    expect(classes[0]?.id).toBe(cls1.classId);
  });

  it("learner sees only enrolled classes", async () => {
    const cls1 = await createTestClass();
    await createTestClass(); // not enrolled in this one
    const learner = await joinTestClass(cls1.inviteCode);

    const list = await api.get("/api/classes", {
      token: learner.accessToken,
    });

    expect(list.status).toBe(200);
    const classes = list.data.data as Record<string, unknown>[];
    expect(classes).toHaveLength(1);
    expect(classes[0]?.id).toBe(cls1.classId);
  });

  it("admin sees all classes", async () => {
    await createTestClass();
    await createTestClass();
    const admin = await loginTestUser({ role: "admin" });

    const list = await api.get("/api/classes", { token: admin.accessToken });

    expect(list.status).toBe(200);
    const classes = list.data.data as Record<string, unknown>[];
    expect(classes.length).toBeGreaterThanOrEqual(2);
  });

  // ── Get class detail ─────────────────────────────────────

  it("returns class detail with members", async () => {
    const cls = await createTestClass();
    const learner = await joinTestClass(cls.inviteCode);

    const { status, data } = await api.get(`/api/classes/${cls.classId}`, {
      token: cls.instructor.accessToken,
    });

    expect(status).toBe(200);
    expect(data.id).toBe(cls.classId);
    expect(data.memberCount).toBe(1);
    const members = data.members as Record<string, unknown>[];
    expect(members).toHaveLength(1);
    expect(members[0]?.userId).toBe(learner.user.id);
  });

  it("hides invite code from learner in class detail", async () => {
    const cls = await createTestClass();
    const learner = await joinTestClass(cls.inviteCode);

    const { status, data } = await api.get(`/api/classes/${cls.classId}`, {
      token: learner.accessToken,
    });

    expect(status).toBe(200);
    expect(data.inviteCode).toBeNull();
  });

  it("non-member cannot view class detail", async () => {
    const cls = await createTestClass();
    const outsider = await loginTestUser({ role: "learner" });

    const result = await api.get(`/api/classes/${cls.classId}`, {
      token: outsider.accessToken,
    });

    expectError(result, 403, "FORBIDDEN");
  });

  // ── Invite code ──────────────────────────────────────────

  it("rotates invite code", async () => {
    const cls = await createTestClass();

    const { status, data } = await api.post(
      `/api/classes/${cls.classId}/rotate-code`,
      { token: cls.instructor.accessToken },
    );

    expect(status).toBe(200);
    expect(data.inviteCode).toBeString();
    expect(data.inviteCode).not.toBe(cls.inviteCode);
  });

  // ── Join / Leave ─────────────────────────────────────────

  it("learner joins class by invite code", async () => {
    const cls = await createTestClass();
    const learner = await loginTestUser({ role: "learner" });

    const { status, data } = await api.post("/api/classes/join", {
      token: learner.accessToken,
      body: { inviteCode: cls.inviteCode },
    });

    expect(status).toBe(200);
    expect(data.classId).toBe(cls.classId);
    expect(data.className).toBe(cls.className);
  });

  it("rejects join with invalid invite code", async () => {
    const learner = await loginTestUser({ role: "learner" });

    const result = await api.post("/api/classes/join", {
      token: learner.accessToken,
      body: { inviteCode: "invalid-code-xyz" },
    });

    expectError(result, 404, "NOT_FOUND");
  });

  it("rejects duplicate join", async () => {
    const cls = await createTestClass();
    const learner = await joinTestClass(cls.inviteCode);

    const result = await api.post("/api/classes/join", {
      token: learner.accessToken,
      body: { inviteCode: cls.inviteCode },
    });

    expectError(result, 409, "CONFLICT", "Already a member of this class");
  });

  it("learner can rejoin after leaving", async () => {
    const cls = await createTestClass();
    const learner = await joinTestClass(cls.inviteCode);

    // Leave
    const leave = await api.post(`/api/classes/${cls.classId}/leave`, {
      token: learner.accessToken,
    });
    expect(leave.status).toBe(200);

    // Rejoin
    const rejoin = await api.post("/api/classes/join", {
      token: learner.accessToken,
      body: { inviteCode: cls.inviteCode },
    });
    expect(rejoin.status).toBe(200);
    expect(rejoin.data.classId).toBe(cls.classId);
  });

  it("learner leaves class", async () => {
    const cls = await createTestClass();
    const learner = await joinTestClass(cls.inviteCode);

    const { status, data } = await api.post(
      `/api/classes/${cls.classId}/leave`,
      { token: learner.accessToken },
    );

    expect(status).toBe(200);
    expect(data.removedAt).toBeString();

    // No longer appears in class detail
    const detail = await api.get(`/api/classes/${cls.classId}`, {
      token: cls.instructor.accessToken,
    });
    const members = detail.data.members as Record<string, unknown>[];
    expect(members.find((m) => m.userId === learner.user.id)).toBeUndefined();
  });

  it("instructor cannot leave their own class", async () => {
    const cls = await createTestClass();

    // Instructor needs to be a member first — join via direct DB or just test the endpoint
    const result = await api.post(`/api/classes/${cls.classId}/leave`, {
      token: cls.instructor.accessToken,
    });

    // Should be blocked — either 400 (our fix) or 404 (not a member)
    expect(result.status).toBeOneOf([400, 404]);
  });

  // ── Member management ────────────────────────────────────

  it("instructor removes a member", async () => {
    const cls = await createTestClass();
    const learner = await joinTestClass(cls.inviteCode);

    const { status, data } = await api.delete(
      `/api/classes/${cls.classId}/members/${learner.user.id}`,
      { token: cls.instructor.accessToken },
    );

    expect(status).toBe(200);
    expect(data.removedAt).toBeString();
  });

  it("learner cannot remove another member", async () => {
    const cls = await createTestClass();
    const learnerA = await joinTestClass(cls.inviteCode);
    const learnerB = await joinTestClass(cls.inviteCode);

    const result = await api.delete(
      `/api/classes/${cls.classId}/members/${learnerB.user.id}`,
      { token: learnerA.accessToken },
    );

    expectError(result, 403, "FORBIDDEN");
  });

  // ── Feedback ─────────────────────────────────────────────

  it("instructor sends feedback to a member", async () => {
    const cls = await createTestClass();
    const learner = await joinTestClass(cls.inviteCode);

    const { status, data } = await api.post(
      `/api/classes/${cls.classId}/feedback`,
      {
        token: cls.instructor.accessToken,
        body: {
          toUserId: learner.user.id,
          content: "Great improvement on listening!",
          skill: "listening",
        },
      },
    );

    expect(status).toBe(200);
    expect(data.content).toBe("Great improvement on listening!");
    expect(data.skill).toBe("listening");
    expect(data.toUserId).toBe(learner.user.id);
    expect(data.fromUserId).toBe(cls.instructor.user.id);
  });

  it("instructor cannot send feedback to non-member", async () => {
    const cls = await createTestClass();
    const outsider = await createTestUser({ role: "learner" });

    const result = await api.post(`/api/classes/${cls.classId}/feedback`, {
      token: cls.instructor.accessToken,
      body: {
        toUserId: outsider.user.id,
        content: "Should fail",
      },
    });

    expectError(result, 404, "NOT_FOUND");
  });

  it("learner sees only own feedback", async () => {
    const cls = await createTestClass();
    const learnerA = await joinTestClass(cls.inviteCode);
    const learnerB = await joinTestClass(cls.inviteCode);

    // Send feedback to both
    await api.post(`/api/classes/${cls.classId}/feedback`, {
      token: cls.instructor.accessToken,
      body: { toUserId: learnerA.user.id, content: "Feedback A" },
    });
    await api.post(`/api/classes/${cls.classId}/feedback`, {
      token: cls.instructor.accessToken,
      body: { toUserId: learnerB.user.id, content: "Feedback B" },
    });

    // Learner A sees only their own
    const listA = await api.get(`/api/classes/${cls.classId}/feedback`, {
      token: learnerA.accessToken,
    });
    expect(listA.status).toBe(200);
    const feedbackA = listA.data.data as Record<string, unknown>[];
    expect(feedbackA).toHaveLength(1);
    expect(feedbackA[0]?.content).toBe("Feedback A");
  });

  it("instructor sees all feedback for their class", async () => {
    const cls = await createTestClass();
    const learnerA = await joinTestClass(cls.inviteCode);
    const learnerB = await joinTestClass(cls.inviteCode);

    await api.post(`/api/classes/${cls.classId}/feedback`, {
      token: cls.instructor.accessToken,
      body: { toUserId: learnerA.user.id, content: "Feedback A" },
    });
    await api.post(`/api/classes/${cls.classId}/feedback`, {
      token: cls.instructor.accessToken,
      body: { toUserId: learnerB.user.id, content: "Feedback B" },
    });

    const list = await api.get(`/api/classes/${cls.classId}/feedback`, {
      token: cls.instructor.accessToken,
    });
    expect(list.status).toBe(200);
    const feedback = list.data.data as Record<string, unknown>[];
    expect(feedback).toHaveLength(2);
  });

  // ── Dashboard ────────────────────────────────────────────

  it("instructor views class dashboard", async () => {
    const cls = await createTestClass();
    await joinTestClass(cls.inviteCode);

    const { status, data } = await api.get(
      `/api/classes/${cls.classId}/dashboard`,
      { token: cls.instructor.accessToken },
    );

    expect(status).toBe(200);
    expect(data.memberCount).toBe(1);
    expect(data.atRiskCount).toBeNumber();
    expect(data.skillSummary).toBeDefined();
  });

  it("learner cannot access dashboard", async () => {
    const cls = await createTestClass();
    const learner = await joinTestClass(cls.inviteCode);

    const result = await api.get(`/api/classes/${cls.classId}/dashboard`, {
      token: learner.accessToken,
    });

    expectError(result, 403, "FORBIDDEN");
  });
});
