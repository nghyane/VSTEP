import { describe, expect, it } from "bun:test";
import {
  calculateOverallScore,
  calculateScore,
  normalizeAnswer,
  parseAnswerKey,
  parseUserAnswer,
  scoreToBand,
} from "./scoring";

describe("calculateScore", () => {
  it("returns null when total is zero", () => {
    expect(calculateScore(0, 0)).toBeNull();
  });

  it("returns 0 when there are no correct answers", () => {
    expect(calculateScore(0, 10)).toBe(0);
  });

  it("returns 10 when all answers are correct", () => {
    expect(calculateScore(10, 10)).toBe(10);
  });

  it("rounds to nearest 0.5", () => {
    // 7/12 * 10 = 5.833 → round(5.833*2)/2 = round(11.667)/2 = 12/2 = 6.0
    expect(calculateScore(7, 12)).toBe(6);
    // 3/12 * 10 = 2.5 → round(2.5*2)/2 = round(5)/2 = 5/2 = 2.5
    expect(calculateScore(3, 12)).toBe(2.5);
    // 5/8 * 10 = 6.25 → round(6.25*2)/2 = round(12.5)/2 = 13/2 = 6.5
    expect(calculateScore(5, 8)).toBe(6.5);
  });

  it("handles 1 correct out of many", () => {
    // 1/10 * 10 = 1.0 → round(1.0*2)/2 = 1.0
    expect(calculateScore(1, 10)).toBe(1);
  });
});

describe("scoreToBand", () => {
  it("returns null for negative scores", () => {
    expect(scoreToBand(-1)).toBeNull();
    expect(scoreToBand(-0.1)).toBeNull();
  });

  it("returns null below B1 threshold (4.0)", () => {
    expect(scoreToBand(0)).toBeNull();
    expect(scoreToBand(3.9)).toBeNull();
    expect(scoreToBand(3.99)).toBeNull();
  });

  it("maps B1 range [4.0, 6.0)", () => {
    expect(scoreToBand(4)).toBe("B1");
    expect(scoreToBand(4.5)).toBe("B1");
    expect(scoreToBand(5.5)).toBe("B1");
    expect(scoreToBand(5.9)).toBe("B1");
  });

  it("maps B2 range [6.0, 8.5)", () => {
    expect(scoreToBand(6)).toBe("B2");
    expect(scoreToBand(7)).toBe("B2");
    expect(scoreToBand(8)).toBe("B2");
    expect(scoreToBand(8.4)).toBe("B2");
  });

  it("maps C1 range [8.5, 10]", () => {
    expect(scoreToBand(8.5)).toBe("C1");
    expect(scoreToBand(9)).toBe("C1");
    expect(scoreToBand(10)).toBe("C1");
  });
});

describe("parseAnswerKey", () => {
  it("extracts correctAnswers from valid ObjectiveAnswerKey", () => {
    const key = { correctAnswers: { q1: "A", q2: "B" } };
    expect(parseAnswerKey(key)).toEqual({ q1: "A", q2: "B" });
  });

  it("returns empty object for invalid input", () => {
    expect(parseAnswerKey(null)).toEqual({});
    expect(parseAnswerKey(undefined)).toEqual({});
    expect(parseAnswerKey("string")).toEqual({});
    expect(parseAnswerKey(42)).toEqual({});
    expect(parseAnswerKey({ wrong: "shape" })).toEqual({});
  });

  it("returns empty object for empty correctAnswers", () => {
    expect(parseAnswerKey({ correctAnswers: {} })).toEqual({});
  });
});

describe("normalizeAnswer", () => {
  it("trims and lowercases", () => {
    expect(normalizeAnswer("  Hello World  ")).toBe("hello world");
  });

  it("collapses multiple spaces", () => {
    expect(normalizeAnswer("the   quick   brown")).toBe("the quick brown");
  });

  it("returns empty string for empty input", () => {
    expect(normalizeAnswer("")).toBe("");
    expect(normalizeAnswer("   ")).toBe("");
  });

  it("returns already-normalized string unchanged", () => {
    expect(normalizeAnswer("already clean")).toBe("already clean");
  });
});

describe("parseUserAnswer", () => {
  it("extracts answers from valid ObjectiveAnswer", () => {
    const answer = { answers: { q1: "A", q2: "C" } };
    expect(parseUserAnswer(answer)).toEqual({ q1: "A", q2: "C" });
  });

  it("falls back to extracting string values from plain object", () => {
    const raw = { q1: "A", q2: "B", q3: 123 };
    // q3 is not a string, should be excluded
    expect(parseUserAnswer(raw)).toEqual({ q1: "A", q2: "B" });
  });

  it("returns empty object for invalid input", () => {
    expect(parseUserAnswer(null)).toEqual({});
    expect(parseUserAnswer(undefined)).toEqual({});
    expect(parseUserAnswer("string")).toEqual({});
    expect(parseUserAnswer(42)).toEqual({});
    expect(parseUserAnswer([])).toEqual({});
  });

  it("returns empty object when plain object has no string values", () => {
    expect(parseUserAnswer({ a: 1, b: true })).toEqual({});
  });
});

describe("calculateOverallScore", () => {
  it("returns null if any skill is null", () => {
    expect(calculateOverallScore(7, 8, null, 6)).toBeNull();
    expect(calculateOverallScore(null, 8, 7, 6)).toBeNull();
    expect(calculateOverallScore(7, null, 7, 6)).toBeNull();
    expect(calculateOverallScore(7, 8, 7, null)).toBeNull();
  });

  it("returns null if all skills are null", () => {
    expect(calculateOverallScore(null, null, null, null)).toBeNull();
  });

  it("averages 4 equal scores", () => {
    expect(calculateOverallScore(7, 7, 7, 7)).toBe(7.0);
  });

  it("averages and rounds to nearest 0.5", () => {
    // (6 + 7 + 8 + 9) / 4 = 7.5
    expect(calculateOverallScore(6, 7, 8, 9)).toBe(7.5);
    // (5 + 6 + 7 + 8) / 4 = 6.5
    expect(calculateOverallScore(5, 6, 7, 8)).toBe(6.5);
  });

  it("rounds .25 down and .75 up to nearest 0.5", () => {
    // (4 + 5 + 6 + 7) / 4 = 5.5
    expect(calculateOverallScore(4, 5, 6, 7)).toBe(5.5);
    // (4.5 + 5 + 6 + 7) / 4 = 5.625 → round(11.25)/2 = 11/2 = 5.5
    expect(calculateOverallScore(4.5, 5, 6, 7)).toBe(5.5);
    // (5 + 5 + 6 + 7) / 4 = 5.75 → round(11.5)/2 = 12/2 = 6.0
    expect(calculateOverallScore(5, 5, 6, 7)).toBe(6.0);
  });

  it("handles perfect scores", () => {
    expect(calculateOverallScore(10, 10, 10, 10)).toBe(10.0);
  });

  it("handles zero scores", () => {
    expect(calculateOverallScore(0, 0, 0, 0)).toBe(0);
  });
});
