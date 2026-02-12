import { describe, expect, it } from "bun:test";
import { paginatedQuery } from "../helpers";

describe("paginatedQuery", () => {
  it("returns limit and offset from page/limit", () => {
    const pg = paginatedQuery(2, 10);
    expect(pg.limit).toBe(10);
    expect(pg.offset).toBe(10);
  });

  it("defaults to page 1 limit 20", () => {
    const pg = paginatedQuery();
    expect(pg.limit).toBe(20);
    expect(pg.offset).toBe(0);
  });

  it("clamps negative page to 1", () => {
    const pg = paginatedQuery(-1, 10);
    expect(pg.offset).toBe(0);
  });

  it("clamps zero page to 1", () => {
    const pg = paginatedQuery(0, 10);
    expect(pg.offset).toBe(0);
  });

  it("calculates correct offset for various pages", () => {
    expect(paginatedQuery(1, 20).offset).toBe(0);
    expect(paginatedQuery(2, 20).offset).toBe(20);
    expect(paginatedQuery(3, 20).offset).toBe(40);
    expect(paginatedQuery(5, 10).offset).toBe(40);
  });

  it("resolves data and meta in parallel", async () => {
    const pg = paginatedQuery(1, 5);
    const result = await pg.resolve({
      count: Promise.resolve(42),
      query: Promise.resolve([{ id: 1 }, { id: 2 }]),
    });
    expect(result.data).toEqual([{ id: 1 }, { id: 2 }]);
    expect(result.meta).toEqual({
      page: 1,
      limit: 5,
      total: 42,
      totalPages: 9,
    });
  });

  it("calculates totalPages correctly", async () => {
    const pg = paginatedQuery(1, 10);
    const result = await pg.resolve({
      count: Promise.resolve(25),
      query: Promise.resolve([]),
    });
    expect(result.meta.totalPages).toBe(3);
  });

  it("handles zero total count", async () => {
    const pg = paginatedQuery(1, 20);
    const result = await pg.resolve({
      count: Promise.resolve(0),
      query: Promise.resolve([]),
    });
    expect(result.meta).toEqual({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });
  });

  it("handles exact page boundary", async () => {
    const pg = paginatedQuery(2, 10);
    const result = await pg.resolve({
      count: Promise.resolve(20),
      query: Promise.resolve([]),
    });
    expect(result.meta).toEqual({
      page: 2,
      limit: 10,
      total: 20,
      totalPages: 2,
    });
  });

  it("exposes page and limit properties", () => {
    const pg = paginatedQuery(3, 15);
    expect(pg.page).toBe(3);
    expect(pg.limit).toBe(15);
  });

  it("has meta function for building metadata", () => {
    const pg = paginatedQuery(2, 10);
    const meta = pg.meta(50);
    expect(meta).toEqual({
      page: 2,
      limit: 10,
      total: 50,
      totalPages: 5,
    });
  });

  it("resolves with empty data array", async () => {
    const pg = paginatedQuery(1, 20);
    const result = await pg.resolve({
      count: Promise.resolve(100),
      query: Promise.resolve([]),
    });
    expect(result.data).toEqual([]);
    expect(result.meta.total).toBe(100);
  });

  it("resolves with multiple items", async () => {
    const pg = paginatedQuery(1, 3);
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const result = await pg.resolve({
      count: Promise.resolve(10),
      query: Promise.resolve(items),
    });
    expect(result.data).toEqual(items);
    expect(result.data.length).toBe(3);
  });
});
