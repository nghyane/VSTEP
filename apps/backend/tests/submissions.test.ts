import { afterAll, beforeEach, describe, expect, it } from "bun:test";
import {
  api,
  cleanupTestData,
  createTestQuestion,
  expectError,
  loginTestUser,
} from "./helpers";

describe("submissions integration", () => {
  beforeEach(() => cleanupTestData());
  afterAll(() => cleanupTestData());

  // ── Create submission ────────────────────────────────────

  it("creates a submission for an active question", async () => {
    const { questionId } = await createTestQuestion();
    const learner = await loginTestUser({ role: "learner" });

    const { status, data } = await api.post("/api/submissions", {
      token: learner.accessToken,
      body: {
        questionId,
        answer: {
          answers: { "1": "A" },
        },
      },
    });

    expect(status).toBe(201);
    expect(data.questionId).toBe(questionId);
    expect(data.userId).toBe(learner.user.id);
    expect(data.status).toBe("pending");
    expect(data.answer).toBeDefined();
  });

  it("rejects submission for non-existent question", async () => {
    const learner = await loginTestUser({ role: "learner" });

    const result = await api.post("/api/submissions", {
      token: learner.accessToken,
      body: {
        questionId: "00000000-0000-0000-0000-000000000000",
        answer: { answers: { "1": "A" } },
      },
    });

    expectError(result, 404, "NOT_FOUND");
  });

  // ── Get / List submissions ───────────────────────────────

  it("gets own submission by ID", async () => {
    const { questionId } = await createTestQuestion();
    const learner = await loginTestUser({ role: "learner" });

    const created = await api.post("/api/submissions", {
      token: learner.accessToken,
      body: { questionId, answer: { answers: { "1": "B" } } },
    });
    const subId = created.data.id as string;

    const { status, data } = await api.get(`/api/submissions/${subId}`, {
      token: learner.accessToken,
    });

    expect(status).toBe(200);
    expect(data.id).toBe(subId);
  });

  it("cannot view another user submission", async () => {
    const { questionId } = await createTestQuestion();
    const learnerA = await loginTestUser({ role: "learner" });
    const learnerB = await loginTestUser({ role: "learner" });

    const created = await api.post("/api/submissions", {
      token: learnerA.accessToken,
      body: { questionId, answer: { answers: { "1": "A" } } },
    });
    const subId = created.data.id as string;

    const result = await api.get(`/api/submissions/${subId}`, {
      token: learnerB.accessToken,
    });

    expectError(result, 403, "FORBIDDEN");
  });

  it("lists own submissions with pagination", async () => {
    const { questionId } = await createTestQuestion();
    const learner = await loginTestUser({ role: "learner" });

    await api.post("/api/submissions", {
      token: learner.accessToken,
      body: { questionId, answer: { answers: { "1": "A" } } },
    });
    await api.post("/api/submissions", {
      token: learner.accessToken,
      body: { questionId, answer: { answers: { "1": "B" } } },
    });

    const { status, data } = await api.get(
      "/api/submissions?page=1&limit=10&skill=reading&status=pending",
      { token: learner.accessToken },
    );

    expect(status).toBe(200);
    const items = data.data as Record<string, unknown>[];
    expect(items).toHaveLength(2);
    const meta = data.meta as Record<string, unknown>;
    expect(meta.total).toBe(2);
  });

  // ── Auto-grade ───────────────────────────────────────────

  it("auto-grades an objective submission", async () => {
    const { questionId } = await createTestQuestion(); // reading_mcq with answerKey
    const learner = await loginTestUser({ role: "learner" });
    const admin = await loginTestUser({ role: "admin" });

    const created = await api.post("/api/submissions", {
      token: learner.accessToken,
      body: { questionId, answer: { answers: { "1": "A" } } }, // correct answer
    });
    const subId = created.data.id as string;

    const { status, data } = await api.post(
      `/api/submissions/${subId}/auto-grade`,
      { token: admin.accessToken },
    );

    expect(status).toBe(200);
    expect(data.score).toBeNumber();
    expect(data.result).toBeDefined();
  });

  it("non-admin cannot auto-grade", async () => {
    const { questionId, instructor } = await createTestQuestion();
    const learner = await loginTestUser({ role: "learner" });

    const created = await api.post("/api/submissions", {
      token: learner.accessToken,
      body: { questionId, answer: { answers: { "1": "A" } } },
    });
    const subId = created.data.id as string;

    const result = await api.post(`/api/submissions/${subId}/auto-grade`, {
      token: instructor.accessToken,
    });

    expectError(result, 403, "FORBIDDEN");
  });

  // ── Manual grading ──────────────────────────────────────

  it("instructor grades a submission", async () => {
    const instructor = await loginTestUser({ role: "instructor" });
    const learner = await loginTestUser({ role: "learner" });

    // Create writing question + submission for manual grading
    const { data: writingQ } = await api.post("/api/questions", {
      token: instructor.accessToken,
      body: {
        skill: "writing",
        level: "B2",
        format: "writing_task_1",
        content: { taskNumber: 1, prompt: "Write about your day." },
      },
    });

    const created = await api.post("/api/submissions", {
      token: learner.accessToken,
      body: {
        questionId: writingQ.id as string,
        answer: { text: "My day was great." },
      },
    });
    const subId = created.data.id as string;

    // Transition through valid states: pending → queued → processing → review_pending
    const admin = await loginTestUser({ role: "admin" });
    await api.patch(`/api/submissions/${subId}`, {
      token: admin.accessToken,
      body: { status: "queued" },
    });
    await api.patch(`/api/submissions/${subId}`, {
      token: admin.accessToken,
      body: { status: "processing" },
    });
    await api.patch(`/api/submissions/${subId}`, {
      token: admin.accessToken,
      body: { status: "review_pending" },
    });

    const { status, data } = await api.post(`/api/submissions/${subId}/grade`, {
      token: instructor.accessToken,
      body: { score: 7.5, feedback: "Good effort" },
    });

    expect(status).toBe(200);
    expect(data.score).toBe(7.5);
    expect(data.status).toBe("completed");
  });

  // ── Delete submission ────────────────────────────────────

  it("deletes own submission (soft delete)", async () => {
    const { questionId } = await createTestQuestion();
    const learner = await loginTestUser({ role: "learner" });

    const created = await api.post("/api/submissions", {
      token: learner.accessToken,
      body: { questionId, answer: { answers: { "1": "A" } } },
    });
    const subId = created.data.id as string;

    const { status, data } = await api.delete(`/api/submissions/${subId}`, {
      token: learner.accessToken,
    });

    expect(status).toBe(200);
    expect(data.id).toBe(subId);
    expect(data.deletedAt).toBeString();
  });

  it("cannot delete another user submission", async () => {
    const { questionId } = await createTestQuestion();
    const learnerA = await loginTestUser({ role: "learner" });
    const learnerB = await loginTestUser({ role: "learner" });

    const created = await api.post("/api/submissions", {
      token: learnerA.accessToken,
      body: { questionId, answer: { answers: { "1": "A" } } },
    });
    const subId = created.data.id as string;

    const result = await api.delete(`/api/submissions/${subId}`, {
      token: learnerB.accessToken,
    });

    expectError(result, 403, "FORBIDDEN");
  });
});
