---
RFC: 0012
Title: Migrate SRS from SM-2 to FSRS
Status: Implemented
Created: 2025-04-21
Updated: 2025-04-21
Superseded by:
---

# RFC 0012 — Migrate SRS from SM-2 to FSRS

## Summary

Thay thế Anki SM-2 variant scheduler bằng FSRS (Free Spaced Repetition Scheduler) v6 cho vocab SRS. FSRS chính xác hơn ~30% trong dự đoán khả năng nhớ, state đơn giản hơn (2 fields thay vì 8), không có learning steps phức tạp.

## Motivation

**SM-2 hiện tại:**
- State phức tạp: `kind`, `ease_factor`, `interval_days`, `remaining_steps`, `lapses`, `review_interval_days`, `review_ease_factor`, `due_at`
- 4 state kinds (new, learning, review, relearning) với transitions phức tạp
- Learning steps (1min, 10min) giữ user trong session dài
- Ease factor drift — cards dễ bị "ease hell"
- Không tính được retrievability (xác suất nhớ)

**FSRS giải quyết:**
- State chỉ 2 fields: `difficulty` (1-10), `stability` (days)
- Tính được `retrievability` = xác suất nhớ tại thời điểm bất kỳ
- Không learning steps — mỗi review tính interval ngay
- Difficulty mean reversion — tránh drift
- Backed by academic papers, benchmark vượt SM-2

## Design

### State model

```
SM-2 (hiện tại):
  state_kind: enum (new, learning, review, relearning)
  remaining_steps: int | null
  interval_days: int | null
  ease_factor: float | null
  lapses: int
  review_interval_days: int | null
  review_ease_factor: float | null
  due_at: timestamp

FSRS (mới):
  difficulty: float (1-10, default 0 = new)
  stability: float (days, default 0 = new)
  lapses: int
  due_at: timestamp
  last_review_at: timestamp
```

### Algorithm (port từ ts-fsrs v6)

Core formulas:

```
// Initial difficulty
D0(G) = w4 - exp((G-1) * w5) + 1, clamped [1, 10]

// Initial stability
S0(G) = w[G-1], G ∈ {1,2,3,4}

// Retrievability (forgetting curve)
R(t, S) = (1 + FACTOR * t / (9 * S))^DECAY

// Next difficulty
D'(D, G) = w7 * D0(4) + (1 - w7) * (D + linear_damping(-w6*(G-3), D))

// Next stability after recall (G ≥ 2)
S'_r(D, S, R, G) = S * (exp(w8) * (11-D) * S^(-w9) * (exp(w10*(1-R))-1) * penalties + 1)

// Next stability after forget (G = 1)
S'_f(D, S, R) = w11 * D^(-w12) * ((S+1)^w13 - 1) * exp(w14*(1-R))

// Next interval
I(S) = round(S * interval_modifier), clamped [1, max_interval]
```

Parameters: 19 weights `w[0..18]`, default from FSRS v6.

### PHP implementation

```
app/Srs/FsrsScheduler.php    — replaces SrsScheduler.php
app/Srs/FsrsState.php        — replaces SrsCardState.php (2 fields)
app/Srs/FsrsConfig.php       — replaces SrsConfig.php (19 weights + settings)
```

Pure functions, no storage. Service layer persists.

### DB migration

```sql
ALTER TABLE profile_vocab_srs_states
  DROP COLUMN state_kind,
  DROP COLUMN remaining_steps,
  DROP COLUMN interval_days,
  DROP COLUMN ease_factor,
  DROP COLUMN review_interval_days,
  DROP COLUMN review_ease_factor,
  ADD COLUMN difficulty DOUBLE DEFAULT 0,
  ADD COLUMN stability DOUBLE DEFAULT 0,
  ADD COLUMN last_review_at TIMESTAMP NULL;
```

Giữ: `profile_id`, `word_id`, `due_at`, `lapses`.

### Data migration

Existing SM-2 states → FSRS:
- `new` → difficulty=0, stability=0 (treated as new)
- `learning/relearning` → difficulty=5.0, stability=0.5 (short-term)
- `review` → difficulty from ease_factor mapping, stability from interval_days

```php
// ease_factor 2.5 → difficulty ~5.0, ease_factor 1.3 → difficulty ~8.5
$difficulty = clamp(11 - $easeFactor * 4, 1, 10);
$stability = max($intervalDays, 0.1);
```

### API changes

**SRS Queue response:**

```
SM-2: { new_count, learning_count, review_count, items: [{word, state}] }
FSRS: { new_count, review_count, items: [{word, state}] }
```

Bỏ `learning_count` — FSRS không có learning state.

**State in response:**

```
SM-2: { kind: "review", ... }
FSRS: { difficulty: 5.2, stability: 14.3, retrievability: 0.87 }
```

### Frontend changes

Types:
```ts
// SM-2
interface SrsState { kind: "new" | "learning" | "review" | "relearning" }

// FSRS
interface FsrsState { difficulty: number; stability: number; retrievability: number }
```

UI:
- SrsHero: bỏ `learning_count`, hiện `new_count + review_count`
- WordList badges: thay 4 state labels bằng retrievability % hoặc bar
- SrsRatingButtons: giữ nguyên 4 buttons
- FlashcardCard: giữ nguyên
- useFlashcardSession: giữ nguyên (re-queue Again vẫn hoạt động)

## Alternatives considered

1. **Giữ SM-2** — hoạt động nhưng kém chính xác, state phức tạp, ease hell.
2. **FSRS via Rust PHP extension** — chính xác nhất nhưng cần compile Rust, phức tạp deploy.
3. **FSRS v5** — đơn giản hơn v6 nhưng thiếu short-term stability, kém chính xác.

Chọn: **FSRS v6 pure PHP port** — cân bằng chính xác + đơn giản deploy.

## Implementation

- [x] `FsrsConfig.php` — 19 weights + settings
- [x] `FsrsState.php` — value object (difficulty, stability)
- [x] `FsrsScheduler.php` — port algorithm từ ts-fsrs
- [x] DB migration — alter `profile_vocab_srs_states`
- [ ] Data migration — convert SM-2 → FSRS states
- [x] Update `VocabService` — dùng FsrsScheduler
- [x] Update `VocabController` — response shape
- [ ] Frontend types — `SrsState` → `FsrsState`
- [ ] Frontend components — retrievability display
- [x] Tests — scheduler unit tests
