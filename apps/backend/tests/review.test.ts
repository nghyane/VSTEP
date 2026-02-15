import { afterAll, beforeEach, describe, expect, it } from "bun:test";
import { api, cleanupTestData, expectError, loginTestUser } from "./helpers";

// ---------------------------------------------------------------------------
// Setup: create a submission in review_pending state via reading question
// Uses reading (no Redis dispatch) + admin PATCH for deterministic state.
// ---------------------------------------------------------------------------

async function createReviewPendingSub() {
  const instructor = await loginTestUser({ role: "instructor" });
  const learner = await loginTestUser({ role: "learner" });
  const admin = await loginTestUser({ role: "admin" });

  // Create reading question — avoids Redis grading dispatch
  const { data: question } = await api.post("/api/questions", {
    token: instructor.accessToken,
    body: {
      skill: "reading",
      level: "B2",
      format: "reading_mcq",
      content: {
        passage: "Review workflow test passage.",
        items: [
          {
            number: 1,
            prompt: "Main idea?",
            options: { A: "A", B: "B", C: "C", D: "D" },
          },
        ],
      },
      answerKey: { correctAnswers: { "1": "A" } },
    },
  });

  // Learner submits answer
  const { data: sub } = await api.post("/api/submissions", {
    token: learner.accessToken,
    body: {
      questionId: question.id as string,
      answer: { answers: { "1": "B" } },
    },
  });
  const subId = sub.id as string;

  // Transition: pending → processing → review_pending
  for (const status of ["processing", "review_pending"]) {
    const { status: httpStatus } = await api.patch(
      `/api/submissions/${subId}`,
      { token: admin.accessToken, body: { status } },
    );
    if (httpStatus !== 200) {
      throw new Error(`Failed to transition to ${status}: HTTP ${httpStatus}`);
    }
  }

  return { subId, instructor, learner, admin };
}

