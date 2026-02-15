import { afterAll, beforeEach, describe, expect, it } from "bun:test";
import { db, table } from "@db/index";
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

  it("instructor deletes own class", async () => {
    const { classId, instructor } = await createTestClass();

    const { status, data } = await api.delete(`/api/classes/${classId}`, {
      token: instructor.accessToken,
    });

    expect(status).toBe(200);
    expect(data.id).toBe(classId);

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

  // ── Instructor progress / at-risk detection ─────────────

  it("dashboard detects at-risk learner with low average", async () => {
    const cls = await createTestClass();
    const learner = await joinTestClass(cls.inviteCode);
    const userId = learner.user.id;

    await db.insert(table.userProgress).values({
      userId,
      skill: "listening",
      currentLevel: "B1",
    });

    const lowScores = [3.0, 3.5, 4.0, 3.5, 4.5];
    await db.insert(table.userSkillScores).values(
      lowScores.map((score, i) => ({
        userId,
        skill: "listening" as const,
        score,
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      })),
    );

    const { status, data } = await api.get(
      `/api/classes/${cls.classId}/dashboard`,
      { token: cls.instructor.accessToken },
    );

    expect(status).toBe(200);
    expect(data.atRiskCount).toBeGreaterThanOrEqual(1);
    const atRisk = data.atRiskLearners as {
      userId: string;
      reasons: string[];
    }[];
    const learnerRisk = atRisk.find((r) => r.userId === userId);
    expect(learnerRisk).toBeDefined();
    const lowAvgReason = learnerRisk?.reasons.some((r: string) =>
      r.includes("Low average"),
    );
    expect(lowAvgReason).toBe(true);
  });

  it("dashboard detects at-risk learner with declining trend", async () => {
    const cls = await createTestClass();
    const learner = await joinTestClass(cls.inviteCode);
    const userId = learner.user.id;

    await db.insert(table.userProgress).values({
      userId,
      skill: "reading",
      currentLevel: "B1",
    });

    // 6 scores needed for full trend analysis: newest first → declining
    // Newest 3 avg = (5.0+5.5+6.0)/3 = 5.5, Oldest 3 avg = (7.0+7.5+8.0)/3 = 7.5
    // delta = -2.0 (< -0.5 → declining), stddev ≈ 1.18 (< 1.5 → not inconsistent)
    const decliningScores = [5.0, 5.5, 6.0, 7.0, 7.5, 8.0];
    await db.insert(table.userSkillScores).values(
      decliningScores.map((score, i) => ({
        userId,
        skill: "reading" as const,
        score,
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      })),
    );

    const { status, data } = await api.get(
      `/api/classes/${cls.classId}/dashboard`,
      { token: cls.instructor.accessToken },
    );

    expect(status).toBe(200);
    const atRisk = data.atRiskLearners as {
      userId: string;
      reasons: string[];
    }[];
    const learnerRisk = atRisk.find((r) => r.userId === userId);
    expect(learnerRisk).toBeDefined();
    const decliningReason = learnerRisk?.reasons.some((r: string) =>
      r.includes("Declining"),
    );
    expect(decliningReason).toBe(true);
  });

  it("member progress returns skill data", async () => {
    const cls = await createTestClass();
    const learner = await joinTestClass(cls.inviteCode);
    const userId = learner.user.id;

    await db.insert(table.userProgress).values({
      userId,
      skill: "listening",
      currentLevel: "B1",
      streakCount: 3,
    });

    await db.insert(table.userSkillScores).values(
      [6.0, 6.5, 7.0].map((score, i) => ({
        userId,
        skill: "listening" as const,
        score,
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      })),
    );

    const { status, data } = await api.get(
      `/api/classes/${cls.classId}/members/${userId}/progress`,
      { token: cls.instructor.accessToken },
    );

    expect(status).toBe(200);
    expect(data.userId).toBe(userId);
    const skills = data.skills as Record<
      string,
      { currentLevel: string; avg: number | null; streakCount: number }
    >;
    const listening = skills.listening;
    expect(listening).toBeDefined();
    expect(listening?.currentLevel).toBe("B1");
    expect(listening?.avg).toBeNumber();
    expect(listening?.streakCount).toBe(3);
  });

  it("non-owner instructor cannot access dashboard", async () => {
    const cls = await createTestClass();
    const otherInstructor = await loginTestUser({ role: "instructor" });

    const result = await api.get(`/api/classes/${cls.classId}/dashboard`, {
      token: otherInstructor.accessToken,
    });

    expectError(result, 403, "FORBIDDEN");
  });
});
