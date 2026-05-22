# Design Decisions

Ghi lại các quyết định thiết kế quan trọng, lý do chọn, và trade-off. Dùng để tham khảo khi trình bày đồ án.

---

## 1. Level-based Role thay vì Permission-based (Spatie)

**Quyết định:** 4 roles với level tuyến tính: Learner (0) → Teacher (1) → Staff (2) → Admin (3). Phân quyền bằng `role.level >= required_level`.

**Lý do:**
- Chỉ 4 roles, quyền tuyến tính — role cao hơn kế thừa toàn bộ quyền role thấp hơn.
- Spatie Permission thêm 5 tables (`roles`, `permissions`, `model_has_roles`, `model_has_permissions`, `role_has_permissions`) + dependency cho bài toán đơn giản.
- Middleware chỉ cần 1 dòng: `$user->role->is(Role::Staff)`.

**Trade-off:**
- Không hỗ trợ fine-grained permission (VD: Staff A quản lý course, Staff B quản lý exam). Hiện tại chưa cần — trung tâm nhỏ, Staff làm hết.
- Nếu scale lên cần phân quyền chi tiết → migrate sang Spatie hoặc thêm permission layer.

---

## 2. Polymorphic source_type trên coin_transactions

**Quyết định:** `coin_transactions` dùng `source_type` (string) + `source_id` (string) thay vì FK trực tiếp đến từng bảng nguồn.

**Lý do:**
- `coin_transactions` là append-only ledger — chỉ INSERT, không UPDATE/DELETE.
- Nguồn giao dịch đa dạng và mở rộng: topup, promo, enrollment, onboarding bonus, support level... Thêm FK cho mỗi loại → bảng phình cột nullable.
- Coin là virtual currency cho luyện thi, không phải tiền thật/accounting chính thức.
- Laravel hỗ trợ morphTo/morphMany native.

**Biện pháp bù:**
- `CoinSourceType` enum whitelist các source hợp lệ — model không nằm trong map sẽ throw `InvalidArgumentException` ngay lập tức.
- Index composite `(source_type, source_id)` để query hiệu quả.
- Không hard delete record nguồn khi đã có transaction reference.

**Trade-off:**
- Không có FK constraint ở DB level → referential integrity phụ thuộc application layer.
- Nếu là hệ thống tài chính thật → nên dùng FK hoặc thêm domain layer trung gian có DB-enforced integrity.

---

## 3. Exam Approval Flow — Staff soạn, Admin duyệt

**Quyết định:** Staff tạo/sửa đề thi (status=draft). Chỉ Admin được publish, unpublish, xoá đề.

**Lý do:**
- Đề thi là tài sản cốt lõi — publish sai ảnh hưởng trực tiếp điểm số và trải nghiệm học viên.
- Tách quyền soạn/publish giảm rủi ro, mô phỏng quy trình trung tâm thực tế (content team soạn → quản lý duyệt).
- Không phức tạp hơn nhiều — chỉ thêm field `status` + 1 endpoint Admin approve.

**Alternatives:**
- Staff tự publish: đơn giản hơn nhưng thiếu kiểm soát.
- Chỉ Admin làm hết: block Staff khỏi workflow soạn content hàng ngày, tạo bottleneck.

---

## 4. Teacher chỉ xem đề, không soạn/sửa

**Quyết định:** Teacher có quyền xem đề thi published (read-only). Không có quyền tạo, sửa, hay đề xuất đề trong hệ thống.

**Lý do:**
- Trung tâm quản lý tập trung — content do Staff chịu trách nhiệm, rõ ràng ai làm gì.
- Teacher focus vào dạy + chấm bài, không bị phân tán.
- Nếu Teacher muốn góp ý đề → trao đổi trực tiếp với Staff, không cần flow trong hệ thống (YAGNI).

---

## 5. Hard delete + CASCADE, không soft deletes

**Quyết định:** Toàn bộ hệ thống dùng hard delete với CASCADE foreign key. Không dùng `SoftDeletes`.

**Lý do:**
- Soft deletes thêm complexity: mọi query phải filter `deleted_at IS NULL`, unique constraints phải include `deleted_at`, restore logic phức tạp.
- Dữ liệu quan trọng (coin_transactions, grading results) là append-only — không xoá được.
- Dữ liệu có thể xoá (draft exam, practice session) thì xoá thật, không cần giữ lại.
- CASCADE đảm bảo không orphan records.

**Trade-off:**
- Không thể "undo" delete. Chấp nhận được vì admin action có confirm, và dữ liệu critical không cho phép xoá.

---

## 6. Course commitment đơn 1-mốc, không cooldown (2026-05)

