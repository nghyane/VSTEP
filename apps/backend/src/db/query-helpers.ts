import { assertExists, now } from "@common/utils";
import { pagination } from "./helpers";

type Transaction = import("./index").DbTransaction;

/**
 * Run a paginated list query with count in parallel.
 * Returns { data, meta } matching the standard API response shape.
 */
export async function paginatedList<TData>({
  page = 1,
  limit = 20,
  getCount,
  getData,
}: {
  page?: number;
  limit?: number;
  getCount: () => Promise<number>;
  getData: (pg: { limit: number; offset: number }) => Promise<TData[]>;
}) {
  const pg = pagination(page, limit);

  const [total, data] = await Promise.all([
    getCount(),
    getData({ limit: pg.limit, offset: pg.offset }),
  ]);

  return {
    data,
    meta: pg.meta(total),
  };
}

/**
 * Shared soft-delete flow with existence check.
 */
export async function softDelete<
  TDeleted extends { id: string; deletedAt: string | null },
>(
  tx: Transaction,
  options: {
    entityName: string;
    findExisting: (tx: Transaction) => Promise<unknown>;
    runDelete: (
      tx: Transaction,
      timestamp: string,
    ) => Promise<TDeleted | undefined>;
  },
) {
  assertExists(await options.findExisting(tx), options.entityName);

  const timestamp = now();
  const deleted = assertExists(
    await options.runDelete(tx, timestamp),
    options.entityName,
  );

  return {
    id: deleted.id,
    deletedAt: deleted.deletedAt ?? timestamp,
  };
}
