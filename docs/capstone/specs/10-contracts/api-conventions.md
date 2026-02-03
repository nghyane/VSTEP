# API Conventions

> **Phiên bản**: 1.0 · SP26SE145

## Purpose

Chốt các quy ước chung cho HTTP API của Bun Main App để backend là **single source of truth** nhưng vẫn có contract ổn định (FE/QA/agents không phải đoán).

## Scope

- Tất cả REST endpoints dưới base `/api` (trừ `GET /health`).
- SSE endpoint(s) dưới `/api/sse/*` (xem `sse.md`).
- Không chốt danh sách endpoint cụ thể (xem `api-endpoints.md`).

## Decisions

### 1) Content & encoding

- Request/response body: JSON, UTF-8.
- Time format: ISO 8601 UTC (`YYYY-MM-DDTHH:mm:ss.sssZ`).
- ID types: `string` (opaque). Riêng `requestId/eventId/messageId` dùng UUID v4.

### 2) Authentication

- Access token: `Authorization: Bearer <jwt>`.
- Refresh token: gửi trong body cho `/auth/refresh` (baseline).
- RBAC/rotation/device limits: xem `../40-platform/authentication.md`.

### 3) Request correlation

- Client có thể gửi `X-Request-Id: <uuid>`.
- Server luôn trả `X-Request-Id` và (nếu có error) echo trong response body `requestId`.

### 4) Idempotency (HTTP)

Các endpoint tạo side-effect (đặc biệt `POST /submissions`) phải hỗ trợ idempotency:

- Header: `Idempotency-Key: <uuid>`.
- Semantics:
  - Cùng `userId` + cùng `Idempotency-Key` → trả lại cùng response (safe retry).
  - Reuse key nhưng payload khác → `409 CONFLICT` (idempotency mismatch).
- Với writing/speaking submission:
  - `Idempotency-Key` được map thành `requestId` để đi xuyên suốt HTTP → outbox → queue contract.

Chi tiết dữ liệu/constraints: xem `../40-platform/idempotency-concurrency.md`.

### 5) Pagination (list endpoints)

Offset pagination (baseline):

- Query:
  - `page` (int, >= 1, default 1)
  - `limit` (int, 1..100, default 20)
- Response:

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

### 6) Errors

Canonical error envelope + codes: xem `errors.md`.

### 7) OpenAPI (generated)

- Backend generate OpenAPI từ route schemas (code-first).
- Artifact được expose (baseline): `GET /openapi.json`.

## Contracts

- Headers (minimum): `Content-Type`, `Accept`, `Authorization`, `X-Request-Id`, `Idempotency-Key`, `Retry-After` (khi 429).
- List responses luôn có `items` + `pagination`.
- Error responses luôn theo `errors.md`.

## Failure modes

| Tình huống | Hành vi |
|-----------|---------|
| Client retry do timeout | Dùng `Idempotency-Key` để tránh tạo duplicate submission/job |
| Idempotency key reuse với payload khác | 409 + error code `CONFLICT` (details nêu mismatch) |
| Client không gửi `X-Request-Id` | Server tự sinh, vẫn trả về header/body |

## Acceptance criteria

- Tất cả list endpoints trả về `items` + `pagination`.
- Tất cả error responses tuân theo `errors.md` và có `X-Request-Id`.
- `POST /submissions` an toàn khi client retry (idempotent).