**Quyết định:** Commitment chỉ có 1 mốc duy nhất — `deadline = enrolled_at + commitment_window_days`. Bỏ field `exam_cooldown_days`. Default seed: 3 full-test trong 5 ngày.

**Lý do:**
- Cơ chế cũ (cooldown 3 ngày + window 14 ngày) tạo ra 2 mốc thời gian phải giải thích cho học viên — phức tạp không cần thiết.
- Mục đích thực: ép học viên làm 3 bài full-test EARLY để baseline trình độ → giảng viên mới cá nhân hoá lộ trình. Window 14 ngày là quá dài cho mục đích baseline; thực tế học viên kỷ luật hoàn thành trong 3-5 ngày đầu.
- "Cooldown ân hạn" không có ý nghĩa với baseline — bài thi đầu tiên càng sớm càng tốt.
- Bug: với cooldown=3 + window=14, deadline có thể vượt `course.end_date` nếu enroll gần cuối khóa → cam kết kéo dài quá khóa, vô lý.

**Hệ quả:**
- 1 field `commitment_window_days` thay vì 2 → seeder/migration/UI text đơn giản hơn.
- Không cần clamp deadline theo `course.end_date` (trong window 5 ngày, hiếm khi vượt khóa).
- FE copy: "Cam kết X bài thi trong Y ngày" hiển thị đúng tự động qua `course.commitment_window_days`.

**Trade-off:**
- Mất khả năng "ân hạn 1-2 ngày đầu chưa đếm bài". Nếu sau này cần khoá dài có buổi orientation đầu, có thể thêm lại field — nhưng YAGNI.
- Học viên enroll quá trễ (sát end_date) vẫn có 5 ngày deadline; có thể vượt end_date trong edge case này, chấp nhận.

**Migration:** [`2026_05_01_000001_drop_exam_cooldown_days_from_courses.php`](../database/migrations/2026_05_01_000001_drop_exam_cooldown_days_from_courses.php).


---

## 7. User soft-deactivate qua `deactivated_at`, không hard delete (2026-05)

**Quyết định:** `users` thêm cột `deactivated_at` (nullable timestamp). Không có endpoint DELETE user. Admin chỉ active/deactivate. Teacher có khoá active phải reassign trước khi deactivate.

**Lý do:**
- Hard delete user → CASCADE qua profiles → mất lịch sử bài thi, ghi danh, giao dịch xu, audit trail. Vi phạm yêu cầu pháp lý nội bộ (lưu hồ sơ tối thiểu 5 năm cho chứng chỉ).
- Soft deactivate giữ data nghiệp vụ nguyên, chỉ block đăng nhập — đủ cho mọi use case admin cần ("đuổi" nhân viên, khoá tài khoản học viên vi phạm).
- Khác với policy chung "hard delete + CASCADE" (mục #5) vì user là entity ở đầu cascade chain — xoá user kéo theo quá nhiều dữ liệu giá trị cao.

**Hệ quả:**
- AuthService check `deactivated_at` ở login (email/Google) + refresh → block ngay khi user bị khoá, không chờ JWT TTL.
- Picker endpoints (`/admin/users/teachers`, `/admin/profiles/search`) filter `deactivated_at IS NULL`.
- Email/role bất biến sau create — đảm bảo identity không drift, role escalation chỉ qua DB seed.

**Migration:** [`2026_05_22_000002_add_deactivated_at_to_users.php`](../database/migrations/2026_05_22_000002_add_deactivated_at_to_users.php).

---

## 8. Promo code: là `is_active` + RFC role:admin (2026-05)

**Quyết định:** Promo codes không có endpoint DELETE. Chỉ toggle `is_active` (đã có sẵn trong schema). Đặt dưới `role:admin` thay vì `role:staff` như RFC 0011 dự kiến ban đầu.

**Lý do:**
- Promo code đụng tới wallet (cấp xu cho user). Sai sót dễ gây loss tiền thật → admin-only an toàn hơn staff.
- Đã có user redeem mã → BE block đổi `code` text (identity). Các field khác (quota, expires, is_active) vẫn cho phép sửa để admin gia hạn campaign hoặc giảm quota khẩn cấp.
- Hard delete promo có redemption → orphan rows ở `promo_code_redemptions` (FK restrictOnDelete) → migrate phức tạp. `is_active=false` đạt được hiệu ứng tương tự (mã không dùng được nữa) mà giữ audit.
- RFC 0011 đã update reflect quyết định này.

**Hệ quả:**
- `generateUniqueCode` dùng alphabet không gây nhầm (loại 0/O, 1/I/L) — voucher in giấy dễ đọc.
- Filter list 3 trạng thái: active / inactive / expired (derived từ `is_active` + `expires_at`).
