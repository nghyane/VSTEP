# VSTEP Backend Guidelines

**Stack**: Bun 1.3+ + Elysia + Drizzle + PostgreSQL

---

## 1. Philosophy

Code explains what. Comments explain why. Every rule exists to reduce cognitive load.

---

## 2. Golden Rules

1. **Never use `.js` extension in imports** — Bun convention
2. **Never use barrel files** — Import directly from `@db/schema/users`
3. **Never use bcrypt/jsonwebtoken/ioredis/dotenv/jest** — Use Bun natives
4. **Always use `@t3-oss/env-core`** — Type-safe environment variables
5. **Always import via alias** — `@db/schema/*`, `@common/*` over relative paths

---

## 3. Patterns

### Auth

```typescript
import { authPlugin } from "./plugins/auth";

const app = new Elysia()
  .use(authPlugin())
  .post("/login", async ({ jwt, setAuthCookie, body }) => {
    const token = await jwt.sign({ sub: user.id, role: user.role });
    setAuthCookie(token);
    return { token };
  })
  .get("/profile", ({ user }) => user, { auth: true });
```

### Password Hashing

```typescript
const hash = await Bun.password.hash(password, {
  algorithm: "argon2id",
  memoryCost: 65536,
  timeCost: 3,
});
const isValid = await Bun.password.verify(password, hash);
```

### Environment

```typescript
import { createEnv } from "@t3-oss/env-core";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(32),
  },
  runtimeEnv: process.env,
});
```

### Schema (No Barrels)

```typescript
// File: src/db/schema/users.ts
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_unique")
      .on(table.email)
      .where(sql`${table.deletedAt} IS NULL`),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

### Comments

```typescript
// ❌ Don't: states the obvious
// Increment counter
counter++;

// ✅ Do: explain reasoning
// Exponential backoff for rate-limited APIs
const delay = Math.pow(2, attempt) * 1000;
```

---

## 4. Commands

```bash
# Dev
bun run dev          # Hot reload
bun run check        # Biome lint
bun run format       # Biome format

# DB
bun run db:push      # Schema to DB (dev)
bun run db:studio    # GUI
bun run db:generate  # Migrations

# Test
bun test             # Run tests

# Packages
bun add <pkg>
bun add -D <pkg>
bun remove <pkg>
```

---

## Stack Reference

| Feature | Use | Don't Use |
|---------|-----|-----------|
| Runtime | Bun 1.3+ | Node.js |
| Auth | `@elysiajs/jwt` + `Bun.password` | bcrypt, jsonwebtoken |
| Env | `@t3-oss/env-core` | dotenv |
| Test | `bun:test` | jest, vitest |
| Lint | Biome | ESLint, Prettier |
| DB | postgres (driver) | pg, mysql2 |
| Cache | `Bun.redis` | ioredis |
