import { pagination } from "@db/helpers";

export function paginatedQuery(page?: number, limit?: number) {
  const pg = pagination(page, limit);

  return {
    ...pg,
    async resolve<T>(opts: { count: Promise<number>; query: Promise<T[]> }) {
      const [total, data] = await Promise.all([opts.count, opts.query]);
      return { data, meta: pg.meta(total) };
    },
  };
}
