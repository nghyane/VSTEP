# VSTEP Backend

**Stack:** Bun 1.3+ + Elysia + Drizzle + PostgreSQL

---

## Quick Ref

```typescript
// Import patterns
import { logger } from "@common/logger";
import { env } from "@common/env";
import { db } from "@db/index";
import { users } from "@db/schema/users";
import { authPlugin } from "@plugins/auth";

// Within same module
import { helper } from "./utils/helper";
```

---

## Golden Rules

| # | Rule | Check |
|---|------|-------|
| 1 | No `.js` in imports | `grep -r "\.js['\"]" src/` |
| 2 | No barrel files | No `export * from` in schema/ |
| 3 | No banned packages | `grep -r "bcrypt\|jsonwebtoken\|ioredis\|dotenv\|jest\|console.log" src/` |
| 4 | Use `@t3-oss/env-core` | `src/common/env.ts` exists |
| 5 | Cross-module = aliases | `grep -r "\.\./.*common\|db\|plugins" src/` |

---

## File Locations

| Type | Path |
|------|------|
| Schema | `src/db/schema/{name}.ts` |
| Plugins | `src/plugins/{name}.ts` |
| Common | `src/common/{name}.ts` |
| Routes | `src/routes/{name}.ts` or inline in `src/index.ts` |
| Tests | `src/**/*.test.ts` |

---

## What Exists (Use, Don't Re-create)

| Module | Import | Purpose |
|--------|--------|---------|
| Logger | `import { logger } from "@common/logger"` | Structured logging. Never `console.log` |
| Env | `import { env } from "@common/env"` | Type-safe env vars via `@t3-oss/env-core` |
| DB | `import { db } from "@db/index"` | Drizzle client |
| Auth | `import { authPlugin } from "@plugins/auth"` | JWT + cookie auth plugin |
| Password | `Bun.password.hash/verify` | Native Bun password hashing |

---

## Aliases

| Alias | Maps to |
|-------|---------|
| `@/*` | `./src/*` |
| `@db/*` | `./src/db/*` |
| `@common/*` | `./src/common/*` |
| `@plugins/*` | `./src/plugins/*` |

---

## Patterns

**Logging:**
```typescript
logger.info("Event", { meta: "value" });
logger.error("Failed", { error: err.message });
```

**Schema:**
```typescript
export const users = pgTable("users", { ... });
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

**Auth:**
```typescript
const app = new Elysia()
  .use(authPlugin())
  .get("/", ({ user }) => user, { auth: true });
```

**Comments:**
```typescript
// ❌ Don't: states obvious
counter++;

// ✅ Do: explain why
// Exponential backoff: 1s, 2s, 4s...
const delay = Math.pow(2, attempt) * 1000;
```

---

## Commands

```bash
bun run dev              # Hot reload
bun run check            # Biome lint
bun run check --write    # Auto-fix
bun run format           # Format

bun run db:push          # Dev: schema → DB
bun run db:generate      # Create migrations
bun run db:migrate       # Run migrations

bun test                 # Run tests
```

---

## Verification

Before completing task:
- [ ] `bun run check` passes
- [ ] No `console.log` (use `logger`)
- [ ] Cross-module imports use aliases (`@common`, `@db`, `@plugins`)
- [ ] No `.js` extensions
