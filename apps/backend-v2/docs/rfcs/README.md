# RFCs

| # | Title | Status | Updated |
|---|-------|--------|---------|
| 0001 | [Domain Map & Bounded Contexts](./0001-domain-map.md) | Accepted | 2025-07-15 |
| 0002 | [Database Schema Draft](./0002-schema-draft.md) | Implemented | 2026-04-18 |
| 0003 | [API Surface & Contract](./0003-api-contract.md) | Accepted | 2025-07-15 |
| 0004 | [Auth, JWT Claims & Active Profile](./0004-auth-active-profile.md) | Implemented | 2025-07-15 |
| 0005 | [Grading Pipeline](./0005-grading-pipeline.md) | Implemented | 2026-04-18 |
| 0006 | [Migration Plan & Implementation Phases](./0006-migration-plan.md) | Implemented | 2025-07-15 |
| 0007 | [AI Grading Pipeline — Layer Architecture](./0007-grading-layers.md) | Accepted | 2026-04-18 |
| 0011 | [Role-Based Features — Teacher, Staff, Admin](./0011-role-based-features.md) | Draft | 2025-07-15 |
| 0012 | [Migrate SRS from SM-2 to FSRS](./0012-fsrs-migration.md) | Implemented | 2025-04-21 |
| 0013 | [Admin Panel with Filament PHP](./0013-admin-filament.md) | Withdrawn | 2026-04-22 |
| 0014 | [Admin Panel — Umi + Ant Design Pro](./0014-admin-panel-umi.md) | Accepted | 2026-04-22 |
| 0017 | [Grading Event System](./0017-grading-events.md) | Proposed | 2026-04-23 |
| 0018 | [Exam Submission — Complete Scoring Flow](./0018-exam-submission-scoring.md) | Draft | 2026-04-23 |
| 0019 | [Profile Relationships, Activity Tracking & UX Gaps](./0019-profile-relationships-activity-tracking.md) | Accepted | 2026-04-23 |

## Implement order

```
0001 (domain map)
  → 0002 (schema draft)
  → 0003 (API contract)
  → 0004 (auth + active profile)
  → 0005 (grading pipeline)
  → 0006 (migration plan)
```

RFC 0006 là roadmap implement thực tế. Các RFC 0001-0005 là reference design, không cần đọc tuần tự khi implement.
