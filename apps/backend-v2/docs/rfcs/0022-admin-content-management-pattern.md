---
RFC: 0022
Title: Admin Content Management — Pattern (Vocab as reference)
Status: Draft
Created: 2026-05-11
Updated: 2026-05-11
Superseded by: —
---

# RFC 0022 — Admin Content Management Pattern (Vocab as reference)

## Summary

Đóng băng pattern triển khai admin content CRUD ở cả backend (`apps/backend-v2`)
và admin FE (`apps/admin`). RFC dùng module **Vocab** (Topic → Word → Exercise) làm
reference vì nó chứa đầy đủ độ phức tạp lặp lại trong các module sau:

- Parent-child 3 cấp với cascade delete.
- Junction table M-N (`vocab_topic_tasks`).
- Discriminated-union resource (`VocabExercise.kind` ∈ `mcq | fill_blank | word_form`,
  mỗi `kind` có payload shape khác).
- Toggle `is_published`.

Sau khi module này merge, các module tiếp theo (Grammar, Practice Listening/Reading/
Writing/Speaking, Course, Promo, Topup, Users) chỉ thay tên resource và shape,
không thiết kế lại pattern.

## Motivation

- `routes/api.php` hiện chỉ có 6 endpoint admin (5 dashboard + 1 exam import).
  Toàn bộ CRUD content cho admin **chưa tồn tại** (xem audit ở RFC 0015 §Implementation).
- Admin FE `apps/admin` đã scaffold xong primitives + dashboard, đang chặn ở chỗ
  thiếu API. Trước khi mở từng module, cần một pattern thống nhất để mỗi resource
  không tự nghĩ kiểu URL/response riêng.
- Một số quyết định trước đây (RFC 0011) đề xuất phân cấp `staff/` vs `admin/`
  prefix. Hiện thực tế đã chọn middleware `role:staff` + prefix `admin/` chung
  (xem `routes/api.php` line 178). RFC này tái khẳng định chọn lựa đó, không tạo
  prefix `staff/`. Phân quyền hẹp hơn sẽ kiểm tra trong controller/policy nếu
  cần (vd Admin-only mới được delete).

## Design — Backend

### Quy ước URL

Tất cả nằm dưới group đã có:

```php
Route::middleware(['auth:api', 'role:staff'])->prefix('admin')->group(function () {
    // ...
});
```

Mẫu CRUD cho 1 resource `R` với child `C`:

| Verb   | Path                            | Method              |
|--------|---------------------------------|---------------------|
| GET    | `/admin/{R}`                    | `index` (paginated) |
| POST   | `/admin/{R}`                    | `store`             |
| GET    | `/admin/{R}/{id}`               | `show` (full detail) |
| PATCH  | `/admin/{R}/{id}`               | `update`            |
| DELETE | `/admin/{R}/{id}`               | `destroy`           |
| POST   | `/admin/{R}/{id}/publish`       | `publish` (set `is_published=true`)  |
| POST   | `/admin/{R}/{id}/unpublish`     | `unpublish`         |
| GET    | `/admin/{R}/{id}/{C}`           | `listChildren`      |
| POST   | `/admin/{R}/{id}/{C}`           | `createChild`       |
| PATCH  | `/admin/{C}/{childId}`          | `updateChild`       |
| DELETE | `/admin/{C}/{childId}`          | `destroyChild`      |

**Lý do tách publish/unpublish endpoint** thay vì cho update toggle: dashboard
`/admin/action-items` đã có "X chưa xuất bản" → bấm từ alert → quick action không
mở edit form. Endpoint riêng cũng dễ rate-limit và log audit về sau.

### Request shape

#### List (`index`)

Query params chuẩn cho mọi resource:

```
?page=1               int    default 1
&per_page=20          int    default 20, max 100
&q=                   string optional, search trên field tự chọn (vd slug + name)
&is_published=        bool   optional filter
&sort=display_order   string default theo resource
&order=asc            asc|desc
```

Response shape Laravel default paginated resource:

```json
{
  "data": [...],
  "meta": { "current_page": 1, "per_page": 20, "total": 120, "last_page": 6 },
  "links": { ... }
}
```

#### Detail (`show`)

Trả entity + relations đã eager-load đầy đủ. Khác list ở chỗ:
- Có đủ children (vd `topic.words[]`, `topic.exercises[]`).
- Exercise expose **đầy đủ payload** (bao gồm `correct_index`) — admin cần xem để chỉnh.
  Đối lập với learner `VocabExerciseResource` đang strip `correct_index` để chống cheat
  (xem `app/Http/Resources/VocabExerciseResource.php:20-25`).

