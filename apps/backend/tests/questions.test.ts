import { afterAll, beforeEach, describe, expect, it } from "bun:test";
import {
  api,
  cleanupTestData,
  createTestQuestion,
  expectError,
  loginTestUser,
} from "./helpers";

describe("questions integration", () => {
  beforeEach(() => cleanupTestData());
  afterAll(() => cleanupTestData());

  // ── CRUD ─────────────────────────────────────────────────

  it("instructor creates a question", async () => {
    const instructor = await loginTestUser({ role: "instructor" });

    const { status, data } = await api.post("/api/questions", {
      token: instructor.accessToken,
      body: {
        skill: "reading",
        part: 1,
        content: {
          passage: "The quick brown fox.",
          items: [
            {
              stem: "What color is the fox?",
              options: ["Brown", "Red", "Blue", "Green"],
            },
          ],
        },
        answerKey: { correctAnswers: { "1": "0" } },
      },
    });

    expect(status).toBe(201);
    expect(data.skill).toBe("reading");
    expect(data.part).toBe(1);
    expect(data.isActive).toBe(true);
    expect(data.createdBy).toBe(instructor.user.id);
  });

  it("learner cannot create a question", async () => {
    const learner = await loginTestUser({ role: "learner" });

    const result = await api.post("/api/questions", {
      token: learner.accessToken,
      body: {
        skill: "reading",
        part: 1,
        content: {
          passage: "Should fail.",
          items: [
            {
              stem: "Nope",
              options: ["A", "B", "C", "D"],
            },
          ],
        },
        answerKey: { correctAnswers: { "1": "0" } },
      },
    });

    expectError(result, 403, "FORBIDDEN");
  });

  it("gets a question by ID", async () => {
    const { questionId } = await createTestQuestion();
    const viewer = await loginTestUser({ role: "learner" });

    const { status, data } = await api.get(`/api/questions/${questionId}`, {
      token: viewer.accessToken,
    });

    expect(status).toBe(200);
    expect(data.id).toBe(questionId);
    expect(data.skill).toBe("reading");
  });

  it("returns 404 for non-existent question", async () => {
    const viewer = await loginTestUser({ role: "learner" });

    const result = await api.get(
      "/api/questions/00000000-0000-0000-0000-000000000000",
      { token: viewer.accessToken },
    );

    expectError(result, 404, "NOT_FOUND");
  });

  it("instructor updates own question metadata", async () => {
    const { questionId, instructor } = await createTestQuestion();

    const { status, data } = await api.patch(`/api/questions/${questionId}`, {
      token: instructor.accessToken,
      body: { isActive: false },
    });

    expect(status).toBe(200);
    expect(data.isActive).toBe(false);
  });

  it("instructor updates content", async () => {
    const { questionId, instructor } = await createTestQuestion();

    const { status, data } = await api.patch(`/api/questions/${questionId}`, {
      token: instructor.accessToken,
      body: {
        content: {
          passage: "Updated passage.",
          items: [
            {
              stem: "New question?",
              options: ["A1", "B1", "C1", "D1"],
            },
          ],
        },
      },
    });

    expect(status).toBe(200);
    expect(data.id).toBe(questionId);
  });

  it("other instructor cannot update question they did not create", async () => {
    const { questionId } = await createTestQuestion();
    const other = await loginTestUser({ role: "instructor" });

    const result = await api.patch(`/api/questions/${questionId}`, {
      token: other.accessToken,
      body: { isActive: false },
    });

    expectError(result, 403, "FORBIDDEN");
  });

  it("admin can update any question", async () => {
    const { questionId } = await createTestQuestion();
    const admin = await loginTestUser({ role: "admin" });

    const { status, data } = await api.patch(`/api/questions/${questionId}`, {
      token: admin.accessToken,
      body: { isActive: false },
    });

    expect(status).toBe(200);
    expect(data.isActive).toBe(false);
  });

  // ── Delete ───────────────────────────────────────────────

  it("admin deletes a question", async () => {
    const { questionId } = await createTestQuestion();
    const admin = await loginTestUser({ role: "admin" });

    const { status, data } = await api.delete(`/api/questions/${questionId}`, {
      token: admin.accessToken,
    });

    expect(status).toBe(200);
    expect(data.id).toBe(questionId);

    // Deleted question returns 404
    const viewer = await loginTestUser({ role: "learner" });
    const get = await api.get(`/api/questions/${questionId}`, {
      token: viewer.accessToken,
    });
    expectError(get, 404, "NOT_FOUND");
  });

  it("instructor cannot delete a question", async () => {
    const { questionId, instructor } = await createTestQuestion();

    const result = await api.delete(`/api/questions/${questionId}`, {
      token: instructor.accessToken,
    });

    expectError(result, 403, "FORBIDDEN");
  });

  // ── List / filter ────────────────────────────────────────

  it("lists questions with pagination", async () => {
    const instructor = await loginTestUser({ role: "instructor" });

    // Create 3 questions
    for (let i = 0; i < 3; i++) {
      await api.post("/api/questions", {
        token: instructor.accessToken,
        body: {
          skill: "reading",
          part: 1,
          content: {
            passage: `Passage ${i}`,
            items: [
              {
                stem: `Q${i}`,
                options: ["A", "B", "C", "D"],
              },
            ],
          },
          answerKey: { correctAnswers: { "1": "0" } },
        },
      });
    }

    const { status, data } = await api.get("/api/questions?page=1&limit=2", {
      token: instructor.accessToken,
    });

    expect(status).toBe(200);
    const items = data.data as Record<string, unknown>[];
    expect(items).toHaveLength(2);
    const meta = data.meta as Record<string, unknown>;
    expect(meta.total).toBeGreaterThanOrEqual(3);
    expect(meta.totalPages).toBeGreaterThanOrEqual(2);
  });

  it("filters questions by skill", async () => {
    const instructor = await loginTestUser({ role: "instructor" });

    await api.post("/api/questions", {
      token: instructor.accessToken,
      body: {
        skill: "writing",
        part: 1,
        content: {
          prompt: "Write about your day.",
          taskType: "letter",
          minWords: 120,
        },
      },
    });
    await api.post("/api/questions", {
      token: instructor.accessToken,
      body: {
        skill: "reading",
        part: 1,
        content: {
          passage: "Reading passage",
          items: [
            {
              stem: "Q",
              options: ["A", "B", "C", "D"],
            },
          ],
        },
        answerKey: { correctAnswers: { "1": "0" } },
      },
    });

    const { status, data } = await api.get("/api/questions?skill=writing", {
      token: instructor.accessToken,
    });

    expect(status).toBe(200);
    const items = data.data as Record<string, unknown>[];
    expect(items.length).toBeGreaterThanOrEqual(1);
    for (const item of items) {
      expect(item.skill).toBe("writing");
    }
  });

  it("non-admin only sees active questions", async () => {
    const { questionId, instructor } = await createTestQuestion();

    // Deactivate
    await api.patch(`/api/questions/${questionId}`, {
      token: instructor.accessToken,
      body: { isActive: false },
    });

    const learner = await loginTestUser({ role: "learner" });
    const { data } = await api.get("/api/questions", {
      token: learner.accessToken,
    });

    const items = data.data as Record<string, unknown>[];
    expect(items.find((q) => q.id === questionId)).toBeUndefined();
  });
});
