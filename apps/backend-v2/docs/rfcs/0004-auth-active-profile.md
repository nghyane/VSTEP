---
RFC: 0004
Title: Auth, JWT Claims & Active Profile
Status: Draft
Created: 2026-04-18
Updated: 2026-04-18
Superseded by: —
---

# RFC 0004 — Auth, JWT Claims & Active Profile

## Summary

Cụ thể hóa cơ chế auth 4-role (learner/teacher/staff/admin) + active profile context trong JWT + middleware chain cho từng role.

## Motivation

Backend-v2 đã có `jwt-auth` setup với role đơn giản. Cần mở rộng:
1. Learner JWT phải chứa `active_profile_id` để mọi endpoint biết đang thao tác cho profile nào mà không cần query thêm.
2. Switch profile phải reissue JWT, không dùng session.
3. Admin/teacher login không có profile — middleware phải phân biệt.
4. Profile ownership check: bất kỳ endpoint nào nhận `profile_id` trong body/URL phải verify thuộc account.

## Design

### JWT claims

```json
{
  "sub": "<account_id>",
  "role": "learner | teacher | staff | admin",
  "active_profile_id": "<profile_id>",  // null nếu admin/teacher
  "iat": ...,
  "exp": ...,
  "jti": "<token_id>"
}
```

### Login flow

```
POST /auth/login { email, password }
  → verify credentials
  → if role = learner:
      active_profile = profile đầu của account (is_initial_profile=true)
      if không có profile → force create flow
    elif admin/teacher:
      active_profile = null
  → issue access_token (JWT, 15 min) + refresh_token (DB row, 30 days)
  → return { access_token, refresh_token, account, active_profile? }
```

### Switch profile flow

```
POST /auth/switch-profile { profile_id }
  → verify JWT (current access token)
  → verify profile belongs to account (SELECT WHERE account_id = sub AND id = profile_id)
  → 403 nếu không thuộc
  → issue new JWT với active_profile_id mới
  → rotate refresh_token
  → return { access_token, refresh_token, active_profile }
```

Không revoke JWT cũ (short TTL). Client update token storage.

### Register flow

```
POST /auth/register { email, password, nickname, target_level, target_deadline }
  DB transaction:
    → create account (role=learner)
    → create profile (is_initial_profile=true)
    → dispatch ProfileCreated event
  → event listener:
    → create coin_transaction (type=onboarding_bonus, delta=100) — system_configs['onboarding.initial_coins']
  → issue tokens
  → return { access_token, refresh_token, user, profile }
```

### Middleware chain

```
Route::middleware(['auth:api', 'active-profile'])  // learner routes
  → auth:api: verify JWT
  → active-profile: ensure active_profile_id exists + load into request context

Route::middleware(['auth:api', 'role:teacher'])  // teacher routes
Route::middleware(['auth:api', 'role:staff'])    // staff routes
Route::middleware(['auth:api', 'role:admin'])     // admin routes
```

Middleware `active-profile`:
- Đọc `active_profile_id` từ JWT claim
- Nếu null → 401 "profile context missing" (learner phải có active profile)
- Load profile vào `$request->attributes->set('active_profile', $profile)`
- Cache trong request lifecycle

Middleware `role`:
- Đọc `role` từ user model
- Dùng `Role::is()` để check hierarchy: admin (3) > staff (2) > teacher (1) > learner (0)
- Level-based: role có level >= required là pass

### Profile ownership check

Mọi endpoint nhận `profile_id` trong path/body:
- Sử dụng FormRequest `authorize()` hoặc Policy
- Query: `profile.account_id === JWT.sub`

Pattern:
```php
public function authorize(): bool
{
    $profile = Profile::findOrFail($this->profile_id);
    return $profile->account_id === auth()->id();
}
```

### Profile deletion rule

- Không cho xóa profile cuối của account (còn ít nhất 1 để avoid orphan state).
- Nếu xóa active profile → backend auto switch sang profile khác → reissue JWT.

## Role hierarchy

```
admin:
  - mọi quyền (level 3)
  - quản lý users, system configs, exam publish/delete
  - không có profile

staff:
  - quản lý content, courses, scheduling (level 2)
  - không có profile

teacher:
  - xem lịch, xin nghỉ, chấm bài (level 1)
  - không có profile

learner:
  - truy cập learner API (level 0)
  - có 1 hoặc nhiều profile
```

## Security considerations

- JWT access token TTL ngắn (15 min). Refresh token rotation.
- Refresh token store trong DB với `revoked_at`. Rotation: issue new, mark old revoked.
- Rate limit login: 10/phút/IP + 5 fail/30 phút/email.
- Password hash: bcrypt cost 12.
- Email case-insensitive (store lowercase).
- Profile switching không cần password (Netflix-style).
- CORS: chỉ allow FE domain configured.

## Alternatives considered

### Alt 1: Session-based thay JWT
Bỏ. JWT đơn giản, scale tốt, Octane compatible. Session cần Redis, mobile client phức tạp.

### Alt 2: Refresh token trong cookie httpOnly
Phase 2. Phase 1 để client quản lý.

### Alt 3: Không dùng active_profile_id claim, query từ session
Bỏ. Stateless tốt hơn. JWT claim là cách chuẩn.

## Implementation

- [ ] Update `User` model → rename `Account`? Cân nhắc — Laravel convention là `User`. Giữ `User`, doc rõ "User = Account".
- [ ] Create `Profile` model
- [ ] Update `AuthService` với register/switch-profile
- [ ] Create middleware `ActiveProfile`
- [ ] Update `CheckRole` middleware với hierarchy
- [ ] Update `AuthController` endpoints
- [ ] Form requests
- [ ] Tests: register flow, switch profile, role gates, profile ownership
