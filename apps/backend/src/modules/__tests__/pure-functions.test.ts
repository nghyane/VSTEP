import "../../plugins/__tests__/test-env";
import { describe, expect, test } from "bun:test";
import { hashToken, parseExpiry } from "../auth/service";
import {
  autoGradeAnswers,
  calculateOverallScore,
  calculateScore,
} from "../exams/service";
import { computeTrend } from "../progress/service";
import {
  scoreToBand,
  VALID_TRANSITIONS,
  validateTransition,
} from "../submissions/service";

// ─── scoreToBand ──────────────────────────────────────────────

describe("scoreToBand", () => {
  test("negative score returns null", () => {
    expect(scoreToBand(-1)).toBeNull();
  });

  test("score 0 returns null (below B1)", () => {
    expect(scoreToBand(0)).toBeNull();
  });

  test("score 3.5 returns null (below B1)", () => {
    expect(scoreToBand(3.5)).toBeNull();
  });

  test("score 4.0 returns B1 (boundary)", () => {
    expect(scoreToBand(4.0)).toBe("B1");
  });

  test("score 5.5 returns B1", () => {
    expect(scoreToBand(5.5)).toBe("B1");
  });

  test("score 6.0 returns B2 (boundary)", () => {
    expect(scoreToBand(6.0)).toBe("B2");
  });

  test("score 8.0 returns B2", () => {
    expect(scoreToBand(8.0)).toBe("B2");
  });

  test("score 8.5 returns C1 (boundary)", () => {
    expect(scoreToBand(8.5)).toBe("C1");
  });

  test("score 10 returns C1", () => {
    expect(scoreToBand(10)).toBe("C1");
  });
});

// ─── validateTransition ────────────────────────────────────────

describe("validateTransition", () => {
  test("valid: pending → queued", () => {
    expect(() => validateTransition("pending", "queued")).not.toThrow();
  });

  test("valid: pending → failed", () => {
    expect(() => validateTransition("pending", "failed")).not.toThrow();
  });

  test("valid: queued → processing", () => {
    expect(() => validateTransition("queued", "processing")).not.toThrow();
  });

  test("valid: processing → completed", () => {
    expect(() => validateTransition("processing", "completed")).not.toThrow();
  });

  test("valid: processing → review_pending", () => {
    expect(() =>
      validateTransition("processing", "review_pending"),
    ).not.toThrow();
  });

  test("valid: review_pending → completed", () => {
    expect(() =>
      validateTransition("review_pending", "completed"),
    ).not.toThrow();
  });

  test("valid: error → retrying", () => {
    expect(() => validateTransition("error", "retrying")).not.toThrow();
  });

  test("invalid: pending → completed (skips queued/processing)", () => {
    expect(() => validateTransition("pending", "completed")).toThrow(
      "Cannot transition from pending to completed",
    );
  });

  test("invalid: completed → pending (terminal state)", () => {
    expect(() => validateTransition("completed", "pending")).toThrow(
      "Cannot transition from completed to pending",
    );
  });

  test("invalid: failed → pending (terminal state)", () => {
    expect(() => validateTransition("failed", "pending")).toThrow(
      "Cannot transition from failed to pending",
    );
  });

  test("invalid: unknown state", () => {
    expect(() => validateTransition("nonexistent", "pending")).toThrow();
  });

  test("all terminal states have no allowed transitions", () => {
    expect(VALID_TRANSITIONS.completed).toEqual([]);
    expect(VALID_TRANSITIONS.failed).toEqual([]);
  });
});

// ─── computeTrend ──────────────────────────────────────────────

