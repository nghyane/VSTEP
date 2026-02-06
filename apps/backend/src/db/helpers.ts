import { isNull, type SQL } from "drizzle-orm";

export function notDeleted<T extends { deletedAt: unknown }>(table: T): SQL {
  return isNull(table.deletedAt);
}

export function paginate(page = 1, limit = 20) {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  return {
    limit: safeLimit,
    offset: (Math.max(page, 1) - 1) * safeLimit,
  };
}

export function paginationMeta(total: number, page = 1, limit = 20) {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  return {
    page: Math.max(page, 1),
    limit: safeLimit,
    total,
    totalPages: Math.ceil(total / safeLimit),
  };
}
