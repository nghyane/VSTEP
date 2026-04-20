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
