# Decision Record — Application Boundaries

## Mục đích

Ghi lại ranh giới app đang active và app đã deprecated để tránh agent/developer sửa nhầm code cũ hoặc dùng app cũ làm nguồn sự thật cho báo cáo/bảo vệ.

## Quyết định

### 1. Active apps

Các app đang phát triển chính:

```text
apps/backend-v2/   REST API, assessment, domain logic
apps/frontend-v3/  learner web app
apps/admin/        staff/admin portal
apps/mobile-v2/    mobile app hiện tại
```

Khi làm feature hoặc bugfix, chỉ sửa app liên quan đến yêu cầu hiện tại. Không import code trực tiếp giữa các app.

### 2. Deprecated apps

Các app cũ được chuyển vào:

```text
apps/_deprecated/
```

Bao gồm:

```text
frontend/
frontend-v2/
mobile/
mockup/
nlp-sidecar/
backend-v1/
grading-python/
```

Các app này chỉ dùng để tham khảo lịch sử/spec cũ khi cần. Không sửa trừ khi user yêu cầu rõ.

### 3. Nguồn thiết kế cho frontend-v3

`apps/mockup/` không còn là source of truth active. Frontend-v3 dùng design tokens trong:

```text
apps/frontend-v3/src/styles.css
apps/frontend-v3/src/lib/tokens.ts
```

Asset cũ từ FE-v2 nếu còn cần tham khảo phải trỏ qua `apps/_deprecated/frontend-v2/`.

## Lý do

- Giảm nhiễu khi review và bảo vệ đồ án.
- Tránh sửa nhầm legacy code không còn chạy production/demo.
- Làm rõ app nào là nguồn sự thật hiện tại.

## Cách trình bày khi bảo vệ

Nên nói:

```text
Repo giữ lại app cũ trong _deprecated để truy vết lịch sử, nhưng demo và phát triển hiện tại dùng backend-v2, frontend-v3, admin và mobile-v2.
```

Không nên nói:

```text
Tất cả app trong repository đều là app đang phát triển song song.
```
