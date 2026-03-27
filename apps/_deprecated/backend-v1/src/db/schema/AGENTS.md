# DB Schema

One file per domain. Each file defines its tables, enums, and inferred types.

## Conventions

- All main tables use `...timestamps` (createdAt, updatedAt).
- Shared column set (`timestamps`) lives in `columns.ts` — no tables there.
- Hard delete with `onDelete: "cascade"` on FK references — no soft-delete.
- Enums used by a single domain go in that domain's file. Enums shared across domains go in `enums.ts`.
- JSONB type definitions live in `../types/`, not here.
- `index.ts` is the barrel re-export — all tables exported as `table`. Never import directly from domain files outside `db/`.

## Adding a Table

1. Create or open the domain file in `schema/`
2. Re-export from `index.ts`
3. Add relations in `../relations.ts`
4. Run `bun run db:generate` then `bun run db:migrate`

## Gotchas

- `relations.ts` is a single file for all relations — Drizzle requires one import point for relation inference.
- Type exports: use `typeof table.$inferSelect` and `typeof table.$inferInsert` in the same schema file.
