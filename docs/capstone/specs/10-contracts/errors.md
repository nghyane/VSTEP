# Error Format & Codes

> **Phiên bản**: 1.0 · SP26SE145

## Purpose

Chuẩn hóa error response để client/QA/agents xử lý nhất quán, không phụ thuộc vào “message text”.

## Scope

- HTTP APIs của Bun Main App.
- Không áp dụng cho AMQP callback errors (xem `queue-contracts.md`).

## Decisions

### 1) Error envelope (canonical)

```json
{
  "requestId": "<uuid>",
  "error": {
    "code": "<UPPER_SNAKE>",
    "message": "<human readable>",
    "details": {}
  }
}
```

Rules:

- `requestId` phải khớp header `X-Request-Id`.
- `code` ổn định, UPPER_SNAKE (dùng cho logic), không đổi tùy ngôn ngữ.
- `message` dành cho người đọc/log; không được chứa secrets.
- `details` optional, structured (không phải string blob).

### 2) Minimum error codes

| HTTP Status | Code | Mô tả |
|-------------|------|-------|
| 400 | VALIDATION_ERROR | Input không hợp lệ (thiếu field, sai format, ngoài range) |
| 401 | UNAUTHORIZED | Thiếu token hoặc token không hợp lệ |
| 401 | TOKEN_EXPIRED | Access token hết hạn, cần refresh |
| 403 | FORBIDDEN | Không đủ quyền (role không phù hợp hoặc không phải owner) |
| 404 | NOT_FOUND | Resource không tồn tại |
| 409 | CONFLICT | Xung đột dữ liệu / idempotency mismatch |
| 429 | RATE_LIMITED | Vượt rate limit (kèm `Retry-After`) |
| 500 | INTERNAL_ERROR | Lỗi server không mong đợi |

### 3) Validation details

`details` cho validation nên theo shape:

```json
{
  "fields": {
    "fieldName": "reason"
  }
}
```

### 4) Rate limit

- 429 phải có header `Retry-After` (seconds).
- `details` có thể thêm `limit`, `windowSeconds` nếu cần.

## Contracts

- Error responses luôn có `Content-Type: application/json`.
- Error responses luôn có `X-Request-Id` + body `requestId`.

## Failure modes

| Tình huống | Hành vi |
|-----------|---------|
| Unhandled exception | 500 + `INTERNAL_ERROR`, log đầy đủ với `requestId` |
| Provider lỗi upstream | 500/503 (tùy implementation) nhưng vẫn theo envelope |

## Acceptance criteria

- Tất cả endpoints trả error theo envelope trên.
- QA có thể assert theo `error.code` (không phụ thuộc `message`).
