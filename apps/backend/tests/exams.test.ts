import { afterAll, beforeEach, describe, expect, it } from "bun:test";
import {
  api,
  cleanupTestData,
  createTestExam,
  expectError,
  loginTestUser,
} from "./helpers";

describe("exams integration", () => {
  beforeEach(() => cleanupTestData());
  afterAll(() => cleanupTestData());

  // ── Exam CRUD ────────────────────────────────────────────

  it("admin creates an exam with valid blueprint", async () => {
    const exam = await createTestExam();

    expect(exam.examId).toBeString();
    expect(exam.questionIds.listening).toHaveLength(1);
    expect(exam.questionIds.reading).toHaveLength(1);
    expect(exam.questionIds.writing).toHaveLength(1);
    expect(exam.questionIds.speaking).toHaveLength(1);
  });

  it("non-admin cannot create an exam", async () => {
    const instructor = await loginTestUser({ role: "instructor" });

    const result = await api.post("/api/exams", {
      token: instructor.accessToken,
      body: {
        level: "B2",
        blueprint: {
          listening: { questionIds: [] },
          reading: { questionIds: [] },
          writing: { questionIds: [] },
          speaking: { questionIds: [] },
        },
      },
    });

    expectError(result, 403, "FORBIDDEN");
  });

  it("lists exams with pagination", async () => {
    const exam = await createTestExam();

    const { status, data } = await api.get(
      "/api/exams?page=1&limit=10&level=B2",
      {
        token: exam.admin.accessToken,
      },
    );

    expect(status).toBe(200);
    const items = data.data as Record<string, unknown>[];
    expect(items.length).toBeGreaterThanOrEqual(1);
    const meta = data.meta as Record<string, unknown>;
    expect(meta.total).toBeGreaterThanOrEqual(1);
  });

  it("gets exam by ID", async () => {
    const exam = await createTestExam();
    const learner = await loginTestUser({ role: "learner" });

    const { status, data } = await api.get(`/api/exams/${exam.examId}`, {
      token: learner.accessToken,
    });

    expect(status).toBe(200);
    expect(data.id).toBe(exam.examId);
    expect(data.level).toBe("B2");
    expect(data.blueprint).toBeDefined();
  });

  it("admin updates exam", async () => {
    const exam = await createTestExam();

    const { status, data } = await api.patch(`/api/exams/${exam.examId}`, {
      token: exam.admin.accessToken,
      body: { isActive: false },
    });

    expect(status).toBe(200);
    expect(data.isActive).toBe(false);
  });

  // ── Session management ───────────────────────────────────

  it("learner starts an exam session", async () => {
    const exam = await createTestExam();
    const learner = await loginTestUser({ role: "learner" });

    const { status, data } = await api.post(`/api/exams/${exam.examId}/start`, {
      token: learner.accessToken,
    });

    expect(status).toBe(200);
    expect(data.examId).toBe(exam.examId);
    expect(data.userId).toBe(learner.user.id);
    expect(data.status).toBe("in_progress");
  });

  it("resuming returns the same session", async () => {
    const exam = await createTestExam();
    const learner = await loginTestUser({ role: "learner" });

    const first = await api.post(`/api/exams/${exam.examId}/start`, {
      token: learner.accessToken,
    });
    const second = await api.post(`/api/exams/${exam.examId}/start`, {
      token: learner.accessToken,
    });

    expect(first.data.id).toBe(second.data.id);
  });

  it("gets session by ID", async () => {
    const exam = await createTestExam();
    const learner = await loginTestUser({ role: "learner" });

    const started = await api.post(`/api/exams/${exam.examId}/start`, {
      token: learner.accessToken,
    });
    const sessionId = started.data.id as string;

    const { status, data } = await api.get(`/api/exams/sessions/${sessionId}`, {
      token: learner.accessToken,
    });

    expect(status).toBe(200);
    expect(data.id).toBe(sessionId);
    expect(data.status).toBe("in_progress");
  });

  it("other learner cannot view session", async () => {
    const exam = await createTestExam();
    const learnerA = await loginTestUser({ role: "learner" });
    const learnerB = await loginTestUser({ role: "learner" });

    const started = await api.post(`/api/exams/${exam.examId}/start`, {
      token: learnerA.accessToken,
    });
    const sessionId = started.data.id as string;

    const result = await api.get(`/api/exams/sessions/${sessionId}`, {
      token: learnerB.accessToken,
    });

    expectError(result, 403, "FORBIDDEN");
  });

  // ── Answer submission ────────────────────────────────────

  it("submits a single answer", async () => {
    const exam = await createTestExam();
    const learner = await loginTestUser({ role: "learner" });

    const started = await api.post(`/api/exams/${exam.examId}/start`, {
      token: learner.accessToken,
    });
    const sessionId = started.data.id as string;

    const { status, data } = await api.post(
      `/api/exams/sessions/${sessionId}/answer`,
      {
        token: learner.accessToken,
        body: {
          questionId: exam.questionIds.reading[0],
          answer: { answers: { "1": "A" } },
        },
      },
    );

    expect(status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("bulk saves answers", async () => {
    const exam = await createTestExam();
    const learner = await loginTestUser({ role: "learner" });

    const started = await api.post(`/api/exams/${exam.examId}/start`, {
      token: learner.accessToken,
    });
    const sessionId = started.data.id as string;

    const { status, data } = await api.put(`/api/exams/sessions/${sessionId}`, {
      token: learner.accessToken,
      body: {
        answers: [
          {
            questionId: exam.questionIds.listening[0],
            answer: { answers: { "1": "A" } },
          },
          {
            questionId: exam.questionIds.reading[0],
            answer: { answers: { "1": "A" } },
          },
        ],
      },
    });

    expect(status).toBe(200);
    expect(data.saved).toBe(2);
  });

  it("rejects answer for question not in blueprint", async () => {
    const exam = await createTestExam();
    const otherExam = await createTestExam();
    const learner = await loginTestUser({ role: "learner" });

    const started = await api.post(`/api/exams/${exam.examId}/start`, {
      token: learner.accessToken,
    });
    const sessionId = started.data.id as string;

    const result = await api.post(`/api/exams/sessions/${sessionId}/answer`, {
      token: learner.accessToken,
      body: {
        questionId: otherExam.questionIds.reading[0],
        answer: { answers: { "1": "A" } },
      },
    });

    expectError(result, 400, "BAD_REQUEST");
  });

  // ── Submit exam ──────────────────────────────────────────

  it("submits exam and auto-grades objective answers", async () => {
    const exam = await createTestExam();
    const learner = await loginTestUser({ role: "learner" });

    // Start session
    const started = await api.post(`/api/exams/${exam.examId}/start`, {
      token: learner.accessToken,
    });
    const sessionId = started.data.id as string;

    // Answer all questions
    await api.post(`/api/exams/sessions/${sessionId}/answer`, {
      token: learner.accessToken,
      body: {
        questionId: exam.questionIds.listening[0],
        answer: { answers: { "1": "A" } }, // correct
      },
    });
    await api.post(`/api/exams/sessions/${sessionId}/answer`, {
      token: learner.accessToken,
      body: {
        questionId: exam.questionIds.reading[0],
        answer: { answers: { "1": "A" } }, // correct
      },
    });
    await api.post(`/api/exams/sessions/${sessionId}/answer`, {
      token: learner.accessToken,
      body: {
        questionId: exam.questionIds.writing[0],
        answer: { text: "My essay about testing." },
      },
    });
    await api.post(`/api/exams/sessions/${sessionId}/answer`, {
      token: learner.accessToken,
      body: {
        questionId: exam.questionIds.speaking[0],
        answer: {
          audioUrl: "https://example.com/audio.mp3",
          durationSeconds: 120,
        },
      },
    });

    // Submit exam
    const { status, data } = await api.post(
      `/api/exams/sessions/${sessionId}/submit`,
      { token: learner.accessToken },
    );

    expect(status).toBe(200);
    expect(data.listeningScore).toBeNumber();
    expect(data.readingScore).toBeNumber();
    expect(data.status).toBeOneOf(["submitted", "completed"]);
  });
});
