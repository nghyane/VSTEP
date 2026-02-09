import { describe, expect, it } from "bun:test";
import { computeTrend } from "./pure";

describe("computeTrend", () => {
  it("returns insufficient_data when fewer than 3 scores", () => {
    expect(computeTrend([6, 6], null)).toBe("insufficient_data");
  });

  it("detects improving trend", () => {
    expect(computeTrend([7, 7, 7, 6, 6, 6], 0.5)).toBe("improving");
  });

  it("detects declining trend", () => {
    expect(computeTrend([6, 6, 6, 7, 7, 7], 0.5)).toBe("declining");
  });

  it("detects stable trend", () => {
    expect(computeTrend([6.4, 6.5, 6.6, 6.4, 6.5, 6.6], 0.2)).toBe("stable");
  });

  it("detects inconsistent trend", () => {
    expect(computeTrend([8, 4, 7, 5], 1.6)).toBe("inconsistent");
  });
});
