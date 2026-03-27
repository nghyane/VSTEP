# Code Style — VSTEP

Áp dụng cho PHP (backend-v2) và TypeScript (frontend).

Xem thêm `apps/backend-v2/AGENTS.md` cho Laravel-specific conventions.

## 5 Luật

1. **Early Exit** — Guard clause đầu hàm. Happy path phẳng, không nested.
2. **Parse, Don't Validate** — Untrusted input → typed model tại boundary. Sau đó không check lại.
3. **Atomic Predictability** — Cùng input → cùng output. Không mutate input, không hidden side-effect.
4. **Fail Fast, Fail Loud** — Throw khi invalid. Không nuốt lỗi, không silent fallback.
5. **Intentional Naming** — Đọc như tiếng Anh. Hàm = hành động, biến = danh từ, type = khái niệm.

## Naming

### Module = namespace, tên không lặp

```php
// app/Services/SubmissionService.php
public function submit(): ...   // SubmissionService::submit()
public function grade(): ...    // SubmissionService::grade()

// app/Support/VstepScoring.php
public static function round(): ...  // VstepScoring::round()
public static function band(): ...   // VstepScoring::band()
```

### Bỏ noise words

| Noise | Clean | Lý do |
|-------|-------|-------|
| ~~create~~Submission | `create()` | class name cung cấp context |
| ~~get~~User | `find(id)` | get là mặc định |
| ~~handle~~Error | throw luôn | handle = nói mà không nói gì |
| ~~process~~Task | `grade(task)` | domain verb |

### Convention

| Ngữ cảnh | Style | Ví dụ |
|-----------|-------|-------|
| Classes | PascalCase | `GradeSubmission`, `WritingGrader` |
| Methods | camelCase | `applySubmission()`, `expandKnowledgeScope()` |
| Variables | camelCase | `$overallScore`, `$knowledgeScope` |
| Files (PHP) | PascalCase | `GradeSubmission.php` |
| Files (TS) | kebab-case | `submission-service.ts` |
| DB columns | snake_case | `created_at`, `knowledge_gaps` |

**Cấm:** generic names (`$data`, `$info`, `$item`), prefix repetition (`$result->resultScore`).

## Comments

WHY only. Cần section dividers → tách file.

## Function

guard → compute → write. Không xen kẽ.

## File

1 file = 1 concern. Tách khi > 200 dòng hoặc 2+ concerns.

## Error

Throw, never return. PHP: exceptions. Laravel auto-handles validation 422, not found 404.

## Cấm

| | |
|---|---|
| Speculative code | Không consumer = không commit |
| `console.log` / `dd()` | `Log` facade only |
| Raw strings for fixed values | Use enums |
| `??` on validated data | FormRequest already handles nullability |

## Commit

- [ ] `./vendor/bin/pint` pass
- [ ] guard → compute → write
- [ ] WHY-only comments
- [ ] 1 file, 1 concern
- [ ] Errors thrown, not returned
