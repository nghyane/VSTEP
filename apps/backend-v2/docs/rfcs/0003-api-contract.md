---
RFC: 0003
Title: API Surface & Contract
Status: Draft
Created: 2026-04-18
Updated: 2026-04-18
Superseded by: —
---

# RFC 0003 — API Surface & Contract

## Summary

Toàn bộ endpoint REST của backend-v2. Bao gồm: verb + path, auth level, purpose, request/response shape tổng quát. Không đi vào validation rule chi tiết (sẽ ở form requests), không có error schema chi tiết (dùng Laravel default).

## Conventions

- Prefix: `/api/v1` cho learner/public. `/api/v1/admin` cho admin panel. `/api/v1/teacher` cho teacher.
- Auth:
  - `public` — không cần token
  - `jwt` — learner access, JWT chứa `account_id + active_profile_id`
  - `jwt:admin` — role admin
  - `jwt:teacher` — role teacher
- Response shape: `{ "data": ..., "meta": { ... } }` theo Laravel API Resource default.
- Pagination: `?page=1&per_page=20`, response `meta: { current_page, total, per_page, last_page }`.
- Error: HTTP status + `{ "message": "...", "errors": {...} }`.
- Field naming: snake_case trong JSON.
- Profile context: JWT claim quyết định active_profile_id. Endpoint không cần truyền profile_id trong body.

## Design

Chia theo 10 nhóm endpoint tương ứng business module.

---

## 1. Auth

### `POST /api/v1/auth/register` — public
Tạo account + profile đầu + cấp 100 xu.

Request: `{ email, password, nickname, target_level, target_deadline, entry_level? }`
Response: `{ access_token, refresh_token, account, active_profile }`

### `POST /api/v1/auth/login` — public
Login, mặc định active profile = profile đầu của account.

Request: `{ email, password }`
Response: `{ access_token, refresh_token, account, active_profile }`

### `POST /api/v1/auth/refresh` — public
Refresh JWT.

### `POST /api/v1/auth/logout` — jwt
Revoke refresh token hiện tại.

### `GET /api/v1/auth/me` — jwt
Current account + active profile.

---

## 2. Profile

### `GET /api/v1/profiles` — jwt
List profiles của account.

### `POST /api/v1/profiles` — jwt
Tạo profile mới. Profile thứ 2+ không được tặng 100 xu.

Request: `{ nickname, target_level, target_deadline, entry_level? }`

### `GET /api/v1/profiles/{id}` — jwt
Chi tiết 1 profile của account.

### `PATCH /api/v1/profiles/{id}` — jwt
Update nickname, target, deadline.

### `DELETE /api/v1/profiles/{id}` — jwt
Hard delete. Không cho xóa profile cuối cùng của account.

### `POST /api/v1/profiles/{id}/reset` — jwt
Wipe learning data. Trả về snapshot đã xóa.

Request: `{ reason? }`
Response: `{ wiped_entities: {...}, reset_at }`

### `POST /api/v1/auth/switch-profile` — jwt
Reissue JWT với `active_profile_id` mới.

Request: `{ profile_id }`
Response: `{ access_token, refresh_token, active_profile }`

### `POST /api/v1/profiles/{id}/onboarding` — jwt
Submit onboarding responses.

Request: `{ weaknesses[], motivation, raw_answers }`

---

## 3. Wallet & Economy

### `GET /api/v1/wallet/balance` — jwt
Balance của active profile.

Response: `{ balance, last_transaction_at }`

### `GET /api/v1/wallet/transactions` — jwt
Lịch sử giao dịch paginated.

Response: `{ data: [{id, type, delta, balance_after, source_type, source_id, metadata, created_at}], meta }`

### `GET /api/v1/wallet/topup-packages` — jwt
List gói nạp active.

### `POST /api/v1/wallet/topup` — jwt
Tạo topup order status pending.

Request: `{ package_id, payment_provider? }`
Response: `{ data: { id, amount_vnd, coins_to_credit, status, provider_ref, ... } }`

### `POST /api/v1/wallet/topup/{orderId}/confirm` — jwt
Mock confirm payment. Idempotent. Real gateway sẽ dùng callback riêng (phase 2).

Response: `{ data: { id, status: 'paid', paid_at, ... } }`

### `POST /api/v1/wallet/topup/callback` — public (signed)
Payment gateway webhook (phase 2, chưa implement).

### `POST /api/v1/wallet/promo-redeem` — jwt
Redeem promo code.

