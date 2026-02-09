import { describe, expect, it } from "bun:test";
import { scoreToBand } from "./pure";

describe("scoreToBand", () => {
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
