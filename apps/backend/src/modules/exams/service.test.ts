import { describe, expect, it } from "bun:test";
import { calculateOverallScore, calculateScore } from "./pure";

describe("calculateScore", () => {
  it("returns 0 when there are no correct answers", () => {
    expect(calculateScore(0, 10)).toBe(0);
  });

  it("returns 10 when all answers are correct", () => {
    expect(calculateScore(10, 10)).toBe(10);
  });

  it("returns rounded partial score", () => {
    expect(calculateScore(7, 12)).toBe(6);
  });
});

describe("calculateOverallScore", () => {
  it("averages all skills and rounds to nearest 0.5", () => {
    expect(calculateOverallScore([6, 7, 8, 9])).toBe(7.5);
  });

  it("returns null when at least one skill is missing", () => {
    expect(calculateOverallScore([6, null, 8, 9])).toBeNull();
  });
});