describe("review workflow integration", () => {
  beforeEach(() => cleanupTestData());
  afterAll(() => cleanupTestData());

  // ── Review Queue ─────────────────────────────────────────

  it("instructor sees review_pending submissions in queue", async () => {
    const { instructor } = await createReviewPendingSub();

    const { status, data } = await api.get("/api/submissions/queue", {
      token: instructor.accessToken,
    });

    expect(status).toBe(200);
    const items = data.data as Record<string, unknown>[];
    expect(items.length).toBeGreaterThanOrEqual(1);
    const meta = data.meta as Record<string, unknown>;
    expect(meta.total).toBeGreaterThanOrEqual(1);
  });

  it("filters queue by skill", async () => {
    const { instructor } = await createReviewPendingSub();

    const { status, data } = await api.get(
      "/api/submissions/queue?skill=reading",
      { token: instructor.accessToken },
    );

    expect(status).toBe(200);
    const items = data.data as Record<string, unknown>[];
    expect(items.length).toBeGreaterThanOrEqual(1);
    for (const item of items) {
      expect(item.skill).toBe("reading");
    }
  });

  it("learner cannot access review queue", async () => {
    const { learner } = await createReviewPendingSub();

    const result = await api.get("/api/submissions/queue", {
      token: learner.accessToken,
    });

    expectError(result, 403, "FORBIDDEN");
  });

  // ── Claim ────────────────────────────────────────────────

  it("instructor claims a submission", async () => {
    const { subId, instructor } = await createReviewPendingSub();

    const { status, data } = await api.post(`/api/submissions/${subId}/claim`, {
      token: instructor.accessToken,
    });

    expect(status).toBe(200);
    expect(data.id).toBe(subId);
    // SUBMISSION_COLUMNS omits claimedBy — verify claim via re-claim
  });

  it("second instructor cannot claim already-claimed submission", async () => {
    const { subId, instructor } = await createReviewPendingSub();
    const instructor2 = await loginTestUser({ role: "instructor" });

    await api.post(`/api/submissions/${subId}/claim`, {
      token: instructor.accessToken,
    });

    const result = await api.post(`/api/submissions/${subId}/claim`, {
      token: instructor2.accessToken,
    });

    expectError(result, 409, "CONFLICT");
  });

  it("same instructor can re-claim own submission", async () => {
    const { subId, instructor } = await createReviewPendingSub();

    await api.post(`/api/submissions/${subId}/claim`, {
      token: instructor.accessToken,
    });

    const { status } = await api.post(`/api/submissions/${subId}/claim`, {
      token: instructor.accessToken,
    });

    expect(status).toBe(200);
  });

  // ── Release ──────────────────────────────────────────────

  it("instructor releases own claimed submission", async () => {
    const { subId, instructor } = await createReviewPendingSub();

    await api.post(`/api/submissions/${subId}/claim`, {
      token: instructor.accessToken,
    });

    const { status } = await api.post(`/api/submissions/${subId}/release`, {
      token: instructor.accessToken,
    });

    expect(status).toBe(200);

    // After release, another instructor should be able to claim
    const instructor2 = await loginTestUser({ role: "instructor" });
    const { status: claimStatus } = await api.post(
      `/api/submissions/${subId}/claim`,
      { token: instructor2.accessToken },
    );
    expect(claimStatus).toBe(200);
  });

  it("cannot release submission claimed by another", async () => {
    const { subId, instructor } = await createReviewPendingSub();
    const instructor2 = await loginTestUser({ role: "instructor" });

    await api.post(`/api/submissions/${subId}/claim`, {
      token: instructor.accessToken,
    });

    const result = await api.post(`/api/submissions/${subId}/release`, {
      token: instructor2.accessToken,
    });

    expectError(result, 403, "FORBIDDEN");
  });

  // ── Submit Review ────────────────────────────────────────

  it("instructor submits review after claiming", async () => {
    const { subId, instructor } = await createReviewPendingSub();

    await api.post(`/api/submissions/${subId}/claim`, {
      token: instructor.accessToken,
    });

    const { status, data } = await api.put(`/api/submissions/${subId}/review`, {
      token: instructor.accessToken,
      body: {
        overallScore: 7.5,
        feedback: "Well structured response with clear arguments.",
      },
    });

    expect(status).toBe(200);
    expect(data.score).toBe(7.5);
    expect(data.status).toBe("completed");
  });

  it("cannot review without claiming first", async () => {
    const { subId } = await createReviewPendingSub();
    const instructor2 = await loginTestUser({ role: "instructor" });

    const result = await api.put(`/api/submissions/${subId}/review`, {
      token: instructor2.accessToken,
      body: { overallScore: 6.0 },
    });

    expectError(result, 403, "FORBIDDEN");
  });

  it("cannot review already-completed submission", async () => {
    const { subId, instructor } = await createReviewPendingSub();

    await api.post(`/api/submissions/${subId}/claim`, {
      token: instructor.accessToken,
    });
    await api.put(`/api/submissions/${subId}/review`, {
      token: instructor.accessToken,
      body: { overallScore: 8.0 },
    });

    const result = await api.put(`/api/submissions/${subId}/review`, {
      token: instructor.accessToken,
      body: { overallScore: 7.0 },
    });

    expectError(result, 409, "CONFLICT");
  });

  it("review with criteria scores and comment", async () => {
    const { subId, instructor } = await createReviewPendingSub();

    await api.post(`/api/submissions/${subId}/claim`, {
      token: instructor.accessToken,
    });

    const { status, data } = await api.put(`/api/submissions/${subId}/review`, {
      token: instructor.accessToken,
      body: {
        overallScore: 6.5,
        feedback: "Needs improvement in grammar.",
        reviewComment: "Student shows potential but lacks coherence.",
        criteriaScores: {
          taskAchievement: 7,
          coherence: 5,
          lexicalResource: 7,
          grammar: 6,
        },
      },
    });

    expect(status).toBe(200);
    expect(data.score).toBe(6.5);
    expect(data.status).toBe("completed");
  });
});