describe("computeTrend", () => {
  test("insufficient_data with < 3 scores", () => {
    expect(computeTrend([], null)).toBe("insufficient_data");
    expect(computeTrend([5], null)).toBe("insufficient_data");
    expect(computeTrend([5, 6], null)).toBe("insufficient_data");
  });

  test("stable with 3-5 scores and low stdDev", () => {
    expect(computeTrend([5, 5, 5], 0)).toBe("stable");
    expect(computeTrend([5, 5.5, 5], 0.3)).toBe("stable");
  });

  test("inconsistent with 3-5 scores and high stdDev", () => {
    expect(computeTrend([2, 8, 3], 3.2)).toBe("inconsistent");
    expect(computeTrend([1, 9, 5], 4.0)).toBe("inconsistent");
  });

  test("improving with 6+ scores (recent avg > prev avg by >= 0.5)", () => {
    // recent3=[8, 7, 7]=7.33, prev3=[5, 5, 5]=5.0, delta=2.33
    expect(computeTrend([8, 7, 7, 5, 5, 5], 1.0)).toBe("improving");
  });

  test("declining with 6+ scores (recent avg < prev avg by >= 0.5)", () => {
    // recent3=[4, 4, 4]=4.0, prev3=[7, 7, 7]=7.0, delta=-3.0
    expect(computeTrend([4, 4, 4, 7, 7, 7], 1.0)).toBe("declining");
  });

  test("stable with 6+ scores (small delta)", () => {
    // recent3=[5, 5, 5]=5.0, prev3=[5, 5, 5]=5.0, delta=0
    expect(computeTrend([5, 5, 5, 5, 5, 5], 0)).toBe("stable");
  });

  test("inconsistent with 6+ scores and high stdDev", () => {
    expect(computeTrend([1, 9, 1, 9, 1, 9], 4.0)).toBe("inconsistent");
  });
});

// ─── parseExpiry ───────────────────────────────────────────────

describe("parseExpiry", () => {
  test("parses seconds", () => {
    expect(parseExpiry("30s")).toBe(30);
  });

  test("parses minutes", () => {
    expect(parseExpiry("15m")).toBe(900);
  });

  test("parses hours", () => {
    expect(parseExpiry("2h")).toBe(7200);
  });

  test("parses days", () => {
    expect(parseExpiry("7d")).toBe(604800);
  });

  test("returns 900 for invalid format", () => {
    expect(parseExpiry("abc")).toBe(900);
    expect(parseExpiry("")).toBe(900);
    expect(parseExpiry("15")).toBe(900);
    expect(parseExpiry("15w")).toBe(900);
  });
});

// ─── hashToken ─────────────────────────────────────────────────

