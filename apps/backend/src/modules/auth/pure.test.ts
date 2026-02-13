import { describe, expect, it } from "bun:test";
import { hashToken, parseExpiry } from "./pure";

describe("parseExpiry", () => {
  it("parses seconds", () => {
    expect(parseExpiry("30s")).toBe(30);
    expect(parseExpiry("1s")).toBe(1);
  });

  it("parses minutes", () => {
    expect(parseExpiry("15m")).toBe(900);
    expect(parseExpiry("1m")).toBe(60);
  });

  it("parses hours", () => {
    expect(parseExpiry("1h")).toBe(3600);
    expect(parseExpiry("24h")).toBe(86400);
  });

  it("parses days", () => {
    expect(parseExpiry("7d")).toBe(604800);
    expect(parseExpiry("1d")).toBe(86400);
  });

  it("trims surrounding whitespace", () => {
    expect(parseExpiry(" 15m ")).toBe(900);
    expect(parseExpiry("\t1h\n")).toBe(3600);
  });

  it("is case-insensitive", () => {
    expect(parseExpiry("15M")).toBe(900);
    expect(parseExpiry("1H")).toBe(3600);
  });

  it("throws for zero duration", () => {
    expect(() => parseExpiry("0s")).toThrow("must be > 0");
    expect(() => parseExpiry("0m")).toThrow("must be > 0");
  });

  it("throws for invalid format", () => {
    expect(() => parseExpiry("abc")).toThrow("Invalid expiry format");
    expect(() => parseExpiry("")).toThrow("Invalid expiry format");
    expect(() => parseExpiry("10")).toThrow("Invalid expiry format");
    expect(() => parseExpiry("m")).toThrow("Invalid expiry format");
  });

  it("throws for negative numbers", () => {
    expect(() => parseExpiry("-5m")).toThrow("Invalid expiry format");
  });

  it("throws for float values", () => {
    expect(() => parseExpiry("1.5h")).toThrow("Invalid expiry format");
  });
});

describe("hashToken", () => {
  it("is deterministic for the same input", () => {
    expect(hashToken("same-token")).toBe(hashToken("same-token"));
  });

  it("produces different hashes for different inputs", () => {
    expect(hashToken("token-a")).not.toBe(hashToken("token-b"));
  });

  it("returns a 64-character hex string (SHA-256)", () => {
    const hash = hashToken("test-token");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces different hash for empty string vs whitespace", () => {
    expect(hashToken("")).not.toBe(hashToken(" "));
  });
});
