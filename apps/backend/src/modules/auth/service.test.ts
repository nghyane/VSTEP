import { describe, expect, it } from "bun:test";
import { hashToken, parseExpiry } from "./pure";

describe("parseExpiry", () => {
  it("parses valid durations", () => {
    expect(parseExpiry("15m")).toBe(900);
    expect(parseExpiry("1h")).toBe(3600);
    expect(parseExpiry("7d")).toBe(604800);
    expect(parseExpiry("30s")).toBe(30);
  });

  it("trims surrounding whitespace", () => {
    expect(parseExpiry(" 15m ")).toBe(900);
  });

  it("throws for zero duration", () => {
    expect(() => parseExpiry("0s")).toThrow();
  });

  it("throws for invalid format", () => {
    expect(() => parseExpiry("abc")).toThrow();
  });
});

describe("hashToken", () => {
  it("is deterministic for the same input", () => {
    expect(hashToken("same-token")).toBe(hashToken("same-token"));
  });

  it("produces different hashes for different inputs", () => {
    expect(hashToken("token-a")).not.toBe(hashToken("token-b"));
  });
});
