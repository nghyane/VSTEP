# [FE] Refactor toàn bộ Frontend — adapt Laravel API mới

## Bối cảnh

Backend đã chuyển từ Elysia/Bun sang **Laravel 13** (`apps/backend-v2`). API thay đổi hoàn toàn:
- URL prefix: `/api/` → `/api/v1/`
- Response format: Laravel JsonResource (paginated `{data, meta, links}`)
- Field naming: snake_case xuyên suốt (request + response)
- Session routes tách riêng khỏi Exams
- Auth response structure thay đổi
- Practice API strip answer_key (security fix)

FE hiện tại **không kết nối được** với BE mới. Cần refactor toàn bộ.

## Scope

### 1. API Layer — `src/lib/api.ts`

- [ ] Thêm `/v1` vào base path hoặc đổi `VITE_API_URL` 
- [ ] Thêm **camelCase ↔ snake_case transform** cho request body + response body
  - Request: `targetBand` → `target_band`
  - Response: `access_token` → `accessToken`
- [ ] Fix login response parsing: data nằm trong `{data: {access_token, user, ...}}` 
- [ ] Fix auth error handling: BE trả JSON 401, không redirect (không có route `login` trên BE)

### 2. Session hooks — `src/hooks/use-exam-session.ts`

URLs đổi hoàn toàn:

| Cũ | Mới |
|---|---|
| `GET /api/exams/sessions` | `GET /api/v1/sessions` |
| `GET /api/exams/sessions/:id` | `GET /api/v1/sessions/:id` |
| `PUT /api/exams/sessions/:id` | `PUT /api/v1/sessions/:id` |
| `POST /api/exams/sessions/:id/answer` | `POST /api/v1/sessions/:id/answer` |
| `POST /api/exams/sessions/:id/submit` | `POST /api/v1/sessions/:id/submit` |

### 3. Tất cả hooks — prefix `/api/` → `/api/v1/`

Files cần đổi:
- `use-exam-session.ts` — sessions tách riêng (xem trên)
- `use-exams.ts`
- `use-practice.ts`
- `use-progress.ts`
- `use-vocabulary.ts`
- `use-submissions.ts`
- `use-notifications.ts`
- `use-devices.ts`
- `use-user.ts`
- `use-admin-questions.ts`
- `use-admin-exams.ts`
- `use-admin-knowledge-points.ts`
- `use-admin-submissions.ts`
- `use-admin-users.ts`
- `use-classes.ts`
- `use-uploads.ts`
- `use-ai.ts`
- Routes gọi API trực tiếp: `_learner.tsx`, `_focused/onboarding.tsx`

### 4. Xóa mock data — ~4000 dòng dead code

| File | Dòng | Thay bằng |
|---|---|---|
| `src/lib/mock-classes.ts` | 837 | Xóa. Dashboard dùng `use-classes.ts` hooks (khi BE có classes API) hoặc hiện empty state |
| `src/routes/_learner/practice/-components/mock-data.ts` | 1445 | Xóa. Practice dùng `use-practice.ts` + real API |
| `src/routes/_learner/vocabulary/-components/mock-data.ts` | 1129 | Xóa. Vocab dùng `use-vocabulary.ts` hooks |
| `src/routes/_learner/vocabulary/-components/sentence-mock-data.ts` | 538 | Xóa. Feature chưa có API |
| `src/routes/_focused/-components/` mock constants | ~500 | Xóa (`MOCK_LISTENING_KEYWORDS`, `MOCK_CONVERSATIONS`, `MOCK_TEMPLATES`, `MOCK_LEVEL1_RESULTS`, `MOCK_LEVEL2_RESULTS`, `MOCK_FEEDBACK`, `MOCK_EXPLANATIONS`) |

Consumers cần refactor khi xóa mock:
- `dashboard.tsx` — dùng mock classes → empty state hoặc real API
- `classes.$classId.tsx` — dùng mock → real API hoặc disable
- `dashboard_.$classId.tsx` — dùng mock → real API hoặc disable
- `vocabulary/index.tsx` — dùng `VOCAB_TOPICS` mock → `use-vocabulary` hook
- `vocabulary/$topicId.*.tsx` — dùng `getMockTopic()` → `use-vocabulary` hook
- `vocabulary/sentences.$topicId.tsx` — dùng sentence mock → disable (chưa có API)
- `practice/-components/SkillPracticePage.tsx` — dùng mock-data → real practice API
- `_focused/exercise.tsx` — dùng mock-data types → real types

### 5. Xóa dead files

- [ ] `src/routes/_instructor.tsx.disabled` — file disabled, xóa

### 6. Fix UI bugs

- [ ] **Mobile nav** — hamburger `Menu01Icon` trong `LearnerLayout.tsx:245` không mở gì. Cần Sheet/Drawer với nav items
- [ ] **Practice route 404** — `practice/index.tsx:113` link tới `/practice/${skill}` nhưng không có route file `practice/$skill.tsx`
- [ ] **Onboarding self-assess** — gán cùng level cho cả 4 skills. Thêm bước 2: cho user chỉnh từng skill (BE đã sẵn sàng nhận per-skill)

### 7. Type alignment — `src/types/api.ts`

Response types cần align với BE mới:
- [ ] `ExamSession` — thêm `overall_band` field
- [ ] `ProgressSkillDetail` — `trend` giờ trả data thật (`improving`/`stable`/`declining`/`inconsistent`), `windowDeviation` có giá trị
- [ ] `LearningPathSkill` — `sessionsPerWeek`, `estimatedMinutes` giờ dynamic theo gap
- [ ] `EnrichedGoal` — `achieved` + `onTrack` giờ tính thật
- [ ] `PracticeNextResponse` — question không còn `answer_key`, `explanation` (stripped bởi `PracticeQuestionResource`)
- [ ] `OnboardingStatus` — `levels` có thể partial (placement chỉ check L/R)

### 8. Endpoints FE gọi nhưng BE chưa có

| FE hook | Endpoint | Status |
|---------|----------|--------|
| `use-classes.ts` | `/api/classes/*` (7 endpoints) | ❌ BE chưa có — dashboard dùng empty state |
| `use-uploads.ts` | `/api/uploads/audio` | ❌ Thuộc grading microservice |
| `use-ai.ts` | `/api/ai/paraphrase`, `/api/ai/explain` | ❌ Thuộc grading microservice |
| `use-admin-submissions.ts` | `auto-grade`, `assign` | ❌ BE chỉ có `grade` |
| `use-admin-users.ts` | `list`, `create`, `delete` | ❌ BE chỉ có `show`, `update` |

→ Hooks cho endpoints chưa có: giữ code nhưng disable UI, hoặc xóa nếu không dùng.

## Cách tiếp cận

**Không fix từng file.** Refactor theo layer:

1. `api.ts` — transform layer (snake ↔ camel) + prefix fix
2. Xóa toàn bộ mock files + update consumers
3. Update tất cả hooks một lượt
4. Fix types
5. Fix UI bugs (mobile nav, practice route, onboarding)
6. Test end-to-end với BE thật

## Acceptance criteria

- [ ] `bunx tsc --noEmit` pass
- [ ] `bunx biome check .` pass
- [ ] Không còn file mock-data nào
- [ ] Không còn `console.log`
- [ ] Tất cả pages handle loading/error/empty states
- [ ] Login → onboarding → practice → progress flow hoạt động end-to-end với `php artisan serve`

## Test accounts

```
admin@vstep.local / password
instructor@vstep.local / password  
learner@vstep.local / password
```
