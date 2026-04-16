# Anki SRS Algorithm Reference

Reference cho VSTEP project. Phân tích từ source code chính thức:
https://github.com/ankitects/anki (`rslib/src/scheduler/states/`)

License: GNU AGPL v3 (https://www.gnu.org/licenses/agpl.html)

---

## 1. Card States

Source: `rslib/src/scheduler/states/normal.rs`

```
NormalState:
  New         -- chưa từng thấy
  Learning    -- đang qua các bước học (intraday)
  Review      -- đã tốt nghiệp, interval >= 1 ngày
  Relearning  -- đã quên (lapse), đang học lại
```

### Lifecycle

```
New --[any rating]--> Learning --[Good qua hết steps]--> Review
                                  ^                        |
                                  |                        | [Again = lapse]
                                  |                        v
                                  +------- Relearning <----+
                                    [Good qua hết relearn steps]
```

---

## 2. Card State Structs

Source: `rslib/src/scheduler/states/learning.rs`, `review.rs`, `relearning.rs`

### LearnState
```rust
pub struct LearnState {
    pub remaining_steps: u32,    // số step còn lại
    pub scheduled_secs: u32,     // delay tính bằng giây
    pub elapsed_secs: u32,       // thời gian đã trôi qua
}
```

### ReviewState
```rust
pub struct ReviewState {
    pub scheduled_days: u32,     // interval tính bằng ngày
    pub elapsed_days: u32,       // số ngày đã trôi qua
    pub ease_factor: f32,        // hệ số dễ (mặc định 2.5)
    pub lapses: u32,             // số lần quên
    pub leeched: bool,           // đánh dấu leech
}
```

### RelearnState
```rust
pub struct RelearnState {
    pub learning: LearnState,    // trạng thái learning hiện tại
    pub review: ReviewState,     // trạng thái review gốc (giữ lại để quay về)
}
```

---

## 3. Default Config

Source: `rslib/src/scheduler/states/mod.rs` → `StateContext::defaults_for_testing()`

| Parameter | Default | Mô tả |
|-----------|---------|-------|
| `steps` (learning) | `[1.0, 10.0]` phút | Các bước học cho card mới |
| `relearn_steps` | `[10.0]` phút | Các bước học lại cho card đã quên |
| `graduating_interval_good` | `1` ngày | Interval khi tốt nghiệp bằng Good |
| `graduating_interval_easy` | `4` ngày | Interval khi tốt nghiệp bằng Easy |
| `initial_ease_factor` | `2.5` | Ease factor ban đầu |
| `hard_multiplier` | `1.2` | Hệ số nhân cho Hard |
| `easy_multiplier` | `1.3` | Hệ số nhân cho Easy |
| `interval_multiplier` | `1.0` | Hệ số nhân toàn cục cho interval |
| `maximum_review_interval` | `36500` ngày (~100 năm) | Interval tối đa |
| `lapse_multiplier` | `0.0` | Hệ số nhân interval khi lapse |
| `minimum_lapse_interval` | `1` ngày | Interval tối thiểu khi lapse |
| `leech_threshold` | `8` | Số lần lapse để đánh dấu leech |

### Ease Factor Constants

Source: `rslib/src/scheduler/states/review.rs`

```rust
pub const INITIAL_EASE_FACTOR: f32 = 2.5;
pub const MINIMUM_EASE_FACTOR: f32 = 1.3;
pub const EASE_FACTOR_AGAIN_DELTA: f32 = -0.2;
pub const EASE_FACTOR_HARD_DELTA: f32 = -0.15;
pub const EASE_FACTOR_EASY_DELTA: f32 = 0.15;
```

---

## 4. Learning Steps

Source: `rslib/src/scheduler/states/steps.rs`

Steps lưu dưới dạng phút. `remaining_steps` đếm ngược từ cuối mảng.

```
steps = [1, 10]  (phút)

remaining=2 → index 0 → step 1 phút
remaining=1 → index 1 → step 10 phút
remaining=0 → hết step → tốt nghiệp
```

### Tính delay cho từng rating:

**Again**: Luôn trả về step đầu tiên (`steps[0]`)
```rust
fn again_delay_secs_learn(&self) -> Option<u32> {
    self.secs_at_index(0)  // 1 phút = 60 giây
}
```

**Hard** (trường hợp đặc biệt cho step đầu):
```
Nếu đang ở step đầu (index 0):
  - Nếu có step tiếp: trung bình(step[0], step[1]) = (1+10)/2 = 5.5 phút ≈ 330 giây
  - Nếu chỉ có 1 step: step[0] * 1.5, nhưng tối đa thêm 1 ngày
Nếu ở step khác: lặp lại step hiện tại
```

**Good**: Tiến sang step tiếp theo. Nếu hết step → tốt nghiệp.
```rust
fn remaining_for_good(self, remaining: u32) -> u32 {
    let idx = self.get_index(remaining);
    self.steps.len().saturating_sub(idx + 1) as u32
}
```

---

## 5. Learning Card Transitions

Source: `rslib/src/scheduler/states/learning.rs`

### New Card
Source: `rslib/src/scheduler/states/normal.rs` dòng 42-56

New card được xử lý như một learning card đã fail:
```rust
NormalState::New(_) => {
    let next_states = LearnState {
        remaining_steps: ctx.steps.remaining_for_failed(),  // = len(steps)
        scheduled_secs: 0,
        elapsed_secs: 0,
    }.next_states(ctx);
}
```

### Learning → Rating Transitions

| Rating | Hành vi | Ví dụ (steps=[1,10]) |
|--------|---------|---------------------|
| Again | Reset về step đầu, `remaining = len(steps)` | 1 phút |
| Hard | Ở lại step hiện tại (delay đặc biệt) | ~5.5 phút (nếu ở step 0) |
| Good | Tiến sang step tiếp, hoặc tốt nghiệp | 10 phút, rồi 1 ngày |
| Easy | Tốt nghiệp ngay với `graduating_interval_easy` | 4 ngày |

### Tốt nghiệp (Graduation)
Khi Good và hết step:
```rust
ReviewState {
    scheduled_days: ctx.graduating_interval_good,  // 1 ngày
    ease_factor: ctx.initial_ease_factor,           // 2.5
}
```

Khi Easy (bất kỳ lúc nào):
```rust
ReviewState {
    scheduled_days: ctx.graduating_interval_easy,  // 4 ngày
    ease_factor: ctx.initial_ease_factor,           // 2.5
}
```

---

## 6. Review Card Transitions

Source: `rslib/src/scheduler/states/review.rs`

### Interval Calculation (non-early review)

Source: `passing_nonearly_review_intervals()`

```rust
let current_interval = self.scheduled_days.max(1);
let days_late = self.days_late().max(0);

// Hard
hard_interval = current_interval * hard_multiplier;  // * 1.2
hard_minimum  = current_interval + 1;  // (khi hard_multiplier > 1)

// Good
good_interval = (current_interval + days_late / 2) * ease_factor;
good_minimum  = hard_interval + 1;

// Easy
easy_interval = (current_interval + days_late) * ease_factor * easy_multiplier;
easy_minimum  = good_interval + 1;
```

Tất cả interval được áp dụng:
1. `interval_multiplier` (mặc định 1.0)
2. Fuzz
3. Clamp vào `[minimum, maximum_review_interval]`

### Ease Factor Changes

| Rating | Ease change | Ví dụ (ease=2.5) |
|--------|-------------|-------------------|
| Again | ease - 0.20 (min 1.3) | 2.5 → 2.3 |
| Hard | ease - 0.15 (min 1.3) | 2.5 → 2.35 |
| Good | không đổi | 2.5 |
| Easy | ease + 0.15 | 2.5 → 2.65 |

### Again (Lapse)

```rust
fn answer_again(self, ctx: &StateContext) -> CardState {
    let lapses = self.lapses + 1;
    // Tính interval mới cho review state
    let failing_interval = scheduled_days * lapse_multiplier;  // 0.0 → interval = min_lapse_interval
    
    // Nếu có relearn_steps → vào Relearning
    if relearn_steps.len() > 0 {
        RelearnState {
            learning: LearnState { scheduled_secs: relearn_steps[0] * 60 },
            review: ReviewState { scheduled_days: failing_interval, ease: ease - 0.20 },
        }
    } else {
        // Không có relearn steps → ở lại Review với interval giảm
        ReviewState { scheduled_days: failing_interval, ease: ease - 0.20 }
    }
}
```

---

## 7. Relearning Card Transitions

Source: `rslib/src/scheduler/states/relearning.rs`

Relearning giống Learning, nhưng:
- Dùng `relearn_steps` thay vì `steps`
- Khi tốt nghiệp, quay lại Review (không phải tạo mới)
- Easy: `review.scheduled_days + 1`

| Rating | Hành vi |
|--------|---------|
| Again | Reset về relearn step đầu |
| Hard | Lặp lại step hiện tại |
| Good | Tiến step hoặc quay lại Review với interval đã giảm |
| Easy | Quay lại Review với `interval + 1` ngày |

---

## 8. Fuzz Factor

Source: `rslib/src/scheduler/states/fuzz.rs`

Interval >= 2.5 ngày được thêm random fuzz để tránh các card luôn due cùng ngày.

### Fuzz Ranges
```rust
static FUZZ_RANGES: [FuzzRange; 3] = [
    { start: 2.5,  end: 7.0,       factor: 0.15 },
    { start: 7.0,  end: 20.0,      factor: 0.1  },
    { start: 20.0, end: f32::MAX,  factor: 0.05 },
];
```

### Fuzz Delta Calculation
```
fuzz_delta(interval):
  if interval < 2.5: return 0 (không fuzz)
  delta = 1.0  (base)
  + 0.15 * min(interval, 7) - 2.5).max(0)     // range 2.5-7
  + 0.10 * (min(interval, 20) - 7).max(0)      // range 7-20
  + 0.05 * (interval - 20).max(0)              // range 20+
```

### Ví dụ:
```
interval=2.49  → delta=0    → range [2, 2]
interval=7     → delta=1.68 → range [5, 9]
interval=17    → delta=2.68 → range [14, 20]
interval=37    → delta=3.53 → range [33, 41]
```

Fuzz factor (0.0-1.0) chọn ngẫu nhiên trong range `[lower, upper]`:
```rust
result = lower + fuzz_factor * (1 + upper - lower)
```

---

## 9. UI Flow (Study Screen)

Source: `rslib/src/scheduler/answering/mod.rs`, Anki docs

### Deck Overview
Hiển thị 3 số:
- **New** (xanh dương): card chưa từng thấy
- **Learn** (cam): card đang trong learning/relearning steps
- **Review** (xanh lá): card đã tốt nghiệp, đến hạn ôn

Nút "Study Now" để bắt đầu.

### Study Screen
1. Hiển thị **mặt trước** (câu hỏi)
2. Nút **"Show Answer"** (Space/Enter)
3. Hiển thị **mặt sau** (đáp án) — mặt trước vẫn hiện
4. **4 nút rating**, mỗi nút hiển thị thời gian ôn tiếp theo:
   - Again (1): thời gian ngắn (phút)
   - Hard (2)
   - Good (3): Space/Enter mặc định
   - Easy (4): thời gian dài nhất

### Answer Button Time Labels

Source: `rslib/src/scheduler/timespan.rs`

Format: `30s`, `1m`, `10m`, `1h`, `1d`, `1.5mo`, `1y`

### Keyboard Shortcuts
- Space / Enter: Show Answer → Good
- 1: Again
- 2: Hard
- 3: Good
- 4: Easy

### Congratulations Screen
Khi hết card due → hiện "Congratulations! You have finished this deck for now."

---

## 10. Card Lifecycle Test

Source: `rslib/src/scheduler/answering/mod.rs` → `state_application()` test

Minh họa đầy đủ vòng đời card:

```
1. New card → answer Again → Learning (remaining_steps=2)
2. Learning  → answer Good → Learning (remaining_steps=1, step 10m)
3. Learning  → answer Good → Review (interval=1 ngày, tốt nghiệp)
4. Review    → answer Easy → Review (interval=4 ngày, ease=2.65)
5. Review    → answer Again → Relearning (interval=1, ease=2.45, lapses=1)
6. Relearning → answer Again → Relearning (lặp lại step, lapses giữ nguyên)
7. Relearning → answer Good → Review (interval=1 ngày, re-graduated)
```

Assertions từ test:
```
Step 1: card.queue=Learn, remaining_steps=2
Step 2: card.queue=Learn, remaining_steps=1
Step 3: card.queue=Review, interval=1
Step 4: card.queue=Review, interval=4, ease_factor=2650 (stored as int * 1000)
Step 5: card.queue=Learn, card.type=Relearn, interval=1, ease_factor=2450, lapses=1
Step 7: card.queue=Review, interval=1
```

---

## 11. Mapping với VSTEP Implementation

| Anki (Rust) | VSTEP (`srs.ts`) | Ghi chú |
|-------------|-------------------|---------|
| `NormalState::New` | `status: "new"` | Chưa có CardState |
| `NormalState::Learning` | `status: "learning"` | `remainingSteps` = remaining |
| `NormalState::Review` | `status: "review"` | `interval` = days |
| `NormalState::Relearning` | `status: "relearning"` | Composite state |
| `scheduled_secs` | `dueAt` (ms timestamp) | VSTEP dùng absolute timestamp |
| `scheduled_days` | `interval` (days) | |
| `ease_factor` | `ease` | Cùng float |
| `remaining_steps` | `remainingSteps` | Đếm ngược |
| `lapses` | `lapses` | |
| Fuzz factor | Chưa implement | VSTEP hiện không fuzz |
| FSRS | Chưa implement | Chỉ dùng SM-2 |
| Leech detection | Chưa implement | |
| Filtered decks | Không cần | VSTEP dùng topic thay deck |

---

## 12. Những gì VSTEP chưa implement (so với Anki)

1. **Fuzz factor**: Random jitter cho interval để tránh card due cùng ngày
2. **FSRS**: Anki mới chuyển sang FSRS (Free Spaced Repetition Scheduler) — ML-based
3. **Leech detection**: Đánh dấu card quên nhiều lần (>= 8 lapses)
4. **Bury siblings**: Ẩn card liên quan trong cùng session
5. **Filtered decks**: Custom study sessions
6. **Load balancer**: Phân bố đều card due across days
7. **Early review intervals**: Xử lý đặc biệt khi review trước hạn
8. **Daily limits**: Giới hạn new cards/reviews per day
