---
RFC: 0011
Title: Role-Based Features — Teacher, Staff, Admin
Status: Draft
Created: 2025-07-15
Updated: 2025-07-15
---

# RFC 0011 — Role-Based Features — Teacher, Staff, Admin

## Summary

Định nghĩa API endpoints và phân quyền cho 3 role ngoài Learner: Teacher, Staff, Admin. Hiện tại DB schema đã có nhưng chưa có controller/route/policy nào.

## Motivation

- Hệ thống là trung tâm luyện thi, không phải self-service. Staff sắp lịch, Teacher dạy theo lịch.
- Hiện chỉ có Learner-facing APIs. Không có cách nào để vận hành trung tâm qua hệ thống.
- Cần API cho Teacher xem lịch/xin nghỉ, Staff quản lý vận hành, Admin quản lý hệ thống.

## Design

### Phân quyền

Level-based middleware `role:{min_role}`. Request phải có `user.role.level >= required_level`.

```
Route::middleware('role:teacher')  // level >= 1
Route::middleware('role:staff')    // level >= 2
Route::middleware('role:admin')    // level >= 3
```

### Teacher APIs (level >= 1)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/teacher/slots` | Lịch dạy của mình (filter by date range) |
| POST | `/teacher/leave-requests` | Xin nghỉ (date + reason) |
| GET | `/teacher/leave-requests` | Xem request nghỉ của mình |
| GET | `/teacher/bookings` | Danh sách booking học viên |
| PATCH | `/teacher/bookings/{id}` | Cập nhật meet_url, ghi chú |
| GET | `/teacher/grading-queue` | Bài cần chấm (writing/speaking) |
| POST | `/teacher/grading/{submission_id}` | Chấm bài thủ công |
| GET | `/teacher/reviews` | Xem review từ học viên |
| GET | `/teacher/exams` | Xem đề thi published (read-only) |

### Staff APIs (level >= 2)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| **Courses** | | |
| GET | `/staff/courses` | Danh sách khoá học |
| POST | `/staff/courses` | Tạo khoá học |
| PATCH | `/staff/courses/{id}` | Sửa khoá học |
| DELETE | `/staff/courses/{id}` | Xoá khoá học |
| **Scheduling** | | |
| GET | `/staff/slots` | Tất cả slots (filter teacher, date) |
| POST | `/staff/slots` | Tạo slot cho teacher |
| PATCH | `/staff/slots/{id}` | Sửa slot |
| DELETE | `/staff/slots/{id}` | Xoá slot |
| GET | `/staff/leave-requests` | Tất cả request nghỉ |
| PATCH | `/staff/leave-requests/{id}` | Duyệt/từ chối |
| **Exams (draft only)** | | |
| GET | `/staff/exams` | Danh sách đề thi (all statuses) |
| POST | `/staff/exams` | Tạo đề thi (status=draft) |
| PATCH | `/staff/exams/{id}` | Sửa đề thi (chỉ draft) |
| **Content** | | |
| CRUD | `/staff/vocab-topics/*` | Quản lý vocab |
| CRUD | `/staff/grammar-points/*` | Quản lý grammar |
| CRUD | `/staff/practice-*/*` | Quản lý practice content |
| **Operations** | | |
| GET | `/staff/enrollments` | Danh sách enrollment |
| CRUD | `/staff/promo-codes` | Quản lý promo codes |
| POST | `/staff/notifications` | Gửi notification |

### Admin APIs (level >= 3)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/admin/users` | Danh sách users (filter role) |
| POST | `/admin/users` | Tạo user (teacher/staff) |
| PATCH | `/admin/users/{id}` | Sửa user (role, status) |
| DELETE | `/admin/users/{id}` | Xoá user |
| CRUD | `/admin/topup-packages` | Quản lý gói nạp |
| GET | `/admin/topup-orders` | Xem orders |
| PATCH | `/admin/topup-orders/{id}` | Duyệt/từ chối |
| PATCH | `/admin/exams/{id}/publish` | Publish đề thi (draft → published) |
| PATCH | `/admin/exams/{id}/unpublish` | Unpublish đề thi |
| DELETE | `/admin/exams/{id}` | Xoá đề thi |
| CRUD | `/admin/system-configs` | Cấu hình hệ thống |
| GET | `/admin/dashboard` | Thống kê tổng quan |

### DB Changes

- Thêm table `teacher_leave_requests` (id, teacher_id, date, reason, status, reviewed_by, reviewed_at).
- Không thay đổi tables hiện có.

### Middleware mới

```php
// app/Http/Middleware/EnsureRole.php
public function handle($request, Closure $next, string $role): Response
{
    if (! $request->user()->role->is(Role::from($role))) {
        abort(403);
    }
    return $next($request);
}
```

## Alternatives considered

1. **Permission-based (Spatie)** — quá nặng cho 4 roles đơn giản. Level-based đủ dùng.
2. **Tất cả dồn vào Admin** — không scale khi cần phân quyền Staff vs Admin.
3. **Separate apps (admin panel)** — thêm complexity deploy, cùng DB thì dùng chung API hợp lý hơn.

## Implementation

Chia 3 phase theo priority:

### Phase 1 — Core operations (Staff + Admin)
- [ ] Role middleware
- [ ] Staff: CRUD courses, scheduling (slots + leave requests)
- [ ] Admin: CRUD users, system configs
- [ ] Migration: `teacher_leave_requests`

### Phase 2 — Teacher self-service
- [ ] Teacher: xem lịch, xin nghỉ, bookings, meet_url
- [ ] Teacher: grading queue + manual grading

### Phase 3 — Extended operations
- [ ] Staff: content management (vocab, grammar, practice), promo codes, notifications
- [ ] Admin: topup packages/orders, dashboard stats
- [ ] Admin: exam publish/unpublish/delete (approval flow)