Request: `{ code }`
Response: `{ coins_granted, balance_after, transaction_id }`

---

## 4. Foundation content (learner read)

### `GET /api/v1/vocab/topics` — jwt
List topics, filter `?level=B1&task=WT1`.

### `GET /api/v1/vocab/topics/{id}` — jwt
Detail với words + exercises + SRS state của active profile.

### `GET /api/v1/vocab/srs/queue` — jwt
Queue due today cho active profile, cross topics.

Response: `{ new_count, learning_count, review_count, items: [{word, state}] }`

### `POST /api/v1/vocab/srs/review` — jwt
Ghi 1 review event.

Request: `{ word_id, rating (1-4) }`
Response: `{ new_state, next_due_at }`

### `POST /api/v1/vocab/exercises/{id}/attempt` — jwt
Attempt vocab exercise. Ghi `practice_sessions` + answer record.

Request: `{ session_id?, answer }` (session_id null → tạo mới)
Response: `{ is_correct, explanation, session_id }`

### `GET /api/v1/grammar/points` — jwt
List grammar points filter.

### `GET /api/v1/grammar/points/{id}` — jwt
Detail với structures/examples/mistakes/tips/exercises + mastery của active profile.

### `POST /api/v1/grammar/exercises/{id}/attempt` — jwt

Request: `{ session_id?, answer }`
Response: `{ is_correct, explanation, session_id, mastery_delta: {...} }`

---

## 5. Practice skills

### `GET /api/v1/practice/listening/exercises` — jwt
List filter `?part=1&page=1`.

### `GET /api/v1/practice/listening/exercises/{id}` — jwt
Detail + progress của profile.

### `POST /api/v1/practice/listening/sessions` — jwt
Start session. Không trừ xu (drill free).

Request: `{ exercise_id }`
Response: `{ session_id, started_at }`

### `POST /api/v1/practice/listening/sessions/{id}/support` — jwt
Bật support level. Trừ xu.

Request: `{ level }`
Response: `{ coins_spent, balance_after, support_levels_used }`

### `POST /api/v1/practice/listening/sessions/{id}/submit` — jwt
Submit answers. Chấm ngay, không qua grading job.

Request: `{ answers: [{question_id, selected_index}] }`
Response: `{ score, total, items: [{question_id, is_correct, explanation}] }`

Tương tự cho `reading`, `writing`, `speaking-drill`, `speaking-vstep-practice`.

### Writing specific

### `POST /api/v1/practice/writing/sessions/{id}/submit` — jwt
Submit writing. Tạo submission + enqueue grading job.

Request: `{ text, word_count }`
Response: `{ submission_id, grading_job_id, status: "grading" }`

### `GET /api/v1/practice/writing/submissions/{id}` — jwt
Get submission với grading result (nếu ready).

Response: `{ submission, grading: { status, result? }, history: [{version, is_active}] }`

### `POST /api/v1/practice/writing/submissions/{id}/regrade` — jwt
Request chấm lại. Tạo grading_job mới, version++. Không tốn xu.

### Speaking specific

### `POST /api/v1/practice/speaking/sessions/{id}/upload` — jwt
Upload audio trước khi submit. Dùng presigned URL R2.

Request: `{ part_id }`
Response: `{ upload_url, audio_key }`

### `POST /api/v1/practice/speaking/sessions/{id}/submit` — jwt

Request: `{ part_id, audio_key, duration_seconds }`
Response: `{ submission_id, grading_job_id, status: "grading" }`

### `POST /api/v1/practice/speaking-drill/attempts` — jwt
Dictation attempt per sentence.

Request: `{ session_id, sentence_id, mode, user_text }`
Response: `{ accuracy_percent }`

---

## 6. Exam (Mock test)

### `GET /api/v1/exams` — jwt
List đề published.

### `GET /api/v1/exams/{id}` — jwt
Detail với sections + lastAttempt.

Response: `{ exam, active_version, sections: [...], my_attempts: [{id, mode, score, submitted_at}] }`

### `POST /api/v1/exams/{id}/sessions` — jwt
Start exam session. Trừ xu atomic. Không đủ xu → 402 Payment Required.

Request: `{ mode: 'custom'|'full', selected_skills: [...], time_extension_factor }`
Response: `{ session_id, server_deadline_at, coins_charged, balance_after }`

### `GET /api/v1/exam-sessions/{id}` — jwt
State session hiện tại cho resume.