#### Create / Update

JSON body, snake_case, validated qua FormRequest riêng. Không nhận `id` trong body.

### Response shape

- Single: `{ "data": {...} }` (đã có convention).
- List: `{ "data": [...], "meta": {...} }`.
- Action không cần body (publish, destroy thành công): HTTP 204 No Content.
- Validation lỗi: HTTP 422 + `{ "message", "errors": { "field": ["..."] } }`.

### Authorization

- `role:staff` middleware gate ở route prefix.
- Delete cứng (DELETE), không soft-delete (`AGENTS.md` backend đã chốt).
- Admin-only actions trong tương lai (vd `users.destroy`) gắn thêm middleware
  `role:admin` trên route con riêng, không tự check trong controller.

### File layout

Mỗi module có 4 layer:

```
app/
  Http/
    Controllers/Api/V1/Admin/
      VocabController.php            (controller mỏng)
    Requests/Admin/Vocab/
      StoreTopicRequest.php
      UpdateTopicRequest.php
      StoreWordRequest.php
      UpdateWordRequest.php
      StoreExerciseRequest.php
      UpdateExerciseRequest.php
    Resources/Admin/
      AdminVocabTopicResource.php    (KHÔNG strip correct_index)
      AdminVocabExerciseResource.php
  Services/
    Admin/
      AdminVocabService.php          (CRUD orchestration)
```

**Quan trọng**: resource admin tách namespace `App\Http\Resources\Admin\*` thay vì
tái dùng `VocabExerciseResource` của learner. Hai resource cùng model nhưng khác
shape (admin expose payload đầy đủ, learner ẩn `correct_index`).

### Discriminated-union validation (Exercise)

FormRequest dùng conditional rules theo `kind`:

```php
public function rules(): array
{
    return [
        'kind' => ['required', Rule::in(['mcq', 'fill_blank', 'word_form'])],
        'display_order' => ['nullable', 'integer'],
        'explanation' => ['required', 'string'],
        'payload' => ['required', 'array'],

        // mcq
        'payload.prompt' => ['required_if:kind,mcq', 'string'],
        'payload.options' => ['required_if:kind,mcq', 'array', 'size:4'],
        'payload.options.*' => ['required', 'string'],
        'payload.correct_index' => ['required_if:kind,mcq', 'integer', 'between:0,3'],

        // fill_blank
        'payload.sentence' => ['required_if:kind,fill_blank', 'string'],
        'payload.accepted_answers' => ['required_if:kind,fill_blank', 'array', 'min:1'],
        'payload.accepted_answers.*' => ['string'],

        // word_form
        'payload.instruction' => ['required_if:kind,word_form', 'string'],
        // accepted_answers cũng required cho word_form (xem isAnswerCorrect)
    ];
}
```

Sau khi pass validation, controller gọi `AdminVocabService->createExercise(array $data)`.
Service chịu trách nhiệm strip key thừa theo `kind` trước khi persist (tránh payload
JSON chứa rác).

### Service responsibilities

`AdminVocabService` chịu trách nhiệm:
- Slug uniqueness (DB-level + retry nếu race).
- Sync `vocab_topic_tasks` khi PATCH topic (deleteMissing + upsert).
- Auto-assign `display_order = max + 1` khi tạo mới mà không truyền.
- Reorder API: `POST /admin/vocab/topics/{id}/words/reorder` nhận `{ ids: [...] }`,
  update theo thứ tự mảng (1 transaction). Tương tự cho `exercises`.

### Endpoints cụ thể cho Vocab

```
GET    /admin/vocab/topics                       index
POST   /admin/vocab/topics                       store
GET    /admin/vocab/topics/{id}                  show (words + exercises full)
PATCH  /admin/vocab/topics/{id}                  update (gồm tasks[])
DELETE /admin/vocab/topics/{id}                  destroy (cascade words, exercises)
POST   /admin/vocab/topics/{id}/publish          publish
POST   /admin/vocab/topics/{id}/unpublish        unpublish

GET    /admin/vocab/topics/{id}/words            listChildren (no pagination, all rows)
POST   /admin/vocab/topics/{id}/words            createChild
POST   /admin/vocab/topics/{id}/words/reorder    reorderChildren
PATCH  /admin/vocab/words/{wordId}               updateChild
DELETE /admin/vocab/words/{wordId}               destroyChild

GET    /admin/vocab/topics/{id}/exercises        listChildren
POST   /admin/vocab/topics/{id}/exercises        createChild
POST   /admin/vocab/topics/{id}/exercises/reorder
PATCH  /admin/vocab/exercises/{exerciseId}       updateChild
DELETE /admin/vocab/exercises/{exerciseId}       destroyChild
```

