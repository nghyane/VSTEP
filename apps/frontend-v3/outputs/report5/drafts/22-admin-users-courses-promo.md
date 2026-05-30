# 22. Admin Users, Courses, Promo, Top-up Test Cases (15 cases — đã lọc)

**Module:** Admin user management, course management, promo codes, top-up packages  
**Source:** `apps/backend-v2` Admin UserController, CourseController, PromoCodeController, TopupPackageController; `apps/admin` users, courses, promo, topup-packages routes  
**Backend tests:** `Admin/AdminCourseServiceDecompositionTest.php`, `Admin/Topup/AdminTopupPackageTest.php`

## User Management

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| ADM-USR-001 | List users | Admin authenticated | GET `admin/users` | 200, user list with roles, searchable | High |
| ADM-USR-002 | Create user with role | Admin authenticated | POST `admin/users` with email/name/password/role | 201, user created | High |
| ADM-USR-004 | Deactivate user | Active user | POST `admin/users/{id}/deactivate` | 200, user cannot login | Critical |
| ADM-USR-010 | User management is admin-only | Staff user (not admin) | Access admin user routes | 403 | Critical |
| ADM-USR-011 | Frontend user management page | Admin logged in | Open users page | User table, create/edit form, role selector, deactivate actions | High |

## Course Management

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| ADM-CRS-002 | Create course | Admin authenticated | POST `admin/courses` with title/teacher/price/dates | 201 | High |
| ADM-CRS-004 | Publish/unpublish course | Course exists | POST publish/unpublish | Status changes | High |
| ADM-CRS-006 | Manage enrollments | Course exists | GET/POST/DELETE enrollments | Learners added/removed, commitment overridable | High |
| ADM-CRS-008 | Manage bookings (meet_url + cancel/refund) | Bookings exist | PATCH meet_url, POST cancel with refund | Refund processed | High |
| ADM-CRS-009 | Frontend course detail with tabs | Admin logged in | Open course detail | Schedule items, enrollments, slots, bookings tabs | High |

## Promo & Top-up

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| ADM-PROMO-001 | List promo codes | Admin authenticated | GET `admin/promo-codes` | 200, promo list with usage/status | High |
| ADM-PROMO-002 | Create promo code | Admin authenticated | POST with code/coins/valid_until/usage_limit | 201 | High |
| ADM-PROMO-005 | Frontend promo code page | Admin logged in | Open promo section | Promo list, create/edit form | High |
| ADM-TOPUP-001 | List top-up packages | Admin authenticated | GET `admin/topup-packages` | 200, package list with status | High |
| ADM-TOPUP-002 | Create top-up package | Admin authenticated | POST with label/price/coins/bonus/order | 201 | High |
| ADM-TOPUP-005 | Frontend top-up packages page | Admin logged in | Open top-up packages | List, create/edit form, activate/deactivate | High |
