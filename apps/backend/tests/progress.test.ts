import { afterAll, beforeEach, describe, expect, it } from "bun:test";
import { api, cleanupTestData, expectError, loginTestUser } from "./helpers";

describe("progress integration", () => {
  beforeEach(() => cleanupTestData());
  afterAll(() => cleanupTestData());

  it("returns progress overview for authenticated user", async () => {
    const learner = await loginTestUser({ role: "learner" });

    const { status, data } = await api.get("/api/progress", {
      token: learner.accessToken,
    });

    expect(status).toBe(200);
    expect(data.skills).toBeArray();
    expect(data.goal).toBeNull();
  });

  it("rejects unauthenticated access", async () => {
    const result = await api.get("/api/progress");
    expectError(result, 401, "UNAUTHORIZED");
  });

  it("returns spider chart data structure", async () => {
    const learner = await loginTestUser({ role: "learner" });

    const { status, data } = await api.get("/api/progress/spider-chart", {
      token: learner.accessToken,
    });

    expect(status).toBe(200);
    expect(data.skills).toBeDefined();
    const skills = data.skills as Record<string, unknown>;
    // Should have entries for all 4 VSTEP skills
    for (const skill of ["reading", "writing", "listening", "speaking"]) {
      expect(skills[skill]).toBeDefined();
      const s = skills[skill] as Record<string, unknown>;
      expect(s.current).toBeNumber();
      expect(s.trend).toBeString();
    }
  });

  it("returns skill detail for a specific skill", async () => {
    const learner = await loginTestUser({ role: "learner" });

    const { status, data } = await api.get("/api/progress/reading", {
      token: learner.accessToken,
    });

    expect(status).toBe(200);
    expect(data.recentScores).toBeArray();
    expect(data.trend).toBeString();
  });

  it("returns skill detail for all four skills", async () => {
    const learner = await loginTestUser({ role: "learner" });

    for (const skill of ["reading", "writing", "listening", "speaking"]) {
      const { status } = await api.get(`/api/progress/${skill}`, {
        token: learner.accessToken,
      });
      expect(status).toBe(200);
    }
  });

  it("creates a learning goal", async () => {
    const learner = await loginTestUser({ role: "learner" });

    const { status, data } = await api.post("/api/progress/goals", {
      token: learner.accessToken,
      body: {
        targetBand: "B2",
        deadline: new Date(Date.now() + 90 * 86400000).toISOString(),
        dailyStudyTimeMinutes: 60,
      },
    });

    expect(status).toBe(201);
    expect(data.targetBand).toBe("B2");
    expect(data.dailyStudyTimeMinutes).toBe(60);
    expect(data.userId).toBe(learner.user.id);
  });

  it("rejects second active goal (only 1 allowed)", async () => {
    const learner = await loginTestUser({ role: "learner" });
    const body = {
      targetBand: "B2",
      deadline: new Date(Date.now() + 90 * 86400000).toISOString(),
    };

    await api.post("/api/progress/goals", {
      token: learner.accessToken,
      body,
    });

    const result = await api.post("/api/progress/goals", {
      token: learner.accessToken,
      body,
    });

    expectError(result, 409, "CONFLICT");
  });

  it("updates a goal", async () => {
    const learner = await loginTestUser({ role: "learner" });
    const deadline = new Date(Date.now() + 90 * 86400000).toISOString();

    const created = await api.post("/api/progress/goals", {
      token: learner.accessToken,
      body: { targetBand: "B1", deadline },
    });
    const goalId = created.data.id as string;

    const { status, data } = await api.patch(`/api/progress/goals/${goalId}`, {
      token: learner.accessToken,
      body: { targetBand: "B2", dailyStudyTimeMinutes: 90 },
    });

    expect(status).toBe(200);
    expect(data.targetBand).toBe("B2");
    expect(data.dailyStudyTimeMinutes).toBe(90);
  });

  it("deletes a goal", async () => {
    const learner = await loginTestUser({ role: "learner" });
    const deadline = new Date(Date.now() + 90 * 86400000).toISOString();

    const created = await api.post("/api/progress/goals", {
      token: learner.accessToken,
      body: { targetBand: "B2", deadline },
    });
    const goalId = created.data.id as string;

    const { status, data } = await api.delete(`/api/progress/goals/${goalId}`, {
      token: learner.accessToken,
    });

    expect(status).toBe(200);
    expect(data.id).toBe(goalId);

    // Can create a new goal after deleting
    const retry = await api.post("/api/progress/goals", {
      token: learner.accessToken,
      body: { targetBand: "C1", deadline },
    });
    expect(retry.status).toBe(201);
  });

  it("returns forbidden when updating another user's goal", async () => {
    const learnerA = await loginTestUser({ role: "learner" });
    const learnerB = await loginTestUser({ role: "learner" });
    const deadline = new Date(Date.now() + 90 * 86400000).toISOString();

    const created = await api.post("/api/progress/goals", {
      token: learnerA.accessToken,
      body: { targetBand: "B2", deadline },
    });
    const goalId = created.data.id as string;

    const result = await api.patch(`/api/progress/goals/${goalId}`, {
      token: learnerB.accessToken,
      body: { targetBand: "C1" },
    });

    expectError(result, 403, "FORBIDDEN");
  });

  it("returns forbidden when deleting another user's goal", async () => {
    const learnerA = await loginTestUser({ role: "learner" });
    const learnerB = await loginTestUser({ role: "learner" });
    const deadline = new Date(Date.now() + 90 * 86400000).toISOString();

    const created = await api.post("/api/progress/goals", {
      token: learnerA.accessToken,
      body: { targetBand: "B2", deadline },
    });
    const goalId = created.data.id as string;

    const result = await api.delete(`/api/progress/goals/${goalId}`, {
      token: learnerB.accessToken,
    });

    expectError(result, 403, "FORBIDDEN");
  });

  it("overview includes the active goal", async () => {
    const learner = await loginTestUser({ role: "learner" });
    const deadline = new Date(Date.now() + 90 * 86400000).toISOString();

    await api.post("/api/progress/goals", {
      token: learner.accessToken,
      body: { targetBand: "B2", deadline, dailyStudyTimeMinutes: 45 },
    });

    const { status, data } = await api.get("/api/progress", {
      token: learner.accessToken,
    });

    expect(status).toBe(200);
    const goal = data.goal as Record<string, unknown>;
    expect(goal).not.toBeNull();
    expect(goal.targetBand).toBe("B2");
    expect(goal.dailyStudyTimeMinutes).toBe(45);
  });

  it("spider chart includes the active goal", async () => {
    const learner = await loginTestUser({ role: "learner" });
    const deadline = new Date(Date.now() + 90 * 86400000).toISOString();

    await api.post("/api/progress/goals", {
      token: learner.accessToken,
      body: { targetBand: "B2", deadline },
    });

    const { status, data } = await api.get("/api/progress/spider-chart", {
      token: learner.accessToken,
    });

    expect(status).toBe(200);
    const goal = data.goal as Record<string, unknown>;
    expect(goal).not.toBeNull();
    expect(goal.targetBand).toBe("B2");
  });
});
