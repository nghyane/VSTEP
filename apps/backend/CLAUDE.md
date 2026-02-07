---
description: VSTEP Backend — Bun + Elysia + Drizzle + PostgreSQL conventions.
globs: "*.ts, *.tsx, *.js, *.jsx, package.json, biome.json, tsconfig.json, drizzle.config.ts"
alwaysApply: false
---

# VSTEP Backend

**Stack:** Bun 1.3+ runtime, Elysia 1.4+ framework, Drizzle ORM 0.45+, PostgreSQL, TypeBox validation, Biome linting.

## Use Bun — Not Node

- `bun run dev` / `bun test` / `bun install` — never npm/yarn/pnpm/jest/vitest
- `Bun.password.hash()` / `.verify()` for passwords — never bcrypt/argon2 packages
- `jose` for JWT — never jsonwebtoken
- Bun auto-loads `.env` — never use dotenv
- `Bun.sql` powers Drizzle — never use pg/postgres.js directly

## Commands

```bash
bun run dev              # Hot-reload dev server
bun run check            # Biome lint check
bun run check --write    # Auto-fix lint issues
bun run format           # Format code
bun test                 # Run tests

bun run db:push          # Push schema to DB (dev)
bun run db:generate      # Generate migrations
bun run db:migrate       # Run migrations
bun run db:studio        # Drizzle Studio GUI
```

## Import Aliases

```typescript
import { logger } from "@common/logger";
import { env } from "@common/env";
import { db } from "@db/index";
import { users } from "@db/schema/users";
import { authPlugin } from "@plugins/auth";
import { auth } from "@/modules/auth";

// Within same module — relative imports are fine
import { helper } from "./utils/helper";
```

| Alias | Maps to |
|-------|---------|
| `@/*` | `./src/*` |
| `@db/*` | `./src/db/*` |
| `@common/*` | `./src/common/*` |
| `@plugins/*` | `./src/plugins/*` |

## File Locations

| Type | Path | Pattern |
|------|------|---------|
| Module routes | `src/modules/{name}/index.ts` | Elysia routes + auth guards |
| Module schemas | `src/modules/{name}/model.ts` | TypeBox schemas in namespace |
| Module logic | `src/modules/{name}/service.ts` | Static methods on a class |
| DB schema | `src/db/schema/{name}.ts` | Drizzle pgTable definitions |
| DB relations | `src/db/relations.ts` | Drizzle relational queries setup |
| DB helpers | `src/db/helpers.ts` | `pagination()`, `notDeleted()` |
| Plugins | `src/plugins/{name}.ts` | Elysia plugins (auth, error) |
| Shared utils | `src/common/{name}.ts` | Logger, env, schemas, utils |
| Tests | `src/**/*.test.ts` or `src/**/__tests__/` | bun:test |

## Existing Utilities (Use, Don't Recreate)

| Utility | Import | Purpose |
|---------|--------|---------|
| `logger` | `@common/logger` | Structured logging — never `console.log` |
| `env` | `@common/env` | Type-safe env vars (`@t3-oss/env-core` + Zod) |
| `db` | `@db/index` | Drizzle PostgreSQL client |
| `authPlugin` | `@plugins/auth` | JWT bearer auth + role macros |
| `errorPlugin` | `@/plugins/error` | Error handling + request ID tracing |
| `pagination()` | `@db/helpers` | Pagination offset/limit + meta builder |
| `notDeleted()` | `@db/helpers` | Soft-delete WHERE filter |
| `now()` | `@common/utils` | Current timestamp |
| `assertExists()` | `@common/utils` | Throws NotFoundError if null |
| `assertAccess()` | `@common/utils` | Throws ForbiddenError on ownership mismatch |
| `escapeLike()` | `@common/utils` | Escape SQL LIKE wildcards |
| Shared enums | `@common/enums` | Skill, Role, Band, etc. (from pgEnums) |
| Shared schemas | `@common/schemas` | Pagination params, error responses |

## Patterns

### Module Route

```typescript
import { Elysia } from "elysia";
import { authPlugin } from "@plugins/auth";
import { FeatureService } from "./service";
import { Feature } from "./model";

export const feature = new Elysia({ prefix: "/feature" })
  .use(authPlugin())
  .get("/", ({ query }) => FeatureService.list(query), {
    auth: true,
    query: Feature.ListQuery,
    response: { 200: Feature.ListResponse },
    detail: { tags: ["Feature"], summary: "List features" },
  });
```

### Service Class

```typescript
import { db } from "@db/index";
import { features } from "@db/schema/features";
import { eq } from "drizzle-orm";

export class FeatureService {
  static async list(query: { page?: number; limit?: number }) {
    // business logic with Drizzle queries
  }

  static async getById(id: string) {
    const result = await db.query.features.findFirst({
      where: eq(features.id, id),
    });
    return assertExists(result, "Feature");
  }
}
```

### Model Schema (TypeBox namespace)

```typescript
import { t } from "elysia";

export namespace Feature {
  export const ListQuery = t.Object({
    page: t.Optional(t.Number({ minimum: 1 })),
    limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
  });

  export const ListResponse = t.Object({
    data: t.Array(t.Object({ id: t.String(), name: t.String() })),
    meta: t.Object({ page: t.Number(), limit: t.Number(), total: t.Number() }),
  });
}
```

### DB Schema

```typescript
import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

export const features = pgTable("features", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  deletedAt: timestamp("deleted_at"),
});

export type Feature = typeof features.$inferSelect;
export type NewFeature = typeof features.$inferInsert;
```

### Auth Guards

```typescript
// Require authenticated user
.get("/", handler, { auth: true })

// Require specific role (hierarchy: learner < instructor < admin)
.post("/", handler, { role: "instructor" })
.delete("/:id", handler, { role: "admin" })
```

### Logging

```typescript
import { logger } from "@common/logger";

logger.info("Event description", { key: "value" });
logger.error("Something failed", { error: err.message });
// Never use console.log — Biome warns on it
```

## Golden Rules

1. **No `.js` in imports** — TypeScript only, no extensions
2. **No barrel re-exports** — No `export * from` in schema files
3. **No banned packages** — No bcrypt, jsonwebtoken, ioredis, dotenv, pg, jest
4. **Cross-module = aliases** — Always use `@common/`, `@db/`, `@plugins/`, `@/`
5. **Soft deletes** — Use `deletedAt` + `notDeleted()` filter, never hard delete
6. **Static service methods** — Services are classes with only static methods
7. **TypeBox for API validation** — Not Zod (Zod is only for env config)
8. **OpenAPI detail on every route** — Include `tags` and `summary`

## Naming Conventions (Biome-enforced)

- Types, interfaces, classes, enums: `PascalCase`
- Enum members: `PascalCase` or `CONSTANT_CASE`
- Functions, variables: `camelCase`
- Constants: `camelCase` or `CONSTANT_CASE`
- Object properties: `camelCase` or `CONSTANT_CASE`

## Verification

Before completing any task:

- [ ] `bun run check` passes
- [ ] `bun test` passes
- [ ] No `console.log` (use `logger`)
- [ ] Cross-module imports use aliases
- [ ] No `.js` extensions in imports
- [ ] No unused imports or variables
- [ ] Routes have OpenAPI `detail` with tags and summary
- [ ] New DB tables include `createdAt`, `updatedAt`, and `deletedAt`
