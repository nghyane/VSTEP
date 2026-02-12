import { MAX_PAGE_SIZE } from "@common/constants";
import { type Column, isNull, type SQL } from "drizzle-orm";

export function notDeleted<T extends { deletedAt: Column }>(table: T): SQL {
  return isNull(table.deletedAt);
}

export function omitColumns<
  T extends Record<string, unknown>,
  K extends keyof T & string,
>(columns: T, keys: readonly K[]): Omit<T, K> {
  const skip = new Set<string>(keys);
  return Object.fromEntries(
    Object.entries(columns).filter(([k]) => !skip.has(k)),
  ) as Omit<T, K>;
}

export function paginated(page = 1, limit = 20) {
  const safePage = Math.max(page, 1);
  const safeLimit = Math.min(Math.max(limit, 1), MAX_PAGE_SIZE);
  const offset = (safePage - 1) * safeLimit;

  function meta(total: number) {
    return {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  return {
    page: safePage,
    limit: safeLimit,
    offset,
    meta,
    async resolve<T>(opts: { count: Promise<number>; query: Promise<T[]> }) {
      const [total, data] = await Promise.all([opts.count, opts.query]);
      return { data, meta: meta(total) };
    },
  };
}
