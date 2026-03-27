import { MAX_PAGE_SIZE } from "@common/constants";
import { NotFoundError } from "@common/errors";
import type { PgSelect } from "drizzle-orm/pg-core";

export function takeFirst<T>(rows: T[]): T | undefined {
  return rows[0];
}

export function takeFirstOrThrow<T>(rows: T[]): T {
  const first = rows[0];
  if (!first) throw new NotFoundError("Record");
  return first;
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

export async function paginate<T extends PgSelect>(
  qb: T,
  count: Promise<number>,
  opts: { page?: number; limit?: number },
) {
  const page = Math.max(opts.page ?? 1, 1);
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), MAX_PAGE_SIZE);
  const offset = (page - 1) * limit;

  const [data, total] = await Promise.all([
    qb.limit(limit).offset(offset),
    count,
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
