import { isNull, type SQL } from "drizzle-orm";

export function notDeleted<T extends { deletedAt: unknown }>(table: T): SQL {
  return isNull(table.deletedAt);
}

/**
 * Combined pagination helper — returns limit, offset, and a meta() builder.
 * Replaces the old paginate() + paginationMeta() pair.
 */
export function pagination(page = 1, limit = 20) {
  const safePage = Math.max(page, 1);
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  return {
    page: safePage,
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
    meta(total: number) {
      return {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      };
    },
  };
}
