import { describe, expect, it } from "bun:test";
import { computeStats, computeTrend } from "./trends";

describe("computeStats", () => {
  it("returns nulls for empty array", () => {
    const result = computeStats([]);
    expect(result.avg).toBeNull();
    expect(result.deviation).toBeNull();
  });

  it("returns avg with null deviation for single score", () => {
    const result = computeStats([5]);
    expect(result.avg).toBe(5);
    expect(result.deviation).toBeNull();
  });

  it("returns zero deviation for identical scores", () => {
    const result = computeStats([6, 6]);
    expect(result.avg).toBe(6);
    expect(result.deviation).toBe(0);
  });

  it("computes correct sample standard deviation", () => {
    // [8, 4, 7, 5]: mean=6, variance=(4+4+1+1)/3=10/3, deviation=sqrt(10/3)
    const result = computeStats([8, 4, 7, 5]);
    expect(result.avg).toBe(6);
    expect(result.deviation).toBeCloseTo(1.8257, 3);
  });

  it("computes stats for uniform spread", () => {
    // [6.4, 6.5, 6.6, 6.4, 6.5, 6.6]: mean=6.5
    const result = computeStats([6.4, 6.5, 6.6, 6.4, 6.5, 6.6]);
    expect(result.avg).toBe(6.5);
    expect(result.deviation).toBeCloseTo(0.0894, 3);
  });
});

describe("computeTrend", () => {
  it("returns insufficient_data when fewer than 3 scores", () => {
    expect(computeTrend([6, 6], null)).toBe("insufficient_data");
    expect(computeTrend([], null)).toBe("insufficient_data");
    expect(computeTrend([5], null)).toBe("insufficient_data");
  });

  it("returns stable for 3-5 scores with low deviation", () => {
    const { deviation } = computeStats([6, 6, 6]);
    expect(computeTrend([6, 6, 6], deviation)).toBe("stable");
  });

  it("returns inconsistent for 3-5 scores with high deviation", () => {
    const scores = [9, 3, 8];
    const { deviation } = computeStats(scores);
    expect(deviation).not.toBeNull();
    // deviation ≈ 3.21 which is >= 1.5 threshold
    expect(computeTrend(scores, deviation)).toBe("inconsistent");
  });

  it("detects improving trend with 6+ scores", () => {
    // recent (index 0-2) avg=7, prev (index 3-5) avg=6, delta=+1
    const scores = [7, 7, 7, 6, 6, 6];
    const { deviation } = computeStats(scores);
    expect(computeTrend(scores, deviation)).toBe("improving");
  });

  it("detects declining trend with 6+ scores", () => {
    // recent (index 0-2) avg=6, prev (index 3-5) avg=7, delta=-1
    const scores = [6, 6, 6, 7, 7, 7];
    const { deviation } = computeStats(scores);
    expect(computeTrend(scores, deviation)).toBe("declining");
  });

  it("detects stable trend with 6+ scores and low delta", () => {
    const scores = [6.4, 6.5, 6.6, 6.4, 6.5, 6.6];
    const { deviation } = computeStats(scores);
    expect(computeTrend(scores, deviation)).toBe("stable");
  });

  it("detects inconsistent before checking delta", () => {
    // High deviation should short-circuit to inconsistent, even if delta exists
    const scores = [10, 2, 9, 3, 8, 4];
    const { deviation } = computeStats(scores);
    // deviation ≈ 3.39 which is >= 1.5 threshold
    expect(computeTrend(scores, deviation)).toBe("inconsistent");
  });

  it("falls back to basic analysis when deviation is null with 6+ scores", () => {
    // fullAnalysis requires deviation !== null, so falls through to basicAnalysis (length >= 3).
    // With null deviation, basicAnalysis returns "stable".
    expect(computeTrend([6, 6, 6, 6, 6, 6], null)).toBe("stable");
  });
});
