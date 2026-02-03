# Data Retention & Privacy

> **Phiên bản**: 1.0 · SP26SE145

## Purpose

Chốt retention tối thiểu và nguyên tắc xử lý dữ liệu nhạy cảm (PII, bài viết, audio URL, tokens).

## Scope

- MainDB/GradingDB
- Redis
- Logs

## Decisions

### 1) Data classification

- PII: email, displayName.
- Sensitive content: writing text, speaking audio URL/transcript.
- Security tokens: refresh tokens (hash), access tokens (không lưu).

### 2) Retention (baseline)

- `processed_callbacks`: 7 ngày (đủ cho dedup + replay).
- `submission_events`: 7 ngày (SSE replay/audit tối thiểu).
- Logs: 30 ngày (tùy môi trường).

### 3) Deletion/anonymization

- Khi user yêu cầu xóa: anonymize PII và tách liên kết khỏi submissions (nếu cần giữ thống kê).

## Contracts

- Không lưu refresh token plaintext; chỉ lưu hash.
- Error messages không chứa PII/secrets.

## Failure modes

| Tình huống | Hành vi |
|-----------|---------|
| Retention cleanup chạy sai | Mất khả năng replay SSE / audit ngắn hạn |

## Acceptance criteria

- Có job cleanup theo TTL cho các bảng/event logs.
- Token storage tuân thủ “hash-only”.
