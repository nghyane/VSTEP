# Authentication & Authorization (JWT)

## Purpose

Chốt cơ chế xác thực cho Main App theo mô hình JWT (access/refresh) để dùng được cho web + mobile, triển khai nhanh, và không phụ thuộc session state ở server.

## JWT Flow (tóm tắt)

- Login: validate credentials → issue access+refresh → enforce max 3 refresh tokens/user (FIFO revoke).
- Access: client gửi Bearer access token; server verify signature + exp + role.
- Refresh: rotate refresh token (old token bị revoke) → cấp cặp token mới.
- Logout: revoke refresh token hiện tại.
- Reuse detection: nếu refresh token đã bị rotate mà vẫn được dùng lại → revoke toàn bộ token family và force re-login.

```mermaid
sequenceDiagram
  participant C as Client
  participant API as Main App
  participant DB as MainDB

  C->>API: login(email,password)
  API->>DB: validate credentials
  API->>DB: issue refresh token record (hash+jti)
  API-->>C: access + refresh

  C->>API: access protected (Bearer access)
  API->>API: verify JWT (sig+exp+role)
  API-->>C: response

  C->>API: refresh(refresh token)
  API->>DB: validate token hash + not revoked
  API->>DB: rotate (revoke old, create new)
  API-->>C: new access + refresh

  C->>API: logout(refresh token)
  API->>DB: revoke refresh token
  API-->>C: ok

  C->>API: refresh(using rotated token)
  API->>DB: detect reuse
  API->>DB: revoke token family
  API-->>C: 401 force re-login
```

## Scope

- Main App (Bun + Elysia): login/register, issue token, refresh, logout, RBAC.
- Token format: JWT (signed), có access token và refresh token.
- OAuth: optional (future), không phải baseline.

## Decisions

### Token model

| Item | Decision |
|------|----------|
| Access token | JWT, short-lived |
| Refresh token | JWT, long-lived |
| Rotation | Refresh token rotate on every refresh |
| Storage | Refresh token phải có record server-side (hash) để revoke + enforce device limit |
| Transport (baseline) | Backend tự quyết định. Khuyến nghị: access token qua `Authorization: Bearer`; refresh token qua body hoặc HttpOnly cookie |

### Claims (tối thiểu)

| Claim | Required | Notes |
|-------|----------|------|
| `sub` | Yes | `userId` |
| `role` | Yes | `learner`/`instructor`/`admin` |
| `jti` | Yes | unique token id (để revoke/rotate) |
| `iat` / `exp` | Yes | issued-at / expiry |

### Device/session limit

- Baseline: tối đa 3 refresh tokens active per user (coi như 3 devices).
- **Counting rule**: Sắp xếp theo `issuedAt`, revoke token có `issuedAt` cũ nhất (FIFO).
- Trigger: Khi login tạo refresh token mới và vượt giới hạn 3.

## Contracts

### API operations (baseline)

Hệ thống phải hỗ trợ các operations sau (paths cụ thể: xem `../10-contracts/api-endpoints.md`):

| Operation | Auth | Output |
|-----------|------|--------|
| Register | Public | user created |
| Login | Public | access token + refresh token |
| Refresh | Refresh token | rotated refresh token + new access token |
| Logout | Refresh token | revoke current refresh token |
| Get current user context | Access token | `userId`, `role` |

### Refresh token store (requirements)

Refresh token phải có store server-side (MainDB hoặc Redis). Baseline khuyến nghị MainDB.

| Field | Purpose |
|------|---------|
| `userId` | owner |
| `jti` | unique id |
| `tokenHash` | hash của refresh token (không lưu plaintext) |
| `issuedAt` / `expiresAt` | lifecycle |
| `revokedAt` | revoke support |
| `replacedByJti` | rotation chain (optional) |
| `deviceId` | device tracking (optional) |

## Failure modes

| Failure | Expected behavior |
|--------|-------------------|
| Access token expired | 401; client calls refresh |
| Refresh token expired | 401; require login |
| Refresh token reuse (rotated token reused) | Revoke **toàn bộ token family của user** (tất cả active refresh tokens của user), force login |
| Token signature invalid | 401 |
| Clock skew | allow small leeway (e.g., 30s) |

## Acceptance criteria

- Login returns access/refresh and access-protected endpoints require Bearer token.
- Refresh rotates refresh token and old refresh token becomes invalid.
- Logout revokes current refresh token.
- Max 3 active refresh tokens per user enforced.
- RBAC gate works for instructor/admin routes.

---

*Document version: 1.2 - Last updated: SP26SE145*
