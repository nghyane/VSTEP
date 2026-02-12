import { describe, expect, it } from "bun:test";
import { calculateOverallScore, calculateScore, scoreToBand } from "./scoring";

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

  it("returns rounded partial score", () => {
    expect(calculateScore(7, 12)).toBe(6);
  });
});

describe("calculateOverallScore", () => {
  it("returns null for empty array", () => {
    expect(calculateOverallScore([])).toBeNull();
  });

  it("averages all skills and rounds to nearest 0.5", () => {
    expect(calculateOverallScore([6, 7, 8, 9])).toBe(7.5);
  });

  it("returns null when at least one skill is missing", () => {
    expect(calculateOverallScore([6, null, 8, 9])).toBeNull();
  });
});

describe("scoreToBand", () => {
  it("returns null for negative scores", () => {
    expect(scoreToBand(-1)).toBeNull();
  });

  it("returns null below B1 threshold", () => {
    expect(scoreToBand(3.9)).toBeNull();
  });

  it("maps B1 boundaries correctly", () => {
    expect(scoreToBand(4)).toBe("B1");
    expect(scoreToBand(5.5)).toBe("B1");
  });

  it("maps B2 boundaries correctly", () => {
    expect(scoreToBand(6)).toBe("B2");
    expect(scoreToBand(8)).toBe("B2");
  });

  it("maps C1 boundaries correctly", () => {
    expect(scoreToBand(8.5)).toBe("C1");
    expect(scoreToBand(10)).toBe("C1");
  });
});