Response: `{ session, answers_summary, remaining_seconds }`

### `POST /api/v1/exam-sessions/{id}/listening-played` — jwt
Log sự kiện play listening section.

Request: `{ section_id }`
Response: `{ played_at }` hoặc 409 nếu đã play.

### `PATCH /api/v1/exam-sessions/{id}/answer` — jwt
Save answer trung gian (auto-save).

Request: `{ type: 'mcq'|'writing'|'speaking', ref_id, answer }`

### `POST /api/v1/exam-sessions/{id}/submit` — jwt
Submit toàn bộ. Server chấm MCQ, enqueue grading cho writing/speaking. Force-submit nếu quá deadline.

Response: `{ mcq_score, writing_submissions: [{id, status}], speaking_submissions: [{id, status}], submitted_at }`

### `GET /api/v1/exam-sessions/{id}/result` — jwt
Full result với grading đã ready.

Response: `{ overall_band?, skill_bands, mcq_detail, writing_results: [...], speaking_results: [...], teacher_review? }`

### `GET /api/v1/exam-sessions/{id}/detail` — jwt
Per-question breakdown cho review.

---

## 7. Grading (internal + learner read)

### `GET /api/v1/grading/jobs/{id}` — jwt
Status của job.

Response: `{ id, status, attempts, last_error, result_url?, created_at }`

### `POST /api/v1/grading/jobs/{id}/retry` — jwt
Retry thủ công khi failed. Rate-limit 1 lần/10 phút.

---

## 8. Courses

### `GET /api/v1/courses` — jwt
List published courses, có flags `enrolled`, `commitment_status`.

### `GET /api/v1/courses/{id}` — jwt
Detail + schedule + enrollment status + commitment status.

### `POST /api/v1/courses/{id}/enroll` — jwt
Mua course bằng xu. Atomic trừ xu + cấp bonus xu + tạo enrollment.

Response: `{ enrollment_id, coins_charged, bonus_received, balance_after }` hoặc 402/409.

### `GET /api/v1/courses/{id}/my-slots` — jwt
Slots available cho profile này (sau khi enrolled + commitment met).

Response: `{ slots: [...], remaining_student_slots }`

### `POST /api/v1/courses/{id}/bookings` — jwt
Book slot.

Request: `{ slot_id, submission_type?, submission_id? }`
Response: `{ booking_id, slot, meet_url? }` hoặc 409 (slot taken, limit reached).

### `GET /api/v1/my/bookings` — jwt
List booking active + past.

### `PATCH /api/v1/my/bookings/{id}/cancel` — jwt
Cancel (policy phase 1: không refund).

---

## 9. Progress & Overview

### `GET /api/v1/overview` — jwt
Dashboard data cho active profile.

Response:
```json
{
  "profile": { "nickname", "target_level", "target_deadline", "days_until_exam" },
  "stats": {
    "estimated_band": null,  // null if < min_tests
    "band_gap": null,
    "weakest_skill": null,
    "trend": null,
    "total_tests": 3,
    "min_tests_required": 5,
    "total_study_minutes": 420,
    "streak": 7
  },
  "spider_chart": null,  // or { listening, reading, writing, speaking }
  "activity_heatmap": {...},
  "next_action": {...}
}
```

### `GET /api/v1/streak` — jwt

Response: `{ current_streak, longest_streak, today_progress, daily_goal, last_active_date }`

### `GET /api/v1/practice-progress` — jwt
Summary per skill: total exercises done, in_progress, completed.

---

## 10. Notifications

### `GET /api/v1/notifications` — jwt
Paginated list.

### `GET /api/v1/notifications/unread-count` — jwt

### `POST /api/v1/notifications/read-all` — jwt

### `DELETE /api/v1/notifications/{id}` — jwt

---

## 11. AI Chat

### `POST /api/v1/ai-chat/messages` — jwt
Send message. Streaming response qua SSE.

Request: `{ content, context?: { exercise_id, prompt_id, ... } }`
Response: SSE stream of tokens.

### `GET /api/v1/ai-chat/history` — jwt
Recent messages.

---

## 12. Admin (admin panel)

Under `/api/v1/admin`, auth `jwt:admin`.