Không có endpoint cho `vocab_topic_tasks` riêng — tasks chỉnh inline trong
`PATCH /admin/vocab/topics/{id}` qua field `tasks: ["WT1", "SP2", ...]`.

### Tests (PHPUnit feature)

Mỗi module ≥ 1 happy-path + 1 validation failure + 1 authorization fail:

- `AdminVocabTopicTest::test_staff_can_create_topic`
- `AdminVocabTopicTest::test_learner_cannot_access`
- `AdminVocabExerciseTest::test_mcq_requires_4_options`
- `AdminVocabExerciseTest::test_fill_blank_requires_accepted_answers`
- `AdminVocabTopicTest::test_publish_toggle_idempotent`

## Design — Admin Frontend (`apps/admin`)

### Route tree

```
src/routes/_app/vocab/
  index.tsx         /vocab           list topics
  $topicId.tsx      /vocab/$topicId  topic detail (tabs: Info | Words | Exercises)
```

Không tạo route riêng cho word/exercise detail. Edit qua Modal inline trong tab.

### URL state (search params)

`/vocab` dùng search params (TanStack Router) cho mọi trạng thái table:

```ts
{ page?: number; q?: string; published?: 'all' | 'yes' | 'no' }
```

Modal create/edit không vào URL (consistent với primitives Modal hiện có).

### Components mới cần thêm

Đã có ở `src/components/`: Button, Input, Select, Card, Modal, Tabs, Badge, Skeleton,
StatCard, Toaster, PageHeader, DataTable, Sidebar, Topbar.

Cần bổ sung (1 file = 1 component):

- `Textarea.tsx` — multiline input (vẫn token-only).
- `Switch.tsx` — toggle is_published.
- `TagInput.tsx` — nhập array string (tasks, accepted_answers, synonyms). Enter to add,
  click X to remove.
- `ConfirmDialog.tsx` — wrap Modal cho destructive actions (delete topic).
- `FormField.tsx` — label + error + helper, dùng chung mọi form.

Không thêm component cho exercise editor — đó là **feature module** đặt ở
`src/features/admin-vocab/ExerciseEditor.tsx` (xem dưới).

### Feature folder

Khác frontend-v3 đã có pattern `features/{module}/`, admin chưa có. Khởi tạo:

```
src/features/admin-vocab/
  queries.ts          queryOptions: topicsListQuery, topicDetailQuery
  mutations.ts        useCreateTopic, useUpdateTopic, useDeleteTopic, usePublish, ...
  types.ts            AdminVocabTopic, AdminVocabWord, AdminVocabExercise
  TopicForm.tsx       form create/edit topic (Modal body)
  WordsTab.tsx        DataTable + Modal create/edit
  ExercisesTab.tsx    DataTable + ExerciseEditor
  ExerciseEditor.tsx  discriminated form: switch theo kind
  WordForm.tsx        form word (Modal body)
```

### Type cho discriminated union (FE)

```ts
export type ExerciseKind = "mcq" | "fill_blank" | "word_form"

export type ExercisePayload =
  | { kind: "mcq"; prompt: string; options: [string, string, string, string]; correct_index: number }
  | { kind: "fill_blank"; sentence: string; accepted_answers: string[] }
  | { kind: "word_form"; instruction: string; sentence: string; root_word: string; accepted_answers: string[] }

export interface AdminVocabExercise {
  id: string
  display_order: number
  explanation: string
  payload: ExercisePayload  // inline `kind`, không tách 2 field
}
```

FE serialize sang BE shape `{ kind, payload }` ở mutation:

```ts
function toBe(p: ExercisePayload) {
  const { kind, ...rest } = p
  return { kind, payload: rest }
}
```

### Pattern mutation + cache invalidation

Mọi mutation phải invalidate cả list + detail của parent:

```ts
const mut = useMutation({
  mutationFn: (input) => api.post("admin/vocab/topics", { json: input }).json<...>(),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "vocab", "topics"] })
  },
})
```

Pattern key: `["admin", "{resource}", ...sub]`. Sub là `"list"` + serialized search,
hoặc `["detail", id]`. Mọi feature folder thống nhất.

### Error handling

Đã có `extractError(err)` ở `lib/api.ts`. Tạo `useApiError(mutation)` hook đọc
`mutation.error`, render `errors[field]` cạnh `FormField`. Toaster chỉ dùng cho
success + non-field error (network, 500).

### Form state

Theo admin `AGENTS.md`: dùng `useState` cho form, không react-form. Một component
`useEntityForm<T>(initial: T)` helper trả `[state, setField, reset]` để bớt
boilerplate, nhưng không sang library route.

