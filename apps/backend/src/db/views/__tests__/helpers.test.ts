import { describe, expect, it } from "bun:test";
import { omitColumns, toQueryColumns } from "../helpers";

describe("toQueryColumns", () => {
  it("converts column map to { key: true } format", () => {
    const result = toQueryColumns({ id: "col_id", name: "col_name" });
    expect(result).toEqual({ id: true, name: true });
  });

  it("returns empty object for empty input", () => {
    expect(toQueryColumns({})).toEqual({});
  });

  it("preserves all keys from input", () => {
    const input = { a: 1, b: 2, c: 3, d: 4 };
    const result = toQueryColumns(input);
    expect(Object.keys(result).sort()).toEqual(["a", "b", "c", "d"]);
  });

  it("sets all values to true", () => {
    const result = toQueryColumns({ x: "anything", y: 123, z: null });
    for (const v of Object.values(result)) {
      expect(v).toBe(true);
    }
  });
});

describe("omitColumns", () => {
  it("removes specified keys", () => {
    const cols = { id: 1, name: 2, secret: 3 };
    expect(omitColumns(cols, ["secret"])).toEqual({ id: 1, name: 2 });
  });

  it("handles empty keys array", () => {
    const cols = { a: 1, b: 2 };
    expect(omitColumns(cols, [])).toEqual({ a: 1, b: 2 });
  });

  it("does not mutate original", () => {
    const cols = { id: 1, name: 2, secret: 3 };
    omitColumns(cols, ["secret"]);
    expect(cols).toEqual({ id: 1, name: 2, secret: 3 });
  });

  it("removes multiple keys", () => {
    const cols = { a: 1, b: 2, c: 3, d: 4 };
    expect(omitColumns(cols, ["b", "d"])).toEqual({ a: 1, c: 3 });
  });

  it("handles non-existent keys gracefully", () => {
    const cols = { a: 1, b: 2 };
    expect(omitColumns(cols, ["nonexistent" as any])).toEqual({ a: 1, b: 2 });
  });

  it("returns empty object when all keys omitted", () => {
    const cols = { a: 1, b: 2 };
    expect(omitColumns(cols, ["a", "b"])).toEqual({});
  });
});
