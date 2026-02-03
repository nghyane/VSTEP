# Migrations, Backup & DR

> **Phiên bản**: 1.0 · SP26SE145

## Purpose

Chốt workflow migrations và kế hoạch backup/restore tối thiểu để tránh mất dữ liệu trong triển khai.

## Scope

- MainDB + GradingDB (PostgreSQL)
- Backup/restore procedures
- DR goals (baseline)

## Decisions

### 1) Migrations

- Migrations phải được version hóa trong repo.
- Migrations chạy theo thứ tự, idempotent, có rollback plan (hoặc forward-fix).

### 2) Backups

- Full backup hằng ngày (baseline).
- Retention: 7-30 ngày tùy môi trường.
- Test restore định kỳ (baseline: mỗi sprint).

### 3) DR (baseline)

- RPO/RTO được ghi rõ cho môi trường production khi triển khai thật.

## Contracts

- Có runbook: cách backup + cách restore + cách verify.

## Failure modes

| Tình huống | Hành vi |
|-----------|---------|
| Migration fail giữa chừng | Stop deploy; không chạy app với schema mismatch |
| Restore thành công nhưng app lỗi | Verify schema version + run smoke tests |

## Acceptance criteria

- Có quy trình migrations rõ ràng.
- Có thể restore DB lên môi trường staging và chạy smoke test.