### Content CRUD (mirror Authoring)
- `GET/POST/PATCH/DELETE /admin/vocab/topics`
- `GET/POST/PATCH/DELETE /admin/vocab/words`
- `GET/POST/PATCH/DELETE /admin/vocab/exercises`
- `GET/POST/PATCH/DELETE /admin/grammar/points` + children
- `GET/POST/PATCH/DELETE /admin/grammar/exercises`
- `GET/POST/PATCH/DELETE /admin/practice/listening-exercises` + questions
- `GET/POST/PATCH/DELETE /admin/practice/reading-exercises` + questions
- `GET/POST/PATCH/DELETE /admin/practice/writing-prompts` + children
- `GET/POST/PATCH/DELETE /admin/practice/speaking-drills` + sentences
- `GET/POST/PATCH/DELETE /admin/practice/speaking-tasks`
- `GET/POST/PATCH/DELETE /admin/exams` + versions + sections/passages/tasks/parts

### Commerce
- `GET/POST/PATCH/DELETE /admin/courses` + schedule
- `GET/POST/PATCH/DELETE /admin/teacher-slots`
- `GET /admin/bookings` — all bookings
- `GET /admin/enrollments` — all enrollments

### Config
- `GET /admin/configs`
- `PATCH /admin/configs/{key}`
- `GET/POST/PATCH/DELETE /admin/topup-packages`
- `GET/POST/PATCH/DELETE /admin/promo-codes`

### Wallet admin
- `POST /admin/wallet/grant` — admin_grant xu cho profile
  - Request: `{ profile_id, amount, reason }`

### Reports
- `GET /admin/reports/wallet-daily`
- `GET /admin/reports/active-users`
- `GET /admin/reports/grading-jobs`

### Accounts
- `GET /admin/accounts` — list paginated
- `PATCH /admin/accounts/{id}/role`
- `POST /admin/accounts/{id}/teacher-grant` — nâng role learner → teacher

---

## 13. Teacher panel

Under `/api/v1/teacher`, auth `jwt:teacher`.

### `GET /api/v1/teacher/courses` — teacher courses được gán
### `GET /api/v1/teacher/slots` — my slots
### `POST /api/v1/teacher/slots` — open slot mới
### `PATCH /api/v1/teacher/slots/{id}` — cancel slot
### `GET /api/v1/teacher/bookings` — my bookings
### `PATCH /api/v1/teacher/bookings/{id}` — paste meet_url, mark completed
### `POST /api/v1/teacher/bookings/{id}/review` — submit teacher_review

Request: `{ content, visible_to_student }`

### `GET /api/v1/teacher/bookings/{id}/submission` — xem submission nếu attach

---

## Rate limits

- Auth endpoints: 10/phút/IP.
- Grading retry: 1/10phút/submission.
- Promo redeem: 5/giờ/account.
- Top-up create: 10/giờ/account.
- Exam session create: 20/giờ/profile.
- AI chat: 30 messages/phút/profile.

## Error code convention

- 400: validation
- 401: unauthorized (no JWT)
- 403: forbidden (role mismatch, profile not owned)
- 404: not found
- 409: conflict (slot taken, already enrolled, duplicate submission)
- 402: payment required (không đủ xu)
- 422: business rule violated (commitment not met, not enough data for chart)
- 429: rate limit

## Alternatives considered

### Alt 1: GraphQL thay REST
Bỏ. FE dùng TanStack Query với REST tốt rồi, không cần GraphQL complexity. Laravel REST + Resources.

### Alt 2: Không có teacher panel API, làm qua admin panel
Bỏ. Teacher là role riêng, có cần endpoint riêng để scope permissions rõ.

### Alt 3: Profile ID trong URL path
Vd `/api/v1/profiles/{pid}/wallet/balance`. Cân nhắc, chọn không. JWT claim đã có active_profile_id, put vào URL vừa dài vừa dễ mismatch.

## Implementation

- [ ] Controllers skeleton
- [ ] Form Requests
- [ ] Resources (response shapes)
- [ ] Policies
- [ ] Middleware: `profile.active`, `role.admin`, `role.teacher`
- [ ] Rate limit middleware
- [ ] OpenAPI spec export

## Open questions

1. Payment callback URL có cần signed? Dùng HMAC secret với provider.
2. SSE cho AI chat — Laravel có thể serve SSE qua Octane? Check khả năng.
3. File upload audio có cần chunk? Phase 1: single PUT presigned, max 10MB.
4. Có cần endpoint `GET /api/v1/my/submissions` aggregate cross-skill cho "lịch sử bài nộp"?
5. Admin accounts list có expose email không? Có, admin cần.