### Loading & empty states

- List loading: 5 row `Skeleton` height-12 trong `DataTable`.
- List empty: nội dung Vietnamese consistent ("Chưa có chủ đề nào. Tạo mới?").
- Detail loading: 3 card skeleton tabs disabled.
- Mutation pending: button text → "Đang lưu…", disabled.

## Implementation plan

### Module Vocab (reference)

Backend:
- [ ] `app/Http/Resources/Admin/AdminVocabTopicResource.php`
- [ ] `app/Http/Resources/Admin/AdminVocabWordResource.php`
- [ ] `app/Http/Resources/Admin/AdminVocabExerciseResource.php`
- [ ] `app/Http/Requests/Admin/Vocab/StoreTopicRequest.php`
- [ ] `app/Http/Requests/Admin/Vocab/UpdateTopicRequest.php`
- [ ] `app/Http/Requests/Admin/Vocab/StoreWordRequest.php`
- [ ] `app/Http/Requests/Admin/Vocab/UpdateWordRequest.php`
- [ ] `app/Http/Requests/Admin/Vocab/StoreExerciseRequest.php`
- [ ] `app/Http/Requests/Admin/Vocab/UpdateExerciseRequest.php`
- [ ] `app/Services/Admin/AdminVocabService.php`
- [ ] `app/Http/Controllers/Api/V1/Admin/VocabController.php`
- [ ] Routes trong `routes/api.php` (admin prefix group)
- [ ] Tests: `tests/Feature/Admin/Vocab/*Test.php`
- [ ] `./vendor/bin/pint --dirty`

Admin FE:
- [ ] Components: `Textarea`, `Switch`, `TagInput`, `ConfirmDialog`, `FormField`
- [ ] `src/features/admin-vocab/types.ts`
- [ ] `src/features/admin-vocab/queries.ts`
- [ ] `src/features/admin-vocab/mutations.ts`
- [ ] `src/features/admin-vocab/TopicForm.tsx`
- [ ] `src/features/admin-vocab/WordsTab.tsx`
- [ ] `src/features/admin-vocab/WordForm.tsx`
- [ ] `src/features/admin-vocab/ExercisesTab.tsx`
- [ ] `src/features/admin-vocab/ExerciseEditor.tsx`
- [ ] `src/routes/_app/vocab/index.tsx`
- [ ] `src/routes/_app/vocab/$topicId.tsx`
- [ ] `bun run lint`

### Sau khi Vocab merge — module kế tiếp

Cho mỗi module sau (Grammar, Practice Listening/Reading/Writing/Speaking, Course,
Promo, Topup, Users), copy 14 file FE + 11 file BE theo đúng tên, đổi resource.
Không thiết kế lại pattern. Sai lệch pattern → bị reject ở review.

## Alternatives considered

1. **`resource` route group của Laravel** — bỏ. Tách `publish/unpublish` rõ ràng hơn.
2. **GraphQL** — bỏ (RFC 0003 đã chốt REST).
3. **`/admin/vocab-topics` flat** thay vì `/admin/vocab/topics` lồng — bỏ. Lồng nhóm
   theo module dễ tìm, dễ phân chia controller.
4. **Bỏ resource admin tách namespace, dùng chung với learner + flag `?include=correct_index`**
   — bỏ. Tăng cognitive load khi đọc resource, dễ rò rỉ correct_index ra learner do quên flag.
5. **Form library (react-form, react-hook-form)** ở admin — bỏ. Admin form đơn giản,
   `useState` + `FormField` đủ (admin `AGENTS.md` đã chốt).
6. **Single global Modal context + reducer** — bỏ. Mỗi tab tự quản Modal state qua
   `useState`, giảm coupling.

## Open questions

1. Pagination limit chuẩn — 20 hay 50? → Đề xuất default 20, max 100, FE config được.
2. Reorder dùng drag-and-drop hay nút lên/xuống? → Lùi sang RFC sau. Phase 1 chỉ
   field `display_order` chỉnh bằng số.
3. Audit log (ai sửa cái gì khi nào) — có cần ngay không? → Lùi. Phase 2 thêm table
   `admin_audit_logs` + trait `LogsActivity` trên Service.
4. Bulk operations (publish nhiều, delete nhiều) — Phase 2.

## References

- RFC 0003 — API contract conventions
- RFC 0011 — Role-based features (staff vs admin)
- RFC 0015 — Admin panel tech choice
- `apps/backend-v2/routes/api.php` — current admin endpoints
- `apps/admin/AGENTS.md` — admin FE rules
- `apps/admin/src/components/` — primitives đã có
