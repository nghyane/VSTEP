# Code Style — VSTEP

Áp dụng cho TypeScript (backend/frontend) và Python (grading).

## 5 Luật

1. **Early Exit** — Guard clause đầu hàm. Happy path phẳng, không nested.
2. **Parse, Don't Validate** — Untrusted input → typed model tại boundary. Sau đó không check lại.
3. **Atomic Predictability** — Cùng input → cùng output. Không mutate input, không hidden side-effect.
4. **Fail Fast, Fail Loud** — Throw khi invalid. Không nuốt lỗi, không silent fallback.
5. **Intentional Naming** — Đọc như tiếng Anh. Hàm = hành động, biến = danh từ, type = khái niệm.

## Naming

### Module = namespace, tên không lặp

```python
# app/writing.py
def grade(task): ...        # writing.grade(task)
def prompt(text): ...       # writing.prompt(text)

# app/scoring.py
def to_band(score): ...     # scoring.to_band(8.5)
def snap(score): ...        # scoring.snap(7.3) — snap to 0.5 grid

# app/db.py
def save(task, result): ... # db.save(task, result)
def fail(id): ...           # db.fail(submission_id)
```

Import qualified khi cần context:

```python
from app import writing, scoring, db
result = await writing.grade(task)
band = scoring.to_band(result.score)
await db.save(task, result)
```

### Bỏ noise words

| Noise | Clean | Lý do |
|-------|-------|-------|
| ~~build~~Prompt | `prompt()` | compose, không "build" |
| ~~save~~Result | `save(result)` | parameter nói rồi |
| ~~AI~~GradeResult | `Result` | AI là implementation detail |
| ~~get~~User | `find(id)` | get là mặc định |
| ~~handle~~Error | throw luôn | handle = nói mà không nói gì |
| ~~process~~Task | `grade(task)` | domain verb |

### Types — domain noun, không prefix

```python
class Task: ...          # not GradingTask
class Result: ...        # not AIGradeResult  
class WritingScore: ...  # qualifier chỉ khi cần phân biệt
class SpeakingScore: ...
```

### Convention

| Ngữ cảnh | Style | Ví dụ |
|-----------|-------|-------|
| Functions | verb (module cung cấp noun) | `grade()`, `save()`, `prompt()` |
| Variables | noun | `score`, `transcript`, `user` |
| Types | PascalCase domain noun | `Task`, `Result`, `Session` |
| Files (TS) | kebab-case | `grading-dispatch.ts` |
| Files (Python) | snake_case | `grading.py` |

**Cấm:** prefix (~~raw_~~, ~~final_~~, ~~temp_~~), context repetition (~~result.resultScore~~), generic names (~~data~~, ~~info~~, ~~item~~, ~~process~~).

## Comments

WHY only. Cần section dividers → tách file.

```
// round to 0.5 to match VSTEP band thresholds     WHY
// Get user by ID                                   WHAT — cấm
// Step 1: Validate                                 numbered step — cấm
// ═══════════════                                  divider — cấm
```

## Function

guard → compute → write. Không xen kẽ. Không two-phase writes.

```typescript
async function submitExam(sessionId: string, actor: Actor) {
  // guard
  const session = assertExists(await getSession(sessionId), "Session");
  assertAccess(session.userId, actor, "Not your session");

  // compute
  const scores = calculateScores(session.answers);
  const band = scoreToBand(computeOverall(scores));

  // write
  return db.transaction(async (tx) => {
    await tx.update(examSessions).set({ status: "completed", ...scores, band });
  });
}
```

## File

1 file = 1 concern. Tách khi > 200 dòng hoặc 2+ concerns. Split theo subdomain (~~helpers.ts~~ → `scoring.ts`).

## Error

Throw, never return. TS: `AppError` subclasses. Python: `PermanentError`.

## I/O

Parallel reads. Atomic writes.

```typescript
const [user, exam] = await Promise.all([getUser(id), getExam(id)]);
await db.transaction(async (tx) => { /* all writes */ });
```

## Cấm

| | |
|---|---|
| Trivial wrappers | Inline `new Date().toISOString()` |
| Speculative code | Không consumer = không commit |
| Clever abstractions | `user.name` not `getField(user, "name")` |
| Loose types | `Literal["high", "medium", "low"]` not `string` |
| `any` / `as any` | Type properly |
| `console.log` / `print` | `logger` only |
| Direct env access | `env.X` (TS) / `settings.x` (Python) |

## Commit

- [ ] guard → compute → write
- [ ] No numbered steps, no dividers
- [ ] Module = namespace, no noise words, no prefix
- [ ] WHY-only comments
- [ ] 1 file, 1 concern, < 200 lines
- [ ] Errors thrown, not returned
- [ ] Parallel reads, atomic writes
- [ ] `bun run check` / `pytest` pass
