import { describe, expect, it } from "bun:test";
import { computeEta, computeStats, computeTrend } from "./trends";

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

describe("computeEta", () => {
  const makeTimestamps = (count: number, intervalDays: number) => {
    const now = new Date("2026-02-15T00:00:00Z");
    return Array.from({ length: count }, (_, i) => {
      const d = new Date(
        now.getTime() - i * intervalDays * 24 * 60 * 60 * 1000,
      );
      return d.toISOString();
    });
  };

  it("returns null for fewer than 3 scores", () => {
    const ts = makeTimestamps(2, 7);
    expect(computeEta([5, 4], ts, 8.5)).toBeNull();
    expect(computeEta([], [], 6.0)).toBeNull();
  });

  it("returns null for targetScore <= 0", () => {
    const ts = makeTimestamps(3, 7);
    expect(computeEta([5, 4, 3], ts, 0)).toBeNull();
    expect(computeEta([5, 4, 3], ts, -1)).toBeNull();
  });

  it("returns 0 when avg already meets target", () => {
    const ts = makeTimestamps(3, 7);
    expect(computeEta([9, 8.5, 9], ts, 8.5)).toBe(0);
  });

  it("returns null when rate <= 0 (declining)", () => {
    // Newest first: 3, 4, 5 → rate = (3 - 5) / 2 = -1
    const ts = makeTimestamps(3, 7);
    expect(computeEta([3, 4, 5], ts, 8.0)).toBeNull();
  });

  it("returns null when rate is 0 (stable)", () => {
    const ts = makeTimestamps(3, 7);
    expect(computeEta([5, 5, 5], ts, 8.0)).toBeNull();
  });

  it("computes correct ETA for 3-5 scores (linear regression)", () => {
    // Scores newest-first: [6, 5, 4], weekly intervals
    // Chronological: times=[0, 7, 14], values=[4, 5, 6]
    // slope = 1/7 score/day, meanY=5, gap=3, etaDays=21, etaWeeks=3
    const ts = makeTimestamps(3, 7);
    expect(computeEta([6, 5, 4], ts, 8.0)).toBe(3);
  });

  it("computes correct ETA for 6+ scores (linear regression)", () => {
    // Scores newest-first: [7, 7, 7, 5, 5, 5], weekly intervals
    // Chronological: times=[0,7,14,21,28,35], values=[5,5,5,7,7,7]
    // slope ≈ 0.0735 score/day, meanY=6, gap=2.5, etaDays≈34, etaWeeks=5
    const ts = makeTimestamps(6, 7);
    expect(computeEta([7, 7, 7, 5, 5, 5], ts, 8.5)).toBe(5);
  });

  it("returns null when no valid timestamps", () => {
    expect(
      computeEta([6, 5, 4], ["invalid", "invalid", "invalid"], 8.0),
    ).toBeNull();
  });

  it("handles non-uniform timestamp intervals", () => {
    // Scores newest-first: [7, 6, 5]
    // Chronological: times=[0, 11, 14], values=[5, 6, 7]
    // slope ≈ 0.129 score/day, meanY=6, gap=2, etaDays≈15.5, etaWeeks=3
    const ts = [
      "2026-02-15T00:00:00Z",
      "2026-02-12T00:00:00Z",
      "2026-02-01T00:00:00Z",
    ];
    expect(computeEta([7, 6, 5], ts, 8.0)).toBe(3);
  });
});
