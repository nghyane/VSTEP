# Mobile v2 Handoff

## Mục tiêu

`apps/mobile-v2` là bản redesign/refactor mới cho mobile app của VSTEP, lấy frontend-v3 làm chuẩn về:

- flow sản phẩm
- design tokens
- cách gọi tên tính năng
- logic học tập / luyện tập / thi thử

Mục tiêu không phải chỉ làm "UI đẹp", mà là:

1. đúng luồng học thật
2. đúng luồng thi thử thật
3. đúng logic AI grading cho Writing/Speaking
4. dùng Lạc hợp lý, tiết chế, đúng biểu cảm
5. toàn bộ tiếng Việt phải có dấu

---

## Trạng thái hiện tại

Đã hoàn thành một phần lớn của đợt refactor, chia theo phase như sau.

### Phase 1: Sửa tiếng Việt + mascot

Đã làm:

- `app/(auth)/login.tsx`
- `app/(auth)/register.tsx`
- `app/(app)/onboarding.tsx`
- `app/(app)/(tabs)/index.tsx`
- `app/(app)/(tabs)/practice.tsx`
- `app/(app)/(tabs)/exams.tsx`
- `app/(app)/(tabs)/profile.tsx`

Kết quả:

- text chính đã được chuyển sang tiếng Việt có dấu
- mascot Lạc không còn bị lạm dụng animation
- Lạc được giảm size và đặt hợp lý hơn ở login / onboarding / dashboard / profile

Lưu ý:

- vẫn còn vài file phụ chưa được rà hết tiếng Việt có dấu

### Phase 2: Onboarding đúng flow docs

Đã viết lại `app/(app)/onboarding.tsx` theo đúng flow trong docs mobile:

1. Chào mừng
2. Chọn band mục tiêu `B1 / B2 / C1`
3. Thời gian học mỗi ngày `15 / 30 / 45 / 60`
4. Thời hạn `3 tháng / 6 tháng / 1 năm / không giới hạn`

Hiện trạng:

- flow UI đúng hướng
- chưa nối API lưu goal thật

### Phase 3: Luyện tập 4 kỹ năng đúng hướng hơn

Đã sửa:

- `app/(app)/practice/skills.tsx`
- `app/(app)/practice/[skill].tsx`
- `app/(app)/practice/result/[id].tsx`

Hiện trạng:

- đã mô tả đúng bản chất từng skill:
  - Listening: audio + MCQ + chấm ngay
  - Reading: passage + MCQ + chấm ngay
  - Writing: nhập text + AI chấm bất đồng bộ
  - Speaking: ghi âm + upload audio + AI chấm bất đồng bộ
- mới dừng ở flow UI / shell
- chưa nối API thật cho question / submission / polling

### Phase 4: Thi thử đúng hướng hơn

Đã sửa:

- `app/(app)/exam/[id].tsx`
- `app/(app)/session/[id].tsx`
- `app/(app)/exam-result/[id].tsx`

Hiện trạng:

- exam detail screen đã đúng hơn
- session screen đã là shell có:
  - top bar
  - timer pill
  - tab 4 kỹ năng
  - nội dung theo skill
  - nút lưu tạm / nộp bài
- chưa nối API thật cho:
  - load câu hỏi
  - autosave
  - submit session
  - result thật

---

## Những vấn đề còn lại

### 1. Chưa rà hết toàn bộ text tiếng Việt có dấu

Các file cần kiểm tra tiếp:

- `app/(app)/goal.tsx`
- `app/(app)/account.tsx`
- `app/(app)/vocabulary/index.tsx`
- `app/(app)/practice/foundation/index.tsx`
- `src/components/MascotStates.tsx`
- `src/features/streak/StreakButton.tsx`
- `src/features/notification/NotificationButton.tsx`
- `src/hooks/*` nếu có text hiển thị ra UI

### 2. Practice chưa nối backend thật

Hiện chưa có:

- load bài listening/reading thật
- render MCQ thật
- submit objective và lấy điểm ngay
- writing/speaking submission flow thật
- polling grading status
- upload audio thật cho speaking

### 3. Exam session chưa nối backend thật

Hiện chưa có:

- tạo phiên thi đúng payload
- load dữ liệu theo 4 skill
- state answers kiểu `Record<string, SubmissionAnswer>`
- autosave mỗi 30 giây
- countdown timer thật
- submit exam session thật
- exam result thật

