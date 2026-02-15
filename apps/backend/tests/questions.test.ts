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

  it("instructor creates a question with version 1", async () => {
    const instructor = await loginTestUser({ role: "instructor" });

    const { status, data } = await api.post("/api/questions", {
      token: instructor.accessToken,
      body: {
        skill: "reading",
        level: "B2",
        format: "reading_mcq",
        content: {
          passage: "The quick brown fox.",
          items: [
            {
              number: 1,
              prompt: "What color is the fox?",
              options: { A: "Brown", B: "Red", C: "Blue", D: "Green" },
            },
          ],
        },
        answerKey: { correctAnswers: { "1": "A" } },
      },
    });

    expect(status).toBe(201);
    expect(data.skill).toBe("reading");
    expect(data.level).toBe("B2");
    expect(data.format).toBe("reading_mcq");
    expect(data.version).toBe(1);
    expect(data.isActive).toBe(true);
    expect(data.createdBy).toBe(instructor.user.id);
  });

  it("learner cannot create a question", async () => {
    const learner = await loginTestUser({ role: "learner" });

    const result = await api.post("/api/questions", {
      token: learner.accessToken,
      body: {
        skill: "reading",
        level: "B1",
        format: "reading_mcq",
        content: {
          passage: "Should fail.",
          items: [
            {
              number: 1,
              prompt: "Nope",
              options: { A: "A", B: "B", C: "C", D: "D" },
            },
          ],
        },
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
      body: { level: "C1", isActive: false },
    });

    expect(status).toBe(200);
    expect(data.level).toBe("C1");
    expect(data.isActive).toBe(false);
    expect(data.version).toBe(1); // no content change, no version bump
  });

  it("instructor updates content — version bumps", async () => {
    const { questionId, instructor } = await createTestQuestion();

    const { status, data } = await api.patch(`/api/questions/${questionId}`, {
      token: instructor.accessToken,
      body: {
        content: {
          passage: "Updated passage.",
          items: [
            {
              number: 1,
              prompt: "New question?",
              options: { A: "A1", B: "B1", C: "C1", D: "D1" },
            },
          ],
        },
      },
    });

    expect(status).toBe(200);
    expect(data.version).toBe(2);
  });

  it("other instructor cannot update question they did not create", async () => {
    const { questionId } = await createTestQuestion();
    const other = await loginTestUser({ role: "instructor" });

    const result = await api.patch(`/api/questions/${questionId}`, {
      token: other.accessToken,
      body: { level: "A1" },
    });

    expectError(result, 403, "FORBIDDEN");
  });

  it("admin can update any question", async () => {
    const { questionId } = await createTestQuestion();
    const admin = await loginTestUser({ role: "admin" });

    const { status, data } = await api.patch(`/api/questions/${questionId}`, {
      token: admin.accessToken,
      body: { level: "A2" },
    });

    expect(status).toBe(200);
    expect(data.level).toBe("A2");
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
          level: "B2",
          format: "reading_mcq",
          content: {
            passage: `Passage ${i}`,
            items: [
              {
                number: 1,
                prompt: `Q${i}`,
                options: { A: "A", B: "B", C: "C", D: "D" },
              },
            ],
          },
          answerKey: { correctAnswers: { "1": "A" } },
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
        level: "B2",
        format: "writing_task_1",
        content: { taskNumber: 1, prompt: "Write about your day." },
      },
    });
    await api.post("/api/questions", {
      token: instructor.accessToken,
      body: {
        skill: "reading",
        level: "B2",
        format: "reading_mcq",
        content: {
          passage: "Reading passage",
          items: [
            {
              number: 1,
              prompt: "Q",
              options: { A: "A", B: "B", C: "C", D: "D" },
            },
          ],
        },
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

  // ── Versioning ───────────────────────────────────────────

  it("creates a new version explicitly", async () => {
    const { questionId, instructor } = await createTestQuestion();

    const { status, data } = await api.post(
      `/api/questions/${questionId}/versions`,
      {
        token: instructor.accessToken,
        body: {
          content: {
            passage: "Version 2 passage.",
            items: [
              {
                number: 1,
                prompt: "V2 question?",
                options: { A: "A", B: "B", C: "C", D: "D" },
              },
            ],
          },
        },
      },
    );

    expect(status).toBe(201);
    expect(data.version).toBe(2);
    expect(data.questionId).toBe(questionId);
  });

  it("lists all versions of a question", async () => {
    const { questionId, instructor } = await createTestQuestion();

    // Create version 2
    await api.post(`/api/questions/${questionId}/versions`, {
      token: instructor.accessToken,
      body: {
        content: {
          passage: "V2",
          items: [
            {
              number: 1,
              prompt: "Q",
              options: { A: "A", B: "B", C: "C", D: "D" },
            },
          ],
        },
      },
    });

    const { status, data } = await api.get(
      `/api/questions/${questionId}/versions`,
      { token: instructor.accessToken },
    );

    expect(status).toBe(200);
    const versions = data.data as Record<string, unknown>[];
    expect(versions).toHaveLength(2);
    const meta = data.meta as Record<string, unknown>;
    expect(meta.total).toBe(2);
  });

  it("gets a specific version by ID", async () => {
    const { questionId, instructor } = await createTestQuestion();

    const created = await api.post(`/api/questions/${questionId}/versions`, {
      token: instructor.accessToken,
      body: {
        content: {
          passage: "Specific version",
          items: [
            {
              number: 1,
              prompt: "Q",
              options: { A: "A", B: "B", C: "C", D: "D" },
            },
          ],
        },
      },
    });

    const versionId = created.data.id as string;

    const { status, data } = await api.get(
      `/api/questions/${questionId}/versions/${versionId}`,
      { token: instructor.accessToken },
    );

    expect(status).toBe(200);
    expect(data.id).toBe(versionId);
    expect(data.version).toBe(2);
  });

  it("other instructor cannot create version on question they did not create", async () => {
    const { questionId } = await createTestQuestion();
    const other = await loginTestUser({ role: "instructor" });

    const result = await api.post(`/api/questions/${questionId}/versions`, {
      token: other.accessToken,
      body: {
        content: {
          passage: "Hijack attempt",
          items: [
            {
              number: 1,
              prompt: "Q",
              options: { A: "A", B: "B", C: "C", D: "D" },
            },
          ],
        },
      },
    });

    expectError(result, 403, "FORBIDDEN");
  });
});
