import { describe, expect, it } from "bun:test";
import { weightedWritingAvg } from "./finalize";

describe("weightedWritingAvg", () => {
  it("returns null for empty array", () => {
    expect(weightedWritingAvg([])).toBeNull();
  });

  it("task 1 only (weight=1)", () => {
    expect(weightedWritingAvg([{ score: 6.0, part: 1 }])).toBe(6.0);
  });

  it("task 2 only (weight=2)", () => {
    expect(weightedWritingAvg([{ score: 7.0, part: 2 }])).toBe(7.0);
  });

  it("both tasks: (t1 + t2×2) / 3", () => {
    // (6.0×1 + 9.0×2) / 3 = 24/3 = 8.0
    expect(
      weightedWritingAvg([
        { score: 6.0, part: 1 },
        { score: 9.0, part: 2 },
      ]),
    ).toBe(8.0);
  });

  it("rounds to nearest 0.5", () => {
    // (5.0×1 + 7.0×2) / 3 = 19/3 = 6.333 → round(6.333*2)/2 = round(12.667)/2 = 13/2 = 6.5
    expect(
      weightedWritingAvg([
        { score: 5.0, part: 1 },
        { score: 7.0, part: 2 },
      ]),
    ).toBe(6.5);
  });

  it("null part defaults to weight=1", () => {
    // (6.0×1 + 8.0×2) / 3 = 22/3 = 7.333 → 7.5
    expect(
      weightedWritingAvg([
        { score: 6.0, part: null },
        { score: 8.0, part: 2 },
      ]),
    ).toBe(7.5);
  });

  it("two task 1 submissions (both weight=1)", () => {
    // (5.0 + 7.0) / 2 = 6.0
    expect(
      weightedWritingAvg([
        { score: 5.0, part: 1 },
        { score: 7.0, part: 1 },
      ]),
    ).toBe(6.0);
  });

  it("equal scores return the same score", () => {
    expect(
      weightedWritingAvg([
        { score: 7.0, part: 1 },
        { score: 7.0, part: 2 },
      ]),
    ).toBe(7.0);
  });
});