### 4. Auth flow hiện chưa khớp docs mobile hoàn toàn

Theo docs:

- app launch nên check token từ secure store
- nếu có token hợp lệ → vào app
- nếu token hết hạn → refresh token

Hiện code root layout đang clear token khi mở app để ép login lại.

File cần sửa sau:

- `app/_layout.tsx`
- `src/lib/auth.ts`
- `src/lib/api.ts`

---

## Source of truth phải đọc trước khi tiếp tục

### 1. Project instructions

Đọc trước:

- `AGENTS.md`
- `apps/frontend-v3/AGENTS.md`

### 2. Docs về flow mobile

Bắt buộc đọc kỹ:

- `docs/mobile/flows.md`

Đây là source of truth cho:

- auth flow
- onboarding flow
- practice flow
- exam flow
- speaking audio upload
- navigation
- token refresh

### 3. Docs về practice system

Đọc kỹ:

- `docs/practice-system-plan.md`

Đây là source of truth cho:

- mode practice
- subjective vs objective
- retry flow
- session lifecycle
- expected API shape

### 4. Frontend v3 implementation

Đọc kỹ các phần này:

- `apps/frontend-v3/src/features/practice/types.ts`
- `apps/frontend-v3/src/features/practice/queries.ts`
- `apps/frontend-v3/src/features/practice/components/`
- `apps/frontend-v3/src/features/exam/types.ts`
- `apps/frontend-v3/src/features/exam/queries.ts`
- `apps/frontend-v3/src/features/exam/components/`

### 5. Mobile v1 để đối chiếu những gì đã từng làm

Đọc kỹ:

- `apps/mobile/app/`
- `apps/mobile/src/components/`
- `apps/mobile/src/hooks/`
- `apps/mobile/src/lib/api.ts`
- `apps/mobile/src/types/api.ts`

---

## Lệnh đọc nhanh những phần cần thiết

### Đọc docs quan trọng

```powershell
Get-Content docs/mobile/flows.md
Get-Content docs/practice-system-plan.md
```

### Đọc instructions

```powershell
Get-Content AGENTS.md
Get-Content apps/frontend-v3/AGENTS.md
```

### Đọc flow practice / exam ở frontend-v3

```powershell
Get-Content apps/frontend-v3/src/features/practice/types.ts
Get-Content apps/frontend-v3/src/features/practice/queries.ts
Get-ChildItem apps/frontend-v3/src/features/practice/components

Get-Content apps/frontend-v3/src/features/exam/types.ts
Get-Content apps/frontend-v3/src/features/exam/queries.ts
Get-ChildItem apps/frontend-v3/src/features/exam/components
```

### Đọc mobile-v2 các màn cần sửa tiếp

```powershell
Get-Content apps/mobile-v2/app/_layout.tsx
Get-Content apps/mobile-v2/app/(app)/_layout.tsx

Get-Content apps/mobile-v2/app/(app)/(tabs)/index.tsx
Get-Content apps/mobile-v2/app/(app)/(tabs)/practice.tsx
Get-Content apps/mobile-v2/app/(app)/(tabs)/exams.tsx
Get-Content apps/mobile-v2/app/(app)/(tabs)/profile.tsx

Get-Content apps/mobile-v2/app/(app)/onboarding.tsx
Get-Content apps/mobile-v2/app/(app)/practice/skills.tsx
Get-Content apps/mobile-v2/app/(app)/practice/[skill].tsx
Get-Content apps/mobile-v2/app/(app)/exam/[id].tsx
Get-Content apps/mobile-v2/app/(app)/session/[id].tsx
```

### Tìm text không dấu còn sót

```powershell
Select-String -Path apps/mobile-v2/**/*.tsx -Pattern "Dang|Khong|Muc tieu|Luyen|Thi thu|Ho so|Tai khoan|Quay lai|Bat dau"
```

### Chạy typecheck

```powershell
Set-Location apps/mobile-v2
bun run typecheck
```

### Chạy app

```powershell
Set-Location apps/mobile-v2
bun install
bun start
```

---

## Thứ tự phase nên làm tiếp

### Phase 5 — Rà toàn bộ text tiếng Việt còn sót

Mục tiêu:

