# VSTEP Backend Agent Guidelines

## Project Context
- **Framework**: Bun + Elysia + Drizzle ORM + PostgreSQL
- **Language**: TypeScript
- **Architecture**: Modular API with domain-driven design

---

## Code Commenting Best Practices

### Core Principle
> **Code explains WHAT, Comments explain WHY**

### When to Comment

| ✅ DO Comment | ❌ DON'T Comment |
|--------------|-----------------|
| Business logic phức tạp | Code tự giải thích (increment counter) |
| Workaround/Hack | Obvious operations |
| Quyết định không rõ ràng | What the code is doing |
| Performance optimization | Variable declarations |
| Security considerations | Simple loops |
| API documentation (JSDoc) | Return statements |

### Comment Style Guide

```typescript
// ❌ BAD - states the obvious
// Increment the counter
let counter = 0;
counter++;

// ✅ GOOD - explains why
// Retry with exponential backoff to handle rate-limited APIs
const delay = Math.pow(2, attempt) * 1000;

// ❌ BAD - what instead of why
// Check if user exists
if (await userExists(id)) { ... }

// ✅ GOOD - explains business rule
// Only pending submissions can be cancelled by users
if (submission.status === "pending") { ... }
```

### JSDoc for Public APIs

```typescript
/**
 * Submit writing/speaking answer for grading
 * @param userId - Authenticated user ID
 * @param questionId - Question from question bank
 * @param answer - Answer content (text or audio URL)
 * @returns Submission ID for tracking
 * @throws {ValidationError} If answer format is invalid
 */
export async function createSubmission(
  userId: string,
  questionId: string,
  answer: AnswerContent
): Promise<string> { ... }
```

### TODO/FIXME Format

```typescript
// TODO(username): Brief description with context
// See: https://github.com/org/repo/issues/123

// FIXME(username): Known issue with workaround
// Remove when dependency v2.0 is released
```

---

## Import Conventions

### Bun Project - No .js Extension

```typescript
// ✅ CORRECT
import { users } from "./schema/users";
import { config } from "../common/env";

// ❌ INCORRECT
import { users } from "./schema/users.js";
import { config } from "../common/env.js";
```

### Schema Imports Pattern

```typescript
// For database client initialization
import { schema } from "./schema/all";

// For queries (direct import)
import { users } from "./schema/users";
import { submissions } from "./schema/submissions";

// For types (barrel file)
import type { User, Submission } from "./schema";
```

---

## Database Schema Conventions

### File Organization

```
src/db/schema/
├── all.ts          # All tables for drizzle()
├── index.ts        # Types only exports
├── users.ts        # Domain-specific schemas
├── submissions.ts
├── questions.ts
├── outbox.ts
├── progress.ts
└── mock-tests.ts
```

### Schema Definition Style

```typescript
// Minimal comments - self-documenting names
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull(),
    // Only comment non-obvious fields
    deletedAt: timestamp("deleted_at"), // Soft delete for GDPR compliance
  },
  (table) => ({
    // Index names follow pattern: table_column_idx
    emailIdx: uniqueIndex("users_email_unique")
      .on(table.email)
      .where(sql`${table.deletedAt} IS NULL`),
  }),
);
```

---

## API Development Guidelines

### Route Handler Structure

```typescript
// Group related endpoints
export const authModule = new Elysia({ prefix: "/auth" })
  .post("/register", handleRegister, {
    detail: { tags: ["Auth"], summary: "Register new user" }
  })
  .post("/login", handleLogin, {
    detail: { tags: ["Auth"], summary: "User login" }
  });
```

### Error Handling

```typescript
// Use consistent error format
throw new Error("User not found", { cause: { code: "USER_NOT_FOUND", status: 404 } });
```

---

## Drizzle Kit Commands

```bash
# Development (with tsx for Bun compatibility)
bun run db:push      # Push schema changes
bun run db:studio    # Drizzle Studio GUI
bun run db:generate  # Generate migrations

# Note: drizzle-kit runs in Node.js context, use tsx wrapper
```

---

## Testing Approach

```bash
# Run tests
bun test

# Watch mode
bun test --watch
```

---

## Key Decisions

1. **Database**: PostgreSQL with Drizzle ORM
2. **Migrations**: `drizzle-kit push` for development (schema changes frequently)
3. **Comments**: Minimal, focus on WHY not WHAT
4. **Imports**: No .js extension (Bun convention)
5. **Schema**: Separate all.ts (tables) and index.ts (types)