describe("hashToken", () => {
  test("returns hex string of length 64 (SHA-256)", () => {
    const hash = hashToken("test-token");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  test("same input produces same hash", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
  });

  test("different inputs produce different hashes", () => {
    expect(hashToken("token-a")).not.toBe(hashToken("token-b"));
  });
});

// ─── calculateScore ────────────────────────────────────────────

describe("calculateScore", () => {
  test("0 total returns null", () => {
    expect(calculateScore(0, 0)).toBeNull();
  });

  test("perfect score", () => {
    expect(calculateScore(35, 35)).toBe(10);
  });

  test("half correct", () => {
    expect(calculateScore(5, 10)).toBe(5);
  });

  test("rounds to nearest 0.5", () => {
    // 7/10 = 7.0 → 7.0
    expect(calculateScore(7, 10)).toBe(7);
    // 3/10 = 3.0
    expect(calculateScore(3, 10)).toBe(3);
    // 1/3 = 3.333... → 3.5
    expect(calculateScore(1, 3)).toBe(3.5);
    // 2/3 = 6.666... → 6.5
    expect(calculateScore(2, 3)).toBe(6.5);
  });

  test("zero correct returns 0", () => {
    expect(calculateScore(0, 10)).toBe(0);
  });
});

// ─── calculateOverallScore ─────────────────────────────────────

describe("calculateOverallScore", () => {
  test("returns null if any score is null", () => {
    expect(calculateOverallScore([8, 7, null, null])).toBeNull();
    expect(calculateOverallScore([null, null, null, null])).toBeNull();
  });

  test("all scores present — simple average", () => {
    // (8 + 8 + 8 + 8) / 4 = 8.0
    expect(calculateOverallScore([8, 8, 8, 8])).toBe(8);
  });

  test("rounds to nearest 0.5", () => {
    // (8 + 7 + 6 + 5) / 4 = 6.5
    expect(calculateOverallScore([8, 7, 6, 5])).toBe(6.5);
    // (9 + 8 + 7 + 6) / 4 = 7.5
    expect(calculateOverallScore([9, 8, 7, 6])).toBe(7.5);
    // (8 + 6 + 7 + 5) / 4 = 6.5
    expect(calculateOverallScore([8, 6, 7, 5])).toBe(6.5);
  });

  test("rounding: (9 + 8 + 6 + 5) / 4 = 7.0", () => {
    expect(calculateOverallScore([9, 8, 6, 5])).toBe(7);
  });

  test("rounding: (10 + 4 + 6 + 5) / 4 = 6.25 → 6.5", () => {
    expect(calculateOverallScore([10, 4, 6, 5])).toBe(6.5);
  });

  test("empty array returns null", () => {
    expect(calculateOverallScore([])).toBeNull();
  });
});

// ─── autoGradeAnswers ──────────────────────────────────────────

describe("autoGradeAnswers", () => {
  const makeQuestion = (
    skill: string,
    correctAnswers: Record<string, string>,
  ) => ({
    skill,
    answerKey: { correctAnswers },
  });

  test("grades listening answers correctly", () => {
    const questionsMap = new Map([
      ["q1", makeQuestion("listening", { "1": "A", "2": "B", "3": "C" })],
    ]);
    const answers = [
      { questionId: "q1", answer: { "1": "A", "2": "B", "3": "D" } },
    ];

    const result = autoGradeAnswers(answers, questionsMap);
    expect(result.listeningCorrect).toBe(2);
    expect(result.listeningTotal).toBe(3);
    expect(result.correctnessMap.get("q1")).toBe(false);
  });

  test("grades reading answers correctly", () => {
    const questionsMap = new Map([
      ["q1", makeQuestion("reading", { "1": "A", "2": "B" })],
    ]);
    const answers = [{ questionId: "q1", answer: { "1": "A", "2": "B" } }];

    const result = autoGradeAnswers(answers, questionsMap);
    expect(result.readingCorrect).toBe(2);
    expect(result.readingTotal).toBe(2);
    expect(result.correctnessMap.get("q1")).toBe(true);
  });

  test("case-insensitive comparison with trim", () => {
    const questionsMap = new Map([
      ["q1", makeQuestion("reading", { "1": "Answer " })],
    ]);
    const answers = [{ questionId: "q1", answer: { "1": " answer" } }];

    const result = autoGradeAnswers(answers, questionsMap);
    expect(result.readingCorrect).toBe(1);
    expect(result.correctnessMap.get("q1")).toBe(true);
  });

  test("collects writing and speaking answers", () => {
    const questionsMap = new Map<string, { skill: string; answerKey: unknown }>(
      [
        ["q1", { skill: "writing", answerKey: null }],
        ["q2", { skill: "speaking", answerKey: null }],
      ],
    );
    const answers = [
      { questionId: "q1", answer: { text: "essay" } },
      { questionId: "q2", answer: { audioUrl: "http://audio.mp3" } },
    ];

    const result = autoGradeAnswers(answers, questionsMap);
    expect(result.writingAnswers).toHaveLength(1);
    expect(result.speakingAnswers).toHaveLength(1);
    expect(result.correctnessMap.size).toBe(0);
  });

  test("skips unknown question IDs", () => {
    const questionsMap = new Map<
      string,
      { skill: string; answerKey: unknown }
    >();
    const answers = [{ questionId: "unknown", answer: {} }];

    const result = autoGradeAnswers(answers, questionsMap);
    expect(result.listeningTotal).toBe(0);
    expect(result.readingTotal).toBe(0);
  });

  test("mixed skills in single exam", () => {
    const questionsMap = new Map([
      ["q1", makeQuestion("listening", { "1": "A" })],
      ["q2", makeQuestion("reading", { "1": "B", "2": "C" })],
      [
        "q3",
        { skill: "writing", answerKey: null } as {
          skill: string;
          answerKey: unknown;
        },
      ],
    ]);
    const answers = [
      { questionId: "q1", answer: { "1": "A" } },
      { questionId: "q2", answer: { "1": "B", "2": "D" } },
      { questionId: "q3", answer: { text: "My essay" } },
    ];

    const result = autoGradeAnswers(answers, questionsMap);
    expect(result.listeningCorrect).toBe(1);
    expect(result.listeningTotal).toBe(1);
    expect(result.readingCorrect).toBe(1);
    expect(result.readingTotal).toBe(2);
    expect(result.writingAnswers).toHaveLength(1);
    expect(result.correctnessMap.get("q1")).toBe(true);
    expect(result.correctnessMap.get("q2")).toBe(false);
  });

  test("null user answer counts as incorrect", () => {
    const questionsMap = new Map([
      ["q1", makeQuestion("listening", { "1": "A" })],
    ]);
    const answers = [{ questionId: "q1", answer: null }];

    const result = autoGradeAnswers(answers, questionsMap);
    expect(result.listeningCorrect).toBe(0);
    expect(result.listeningTotal).toBe(1);
    expect(result.correctnessMap.get("q1")).toBe(false);
  });
});