- không còn chữ không dấu trong UI
- thống nhất wording toàn app

Checklist:

- grep toàn bộ `apps/mobile-v2`
- sửa text cứng trong screen/components
- kiểm tra alert, button, placeholder, heading, empty state

### Phase 6 — Hoàn thiện các màn phụ

Ưu tiên sửa tiếp:

- `app/(app)/goal.tsx`
- `app/(app)/account.tsx`
- `app/(app)/practice/foundation/index.tsx`
- `app/(app)/vocabulary/index.tsx`

Mục tiêu:

- wording đúng
- flow hợp lý hơn
- mascot dùng tiết chế

### Phase 7 — Nối flow practice thật

Mục tiêu:

- Listening / Reading:
  - fetch bài thật
  - render MCQ thật
  - submit objective thật
  - hiện result ngay
- Writing / Speaking:
  - submit subjective thật
  - polling submission thật
  - render loading / processing / completed / review_pending

Đầu mối đọc:

- `docs/mobile/flows.md`
- `docs/practice-system-plan.md`
- `apps/frontend-v3/src/features/practice/*`

### Phase 8 — Nối flow exam thật

Mục tiêu:

- exam detail → start session thật
- session tabs 4 skills thật
- answer state thật
- autosave mỗi 30s
- submit thật
- result thật

Đầu mối đọc:

- `docs/mobile/flows.md`
- `apps/frontend-v3/src/features/exam/*`

### Phase 9 — Auth đúng chuẩn docs

Mục tiêu:

- bỏ logic clear token khi launch
- restore session đúng
- refresh token đúng flow

Files cần sửa:

- `app/_layout.tsx`
- `src/lib/auth.ts`
- `src/lib/api.ts`

---

## Ghi chú implementation quan trọng

### 1. Với `useSyncExternalStore`

`getSnapshot` phải trả về stable reference.

Đã fix rồi ở:

- `src/features/streak/streak-store.ts`
- `src/features/notification/notification-store.ts`
- `src/features/coin/coin-store.ts`

Không được tái tạo object/array/set mới trong `getSnapshot`.

### 2. Mascot usage rules

Không làm Lạc nhảy lung tung.

Rule đang dùng:

- login: `wave`, size vừa
- register: `happy`, nhỏ hơn login
- onboarding: đổi biểu cảm theo từng step
- dashboard: `hero`, nhỏ ở góc banner
- profile: `wave`, nhỏ ở hero
- practice skill: đúng mascot theo skill
- empty / locked state: `think`

### 3. Không biến shell thành production-ready giả

Một số màn đang là shell đúng flow chứ chưa phải feature hoàn chỉnh.

Phải phân biệt rõ:

- đúng flow UI
- chưa nối backend/API thật

---

## Files đã sửa lớn trong đợt này

- `apps/mobile-v2/app/(auth)/login.tsx`
- `apps/mobile-v2/app/(auth)/register.tsx`
- `apps/mobile-v2/app/(app)/onboarding.tsx`
- `apps/mobile-v2/app/(app)/(tabs)/index.tsx`
- `apps/mobile-v2/app/(app)/(tabs)/practice.tsx`
- `apps/mobile-v2/app/(app)/(tabs)/exams.tsx`
- `apps/mobile-v2/app/(app)/(tabs)/profile.tsx`
- `apps/mobile-v2/app/(app)/practice/skills.tsx`
- `apps/mobile-v2/app/(app)/practice/[skill].tsx`
- `apps/mobile-v2/app/(app)/practice/result/[id].tsx`
- `apps/mobile-v2/app/(app)/exam/[id].tsx`
- `apps/mobile-v2/app/(app)/session/[id].tsx`
- `apps/mobile-v2/app/(app)/exam-result/[id].tsx`
- `apps/mobile-v2/app/(app)/_layout.tsx`
- `apps/mobile-v2/src/features/streak/streak-store.ts`
- `apps/mobile-v2/src/features/notification/notification-store.ts`
- `apps/mobile-v2/src/features/coin/coin-store.ts`

---

## Trạng thái verify cuối cùng

Typecheck đã pass:

```powershell
Set-Location apps/mobile-v2
bun run typecheck
```

Nếu tiếp tục code, luôn chạy lại lệnh trên trước khi bàn giao tiếp.
