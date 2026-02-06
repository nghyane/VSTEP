import { isNull, type SQL } from "drizzle-orm";

/**
 * Soft-delete filter: WHERE deleted_at IS NULL
 */
export function notDeleted<T extends { deletedAt: unknown }>(table: T): SQL {
  return isNull(table.deletedAt);
}

/**
 * Calculate LIMIT/OFFSET from page-based pagination params
 */
export function paginate(page = 1, limit = 20) {
  return {
    limit: Math.min(Math.max(limit, 1), 100),
    offset: (Math.max(page, 1) - 1) * Math.min(Math.max(limit, 1), 100),
  };
}

/**
 * Build pagination metadata for response
 */
export function paginationMeta(total: number, page = 1, limit = 20) {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  return {
    page: Math.max(page, 1),
    limit: safeLimit,
    total,
    totalPages: Math.ceil(total / safeLimit),
  };
}
