# FSRS Migration

## Quyết định

Chuyển từ Anki SM-2 variant sang FSRS v6 (Free Spaced Repetition Scheduler).
RFC: `docs/rfcs/0012-fsrs-migration.md`

## State model

SM-2 (cũ): 8 fields — kind, ease_factor, interval_days, remaining_steps, lapses, review_*, due_at
FSRS (mới): 4 fields — difficulty (1-10), stability (days), lapses, retrievability (computed)

## Frontend impact

- `FsrsState { difficulty, stability, retrievability, lapses }` thay `SrsState { kind }`
- Không có `learning_count` — FSRS không có learning state
- New word: `stability === 0`
- Retrievability %: xanh ≥90%, vàng ≥70%, đỏ <70%
- 4 rating buttons giữ nguyên (Again/Hard/Good/Easy)

## Backend

- `FsrsScheduler.php` — pure PHP port từ ts-fsrs v6
- `FsrsState.php` — value object (difficulty, stability)
- `FsrsConfig.php` — 21 weights
- `VocabService` dùng FsrsScheduler

---
See also: [[api-conventions]] · [[state-patterns]]
