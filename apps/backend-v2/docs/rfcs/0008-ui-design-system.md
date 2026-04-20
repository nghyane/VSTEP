---
RFC: 0008
Title: UI Design System & Screen Map
Status: Draft
Created: 2025-07-14
Updated: 2025-07-14
Superseded by: —
---

# RFC 0008 — UI Design System & Screen Map

## Summary

Định nghĩa design system (tokens, components, layout patterns) và danh sách màn hình cho frontend VSTEP, tham chiếu Hoo-Dini Design System (Duolingo community). Figma file: `EkXFiqAzjMrICpaGSGavsQ`.

## Motivation

Backend-v2 đã triển khai 7 bounded contexts (RFC 0001), ~60 tables (RFC 0002), 13 nhóm API (RFC 0003), auth 3-role (RFC 0004), grading pipeline (RFC 0005). Frontend cần design system thống nhất để:

1. Map 1-1 từ API contract → screen, không thiếu không thừa.
2. Giữ visual consistency kiểu Duolingo (gamification, friendly, rounded).
3. Phân rõ 3 panel: Learner, Teacher, Admin — mỗi panel có layout riêng.
4. Design tokens reusable cho cả web và mobile (phase 2).

## Design

### Reference

Hai Figma community files làm nguồn tham chiếu:

1. **DuoLingo Design System** (`lniVfk9xTLC5DYnHRdADpe`): **nguồn chính** — fork toàn bộ components + icons.
   - Font: **Din Rounded VF** (Bold, 16px, letterSpacing -2%) cho button text, UI labels.
   - Color tokens: `color/green/base=#58CC02`, `color/green/light=#79D634`, `color/green/dark=#478700`, `color/blue/base=#1CB0F6`, `color/blue/medium=#1899D6`, `color/blue/ice=#DDF4FF`, `color/grey/6=#E5E5E5`, `color/grey/3=#AFAFAF`, `color/grey/white=#FFFFFF`.
   - Icons: 38 icons × 2-4 sizes (XS/S/M/L). Fork nguyên bộ.
   - Components: Button, Progress Bar, Bottom Nav, Context Bar, Tasks, Level, Level Icon, Day Tracker, Check, Record Audio, Word/Question, Progress Ring, Proficiency Bar, Chests, Flag Selection, Header, Tooltip, Phone frame.
2. **Hoo-Dini Design System** (`0RS5Evqm83xhfiA5QWKav3`): tham khảo phụ cho layout patterns. Không dùng font/icon của Hoo-Dini.

Chiến lược: **fork DuoLingo Design System** làm component + icon foundation. Không dùng Hoo-Dini.

### Design tokens

#### Typography

2 font duy nhất:
- **Din Rounded VF** — font chính, dùng cho mọi UI text: buttons, labels, progress, badges, body, headings.
- **Feather Bold** — font display, dùng cho hero titles, large headings, brand moments.

| Token | Family | Style | Size | Letter-spacing | Use |
|---|---|---|---|---|---|
| `display` | Feather | Bold | 40 | 0 | Hero title, celebration, splash |
| `heading` | Feather | Bold | 34 | 0.374px | Page title |
| `title-1` | Feather | Bold | 30 | 0 | Section header |
| `title-2` | Din Rounded VF | Bold | 24 | -0.48px | Card title large |
| `title-3` | Din Rounded VF | Bold | 20 | -0.4px | Card title, subsection |
| `button` | Din Rounded VF | Bold | 16 | -0.32px | Buttons, CTAs, progress text |
| `body-lg` | Din Rounded VF | Regular | 18 | 0 | Prominent body |
| `body` | Din Rounded VF | Regular | 16 | 0 | Default body |
| `body-sm` | Din Rounded VF | Regular | 14 | 0 | Secondary text |
| `caption` | Din Rounded VF | Bold | 12 | -0.24px | Labels, timestamps, counters |
| `overline` | Din Rounded VF | Bold | 10 | -0.2px | Badges, tags |

#### Color palette

Duolingo-inspired, adapted cho VSTEP education context.

Lấy trực tiếp từ Duolingo Design System variables:

| Group | Token | Hex | Source | Use |
|---|---|---|---|---|
| Green | `green/base` | `#58CC02` | Duo DS | CTA buttons, correct, streak, primary |
| | `green/light` | `#79D634` | Duo DS | Progress bar highlight |
| | `green/dark` | `#478700` | Duo DS | Pressed state, progress text filled |
| Blue | `blue/base` | `#1CB0F6` | Duo DS | Links, listening, secondary buttons |
| | `blue/medium` | `#1899D6` | Duo DS | Button pressed, active states |
| | `blue/ice` | `#DDF4FF` | Duo DS | Light blue bg, audio waveform bg |
| Grey | `grey/white` | `#FFFFFF` | Duo DS | Cards, inputs, backgrounds |
| | `grey/6` | `#E5E5E5` | Duo DS | Borders, progress bar track, dividers |
| | `grey/3` | `#AFAFAF` | Duo DS | Placeholder, disabled text, empty progress |
| Accent | `acc-500` | `#FFC800` | VSTEP custom | Coins, rewards, speaking skill |
| | `acc-600` | `#DCAA00` | VSTEP custom | Pressed |
| Error | `err-500` | `#EA4335` | VSTEP custom | Errors, wrong answers |
| | `err-100` | `#FFE6E4` | VSTEP custom | Error bg |
| Warning | `warn-500` | `#FF9B00` | VSTEP custom | Warnings |
| Neutral | `n-900` | `#1E1E28` | VSTEP custom | Primary text (headings) |
| | `n-700` | `#4B4B5A` | VSTEP custom | Secondary text |

Nguyên tắc: ưu tiên Duo DS tokens. Chỉ thêm VSTEP custom khi Duo DS không cover (accent gold, error, warning, dark text).

#### Skill colors

Mỗi skill VSTEP có accent color riêng, dùng cho badges, progress bars, card accents.

| Skill | Color | Hex |
|---|---|---|
| Listening | Secondary | `#1CB0F6` |
| Reading | Purple | `#7850C8` |
| Writing | Primary | `#58CC02` |
| Speaking | Accent | `#FFC800` |

#### Spacing & radius

- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.
- Border radius: `sm=8`, `md=12`, `lg=16`, `xl=24`, `full=9999` (pills/badges).
- Duolingo-style bottom shadow: `0 4px 0 rgba(0,0,0,0.15)` cho buttons.
- Card shadow: `0 4px 12px rgba(0,0,0,0.06)`.

#### Icon strategy

**Fork toàn bộ bộ icon từ DuoLingo Design System** (`lniVfk9xTLC5DYnHRdADpe`). Copy/fork component set `Icons` (38 icons × 2-4 sizes) sang file VSTEP.

Không dùng Lucide hay icon set ngoài. Bộ Duo DS đã đủ cho mọi use case.

##### Icon inventory (fork từ Duo DS)

| Duo DS Icon | Sizes | VSTEP mapping |
|---|---|---|
| `Streak` | XS/S/M/L | Streak flame, daily goal |
| `Gem` | S/M | Coin/xu display (rebrand gem → coin) |
| `Heart` | S | Reserve (phase 2) |
| `House` | S | Dashboard/Home nav |
| `Headphones` | Level icon | Listening skill |
| `Book` | Level icon | Reading skill |
| `Microphone` | S/M/Level | Speaking skill, Record Audio |
| `Star` | Level icon | Writing skill, achievements |
| `Weights` | S/Level | Practice/Drill |
| `Trophy` | S/XS | Course completion, achievements |
| `Timer` | S/M/XS | Exam countdown, session timer |
| `Target` | S/M | Target level banner |
| `Volume` | S + Muted | Audio player, listening |
| `Check` | S (Filled/Empty/Iced) | MCQ correct, task completed |
| `Lightning` | S/XS | Quick actions, XP |
| `Close` | S | Modal close |
| `Back` | S | Navigation back |
| `Bell` | S | Notifications |
| `Trash` | S | Delete |
| `Invite` | S | Share/invite |
| `Share` | S | Share results |
| `Add Profile` | M | Profile switcher |
| `Face` | S | Profile/avatar |
| `More` | S | Overflow menu |
| `Monthly Challenge` | M | Course commitment |
| `Flag` | S/XS + variants | Target exam school |
| `Duo Pro` | S | Premium (reserve) |
| `Shiny Gold Chest` | S | Rewards |

##### Icon sizes (từ Duo DS)

| Token | Size | Use |
|---|---|---|
| XS | 12–16px | Inline text, counters |
| Small | 18–30px | Buttons, list items, nav, badges |
| Medium | 28–48px | Stat cards, headers, empty states |
| Large | 113–149px | Hero illustrations, splash |

##### Bổ sung cho VSTEP (vẽ thêm cùng style Duo DS)

Chỉ 4 icons Duo DS không có, vẽ mới theo cùng style (rounded, filled, 2-tone):

| Icon | Use | Lý do |
|---|---|---|
| `Wallet` | Wallet/economy nav | Duo dùng Gem inline, VSTEP cần nav icon riêng |
| `Calendar` | Booking slots, schedule | Duo không có booking |
| `Lock` / `Unlock` | Commitment gate, support locked | Duo dùng level unavailable, VSTEP cần explicit lock |
| `Radar Chart` | Spider chart icon | Dashboard specific |

### Component library

#### Atoms

Fork từ Duo DS, adapt cho VSTEP:

| Duo DS Component | VSTEP atom | Notes |
|---|---|---|
| `Button` (Pri/Sec × Active/Inactive × Icon) | Button | Din Rounded Bold 16, rounded-13px, `grey/6` bottom border. Thêm variant Danger (VSTEP custom) |
| `Progress Bar` (0–100% × text) | Progress bar | Skill-colored fill, `grey/6` track |
| `Check` (Filled/Empty/Iced) | Checkbox | MCQ options, task completion |
| `Proficiency Bar` (0–4) | Mastery bar | Grammar/vocab mastery level |
| `Progress Ring` (0/5–4/5) | Progress ring | Min tests gate indicator |
| `Day Tracker` (Complete/Frozen/Empty) | Day dot | Streak calendar |
| `Header Counter` | Counter badge | Question number in exams |
| `Volume` (Muted/Unmuted) | Volume toggle | Audio player |
| — | Badge | VSTEP custom: skill colors, status, level (B1/B2). Din Rounded Bold 10, pill |
| — | Input | VSTEP custom: Empty/Focused/Filled/Error. Din Rounded 16, rounded-13px, 2px `grey/6` border |
| — | Coin display | VSTEP custom: Gem icon (rebrand) + amount. Accent color |

#### Molecules

Fork từ Duo DS, compose cho VSTEP:

| Duo DS Component | VSTEP molecule | Maps to API |
|---|---|---|
| `Tasks` (Completed/Incomplete × placement) | Exercise card | Practice list items |
| `Level` (Complete/Gold/Next/Unavailable/Selected) + `Level Icon` | Skill level card | Skill progress in sidebar |
| `Chests` (Bronze/Silver/Gold × Open/Closed) | Reward card | Course completion, achievements |
| `Flag Selection` / `Selected Language` | Target exam selector | Onboarding, profile settings |
| `Friend Streaks` | Streak comparison | Phase 2 social |
| `Word` / `Question` / `Answer` / `Word Selection` | MCQ exercise | Vocab/grammar/listening/reading drills |
| `Record Audio` (Selected/Unselected + waveform) | Speaking recorder | Speaking practice + exam |
| `Tooltip` / `Start Tooltip` | Onboarding hint | Feature discovery |
| — | Stat card (VSTEP custom) | `GET /overview` fields |
| — | Transaction row (VSTEP custom) | `GET /wallet/transactions` |
| — | Notification item (VSTEP custom) | `GET /notifications` |
| — | SRS flashcard (VSTEP custom) | `POST /vocab/srs/review` |
| — | Course card (VSTEP custom) | `GET /courses` |
| — | Booking slot (VSTEP custom) | `GET /courses/{id}/my-slots` |

#### Organisms

Fork + compose từ Duo DS:

| Duo DS Component | VSTEP organism | Composition |
|---|---|---|
| `Context Bar` (Map/Lesson/Prize/Popup/Headline) | Top bar | Context bar + streak icon + coin display + bell + avatar |
| `Bottom Nav` (Home/Action/None/Success) | Bottom nav (mobile) | Home/Practice/Exams/Courses/Wallet tabs |
| `Header` (with/without padding) | Page header | Title + back button + counter |
| `Section Header` | Section divider | Section title + see all link |
| `Phone` frame | Mobile preview | Mockup wrapper |
| — | Sidebar nav (VSTEP custom) | Logo + nav items + profile switcher + coin balance |
| — | Target banner (VSTEP custom) | Ghim trên cùng Dashboard: target level + deadline + countdown |
| — | Spider chart (VSTEP custom) | 4-axis radar (L/R/W/S). Ẩn nếu < 5 tests |
| — | Score trend chart (VSTEP custom) | Stacked bar / line, checkbox bật/tắt skill |
| — | Exam timer (VSTEP custom) | Countdown server-authoritative + warning 5min |
| — | Pre-exam device check (VSTEP custom) | Popup test mic + loa |
| — | Grading result panel (VSTEP custom) | ① Điểm mạnh → ② Cần cải thiện (red highlight) → ③ Gợi ý viết lại |
| — | Writing editor (VSTEP custom) | Textarea + word count + support toggle |
| — | Writing support overlay (VSTEP custom) | Outline placeholders + annotation stickers |
| — | Listening support modes (VSTEP custom) | Radio: audio only / transcript / highlight / keyword |
| — | Vocab flashcard (VSTEP custom) | Card flip + 4 nút SRS (Again/Hard/Good/Easy) |
| — | Commitment progress (VSTEP custom) | Progress bar "X/N bài" + booking gate |
| — | Booking calendar (VSTEP custom) | Timeslot grid 30 phút |
| — | Teacher review editor (VSTEP custom) | Split view: bài làm + AI result ‖ teacher comment |
| — | Celebration popup (VSTEP custom) | Confetti + message |
| — | Coin spend confirm (VSTEP custom) | Modal: cost + balance after |

### Screen map

#### Panel 1: Learner (JWT + active-profile)

| # | Screen | Route | Primary API | Key components |
|---|---|---|---|---|
| L01 | Login | `/login` | `POST /auth/login` | Input, Button |
| L02 | Register | `/register` | `POST /auth/register` | Input, Button, level select |
| L03 | Onboarding wizard | `/onboarding` | `POST /profiles/{id}/onboarding` | Step wizard, radio groups |
| L04 | Dashboard | `/` | `GET /overview` | Spider chart, stat cards, streak, heatmap, next action |
| L05 | Profile switcher | modal | `GET /profiles`, `POST /auth/switch-profile` | Avatar list, create button |
| L06 | Profile settings | `/settings` | `PATCH /profiles/{id}` | Input, level select, deadline picker |
| L07 | Wallet | `/wallet` | `GET /wallet/balance`, `/transactions` | Coin display, transaction list, topup button |
| L08 | Topup | `/wallet/topup` | `GET /wallet/topup-packages`, `POST /wallet/topup` | Package cards, confirm modal |
| L09 | Promo redeem | modal | `POST /wallet/promo-redeem` | Input, result toast |
| L10 | Vocab topics | `/vocab` | `GET /vocab/topics` | Topic cards with progress |
| L11 | Vocab topic detail | `/vocab/:id` | `GET /vocab/topics/{id}` | Word list, SRS state badges, exercise list |
| L12 | SRS review | `/vocab/review` | `GET /vocab/srs/queue`, `POST /vocab/srs/review` | SRS card flip, rating buttons |
| L13 | Grammar list | `/grammar` | `GET /grammar/points` | Grammar point rows, filter by category/level |
| L14 | Grammar detail | `/grammar/:id` | `GET /grammar/points/{id}` | Structures, examples, mistakes, tips, exercises, mastery |
| L15 | Listening practice list | `/practice/listening` | `GET /practice/listening/exercises` | Exercise cards |
| L16 | Listening session | `/practice/listening/:id` | Start → support → submit | Audio player, MCQ, support toggle, timer |
| L17 | Reading practice list | `/practice/reading` | `GET /practice/reading/exercises` | Exercise cards |
| L18 | Reading session | `/practice/reading/:id` | Start → submit | Passage + MCQ split view |
| L19 | Writing practice list | `/practice/writing` | `GET /practice/writing/prompts` | Prompt cards |
| L20 | Writing session | `/practice/writing/:id` | Start → support → submit | Writing editor, outline/template panels |
| L21 | Writing result | `/practice/writing/:id/result` | `GET /grading/writing/...` | Grading result panel |
| L22 | Speaking drill list | `/practice/speaking/drills` | `GET /practice/speaking/drills` | Drill cards |
| L23 | Speaking drill session | `/practice/speaking/drills/:id` | Start → attempt per sentence | Audio recorder, accuracy feedback |
| L24 | Speaking VSTEP list | `/practice/speaking/tasks` | `GET /practice/speaking/tasks` | Task cards (part 1/2/3) |
| L25 | Speaking VSTEP session | `/practice/speaking/tasks/:id` | Start → upload → submit | Audio recorder, timer |
| L26 | Speaking result | `/practice/speaking/:id/result` | `GET /grading/speaking/...` | Grading result + pronunciation report |
| L27 | Exam list | `/exams` | `GET /exams` | Exam cards with school badge, attempt history |
| L28 | Exam start | `/exams/:id` | `POST /exams/{id}/sessions` | Mode select (custom/full), skill picker, time extension, coin cost preview |
| L29 | Exam session | `/exam-sessions/:id` | `GET /exam-sessions/{id}` | Tab per skill, timer, auto-save, submit |
| L30 | Exam result | `/exam-sessions/:id/result` | `GET /exam-sessions/{id}/result` | Band scores, MCQ detail, grading panels |
| L31 | Course list | `/courses` | `GET /courses` | Course cards with enrollment status |
| L32 | Course detail | `/courses/:id` | `GET /courses/{id}` | Schedule, commitment status, slot booking |
| L33 | My bookings | `/bookings` | `GET /my/bookings` | Booking list with status, meet link |
| L34 | Notifications | `/notifications` | `GET /notifications` | Notification list, unread badge |
| L35 | Streak detail | `/streak` | `GET /streak` | Flame animation, calendar, daily goal |

#### Panel 2: Teacher (JWT + role:teacher)

| # | Screen | Route | Primary API |
|---|---|---|---|
| T01 | Teacher dashboard | `/teacher` | `GET /teacher/courses`, `/teacher/bookings` |
| T02 | My courses | `/teacher/courses` | `GET /teacher/courses` |
| T03 | My slots | `/teacher/slots` | `GET /teacher/slots`, `POST /teacher/slots` |
| T04 | Booking detail | `/teacher/bookings/:id` | `GET /teacher/bookings/{id}`, submission view |
| T05 | Submit review | `/teacher/bookings/:id/review` | `POST /teacher/bookings/{id}/review` |

#### Panel 3: Admin (JWT + role:admin)

| # | Screen | Route | Primary API |
|---|---|---|---|
| A01 | Admin dashboard | `/admin` | Reports overview |
| A02 | Accounts | `/admin/accounts` | `GET /admin/accounts` |
| A03 | Content: Vocab | `/admin/vocab/*` | CRUD vocab topics/words/exercises |
| A04 | Content: Grammar | `/admin/grammar/*` | CRUD grammar points + children |
| A05 | Content: Practice | `/admin/practice/*` | CRUD listening/reading/writing/speaking |
| A06 | Content: Exams | `/admin/exams/*` | CRUD exams + versions + sections |
| A07 | Courses | `/admin/courses/*` | CRUD courses + schedule + slots |
| A08 | Bookings | `/admin/bookings` | `GET /admin/bookings` |
| A09 | Enrollments | `/admin/enrollments` | `GET /admin/enrollments` |
| A10 | Wallet admin | `/admin/wallet` | `POST /admin/wallet/grant` |
| A11 | Promo codes | `/admin/promo-codes` | CRUD promo codes |
| A12 | Topup packages | `/admin/topup-packages` | CRUD packages |
| A13 | System config | `/admin/configs` | `GET/PATCH /admin/configs` |
| A14 | Reports | `/admin/reports` | Wallet daily, active users, grading jobs |

### Layout (chốt)

2-column: **Sidebar 200px fixed luôn expanded** + **Content max-width ~800px centered**.

Không collapsible sidebar. Không 3-column. Không top nav bar full-width.

#### Desktop

```
┌──────────────────────────────────────────────────────┐
│                              🔥7  💰80  🔔  [avatar]│
├────────┬─────────────────────────────────────────────┤
│ VSTEP  │                                             │
│        │         Content (max-w ~800px)              │
│ Tổng   │         centered trong phần còn lại         │
│ quan   │                                             │
│ Luyện  │                                             │
│ tập    │                                             │
│ Thi    │                                             │
│ thử    │                                             │
│ Khóa   │                                             │
│ học    │                                             │
│ Hồ sơ  │                                             │
│ ···    │                                             │
│ Xem    │                                             │
│ thêm   │                                             │
│[avatar]│                                             │
│ Nghia  │                                             │
└────────┴─────────────────────────────────────────────┘
  200px              rest
```

Sidebar: 5 items (Tổng quan, Luyện tập, Thi thử, Khóa học, Hồ sơ) + Xem thêm (Ví xu, Thông báo, Cài đặt).

Top-right: streak + coins + bell + avatar inline (giống Duo, không phải bar).

#### Mobile

Bottom tab 5 items (Home, Luyện, Thi, Khóa, Thêm). Không sidebar.

#### Focus mode (thi thử)

Sidebar + top ẩn hoàn toàn. Chỉ minimal header: ← Thoát | Phần | ⏱ Timer | Progress.

#### Teacher layout

Sidebar: Dashboard, Khóa của tôi, Slots, Bookings.

#### Admin layout

Sidebar: Dashboard, Accounts, Content (Vocab, Grammar, Practice, Exams), Courses, Economy (Wallet, Promo, Topup, Config), Reports.

### Dashboard (chốt)

Ưu tiên: **Action → Progress → Analytics**.

```
1. Profile Banner (gradient green, level track A2→B1→B2, countdown)
2. Next Action CTA ("Bạn chưa học hôm nay!" + [Bắt đầu])
3. Tiến độ luyện tập (4 skill cards: Nghe/Đọc/Viết/Nói + progress bar, click = vào luyện)
4. Thống kê 2×2 (Streak, Thời gian học, Bài thi, Band ước tính)
5. Năng lực 4 kỹ năng (Spider chart, ẩn nếu < 5 bài)
6. Hoạt động học tập (Heatmap)
```

### Luyện tập page (chốt)

1 page, 2 sections, click card = vào thẳng module. Không trang "chọn chế độ".

```
NỀN TẢNG
┌──────────┐ ┌──────────┐
│ Từ vựng  │ │ Ngữ pháp │   ← 2 cards với progress
└──────────┘ └──────────┘

KỸ NĂNG
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│ Nghe │ │ Đọc  │ │ Viết │ │ Nói  │   ← 4 cards với progress
└──────┘ └──────┘ └──────┘ └──────┘
```

### Interaction patterns chi tiết

#### 1. Onboarding & Profile

| Step | UI | API |
|---|---|---|
| Đăng nhập Gmail | OAuth button → redirect | `POST /auth/login` |
| Tạo profile | Wizard bắt buộc: nickname → target level (A2/B1/B2/C1) → mục đích (Tiến sĩ, ra trường...) → target deadline | `POST /auth/register` |
| Popup tặng xu | Celebration popup "🎉 Bạn được tặng 100 Xu!" sau khi tạo profile đầu tiên | Event `profile.created` → `onboarding_bonus` |
| Nhập Giftcode | Input field + "Đổi mã" button, success toast hiện xu nhận được | `POST /wallet/promo-redeem` |
| Reset profile | Button "Làm lại từ đầu" → confirm dialog cảnh báo: "Xóa sạch tiến độ học, GIỮ xu và enrollments" | `POST /profiles/{id}/reset` |
| Profile switcher | Modal overlay danh sách avatar + nickname, nút tạo mới, chọn → reissue JWT | `POST /auth/switch-profile` |
| Target ghim Dashboard | Banner nổi bật nhất, trên cùng Dashboard: "🎯 Mục tiêu: B2 — Thi ĐH Văn Lang 15/04" + countdown ngày | `GET /overview` → `profile.target_level`, `target_deadline` |

#### 2. Dashboard & Charts

Dữ liệu chart **chỉ từ Mock Exam** (custom + full), KHÔNG từ Practice/Drill.

| Component | Behavior | Data source |
|---|---|---|
| Spider chart (4 trục L/R/W/S) | Ẩn hoàn toàn nếu < 5 bài test, hiện placeholder "Làm thêm X bài để xem biểu đồ" | `GET /overview` → `spider_chart` (null nếu < min_tests) |
| Stacked bar / Line chart | Trục Y = điểm, trục X = thời gian. Checkbox bật/tắt từng kỹ năng để so sánh | `GET /overview` → exam history data |
| Tổng thời lượng học tập | Block stat, dữ liệu từ **Drill** (practice_sessions.duration_seconds) | `GET /overview` → `stats.total_study_minutes` |
| Streak | Block stat + flame icon, dữ liệu từ **Drill** (daily goal = 1 drill session) | `GET /streak` |

#### 3. Practice — Drill Phase

Thiết kế tab độc lập (Từ vựng, Ngữ pháp, Nghe, Đọc, Viết, Nói). **Không roadmap ép buộc**, user học tự do.

| Feature | UI spec |
|---|---|
| Vocab flashcards | Thẻ lật mặt trước (word + phonetic) / mặt sau (definition + examples). Bắt buộc 4 nút SRS: Again (1) · Hard (2) · Good (3) · Easy (4) |
| Support toggle | Nút gạt ON/OFF. Bật → confirm dialog "Tốn X xu, bạn có chắc?" → trừ xu → unlock content |
| Writing + support ON | Hiện outline placeholders (khối gợi ý cấu trúc), annotation stickers (hình chữ nhật + mũi tên) chỉ rõ: mở bài, thân bài, kết luận. Template sections clickable |
| Writing + support OFF | Text editor trống hoàn toàn, chỉ có word count |
| Listening + support ON | Radio buttons chọn mode: (a) Chỉ audio, (b) Audio + full transcript, (c) Audio + highlight keywords, (d) Audio + mờ từ không quan trọng chỉ giữ keyword |
| Listening + support OFF | Chỉ audio player + MCQ |

#### 4. Mock Exam

| Step | UI spec |
|---|---|
| Pre-exam check | Popup test mic + test loa trước khi vào đề. Nút "Kiểm tra thiết bị" → play sample audio + record 3s |
| Cấu trúc đề | Màn tóm tắt: số phần, số câu hỏi, thời gian mỗi phần. Nút "Bắt đầu" |
| Custom mode | Chọn kỹ năng (checkbox), thanh trượt (slider) điều chỉnh hệ số thời gian (1.0x → 2.0x) so với mặc định |
| Full VSTEP mode | Timer đếm ngược server-authoritative, **không cho chỉnh thời gian**. Warning popup ở 5 phút cuối. Auto-submit khi hết giờ |
| Listening (Full) | Audio player chạy **đúng 1 lần** từ đầu đến cuối, không có nút tua/replay. Play log gửi server |
| Coin cost preview | Trước khi start: hiện rõ "Chi phí: 25 xu · Số dư sau: 75 xu". 402 → toast "Không đủ xu" |
| AI Grading result | Thứ tự fix cứng: ① **Điểm mạnh** (green highlight) → ② **Điểm cần cải thiện** (red highlight trực tiếp trên bài làm: bôi đỏ từ sai, gạch chân ngữ pháp sai) → ③ **Gợi ý viết lại** (diff view hoặc side-by-side). Layout gọn, không rối mắt |

#### 5. Courses & Booking

| Feature | UI spec |
|---|---|
| Course list | Card: tên khóa + đợt thi ("Khóa thi ĐH Văn Lang 15/04") + max slots + giá xu (2000–5000) + nút "Mua" |
| Commitment gate | Sau enroll: hiện progress bar "Hoàn thành X/N bài Full Test trong Y ngày để mở booking". Chưa đủ → booking button disabled |
| Booking calendar | Calendar/timeslot grid: slot 30 phút, màu xanh = available, xám = booked. Click → confirm |
| Livestream | Link dẫn ra Zoom/Meet, hiện 15 phút trước giờ. Không build phòng học ảo |
| Schedule | Lịch biểu tĩnh per course: ngày, giờ, chủ đề |

#### 6. Teacher panel

| Feature | UI spec |
|---|---|
| Xem bài đã chấm AI | Hiện bài làm học viên + AI grading result bên cạnh |
| Thêm review | Text editor cho teacher viết comment "sửa bài một hột": corrections, tips, notes. Toggle "Hiện cho học viên" |
| Slot management | Calendar view, tạo/hủy slot 30 phút |
| Paste meet URL | Input field trong booking detail |

#### 7. Admin panel

| Feature | UI spec |
|---|---|
| Config form | Form nhập thông số thuật toán: Sliding window size (default 10), Std dev threshold (default 2.0), Min tests for chart (default 5), Streak daily goal, Grading max retries, Coin costs |
| Wallet grant | Form: chọn profile + nhập số xu + lý do → `POST /admin/wallet/grant` |
| Content CRUD | Data table + form cho mỗi content type. Exam version immutable sau publish |
| Reports | Charts: wallet daily, active users, grading job status |

### Responsive breakpoints

| Breakpoint | Width | Layout |
|---|---|---|
| Mobile | < 768px | Bottom tab, no sidebar, stacked cards |
| Tablet | 768–1024px | Collapsed sidebar (icons only) |
| Desktop | > 1024px | Full sidebar + content |

## Alternatives considered

### Alt 1: Material Design thay Duolingo style

Material chuẩn nhưng thiếu gamification feel. VSTEP là app học tập, cần friendly/playful. Duolingo-style phù hợp hơn.

### Alt 2: Tailwind UI components thay fork Duo DS

Tailwind UI đẹp nhưng corporate feel. Fork Duo DS giữ brand consistency. Vẫn dùng Tailwind CSS utility classes cho implementation.

### Alt 3: Không tách 3 panel, dùng 1 layout + role-based visibility

Phức tạp hóa layout logic. Admin cần data table heavy, learner cần gamification. Tách panel rõ ràng hơn.

### Alt 4: Font system dùng Nunito + Inter thay Din Rounded + Feather

Nunito/Inter phổ biến nhưng không đúng Duolingo feel. Din Rounded VF là font chính Duolingo — rounded, friendly, gamification-ready. Feather Bold cho display titles tạo điểm nhấn brand. Bỏ Nunito + Inter.

### Alt 5: Dùng Lucide/Phosphor icons thay fork Duo DS icons

Lucide consistent nhưng generic. Duo DS icons đã có đủ 38 icons với style rounded/filled/2-tone đúng brand. Fork nguyên bộ, chỉ vẽ thêm 4 icons VSTEP-specific.

## Implementation

- [ ] Figma: Fork Duo DS icons + components sang `EkXFiqAzjMrICpaGSGavsQ`
- [ ] Figma: Design tokens (Din Rounded + Feather fonts, Duo DS colors, spacing)
- [ ] Figma: VSTEP custom atoms (Badge, Input, Coin display)
- [ ] Figma: VSTEP custom molecules (Stat card, Transaction row, SRS flashcard, Course card)
- [ ] Figma: VSTEP custom organisms (Sidebar, Spider chart, Grading panel, Writing editor)
- [ ] Figma: Learner screens L01–L35
- [ ] Figma: Teacher screens T01–T05
- [ ] Figma: Admin screens A01–A14
- [ ] Code: Tailwind config with design tokens (Din Rounded VF, Feather Bold, Duo DS colors)
- [ ] Code: React component library matching Figma

## Data flow rules (FE phải tuân thủ)

| Rule | Detail |
|---|---|
| Chart data source | **Chỉ Mock Exam** (exam_sessions mode=custom/full, status=graded). KHÔNG lấy từ practice |
| Study time source | **Chỉ Drill** (practice_sessions.duration_seconds). KHÔNG từ exam |
| Streak source | **Chỉ Drill** (daily goal = 1 drill session/ngày) |
| Drill score | Điểm luyện tập **KHÔNG ghi nhận** vào biểu đồ thống kê. Chỉ exam scores mới vẽ chart |
| Spider chart gate | Ẩn nếu total_tests < `chart.min_tests` (default 5). Hiện placeholder |
| Sliding window | Chart dùng N bài gần nhất (admin config `chart.sliding_window_size`, default 10) |
| Outlier filter | Loại bài có std_dev > threshold (admin config `chart.std_dev_threshold`, default 2.0) |
| Coin spend | Luôn confirm trước, hiện cost + balance_after. 402 = toast lỗi |
| Exam timer | `server_deadline_at` là ground truth. Client chỉ render countdown, không tự tính |
| Listening play-once | Client enforce không cho replay + gửi play log. Server log nhưng không stream-lock |
| Support level | Log trước → trừ xu → nếu fail thì không enable. Không cho bật ngược |
| Grading result order | Fix cứng: Strengths → Improvements (highlight trên bài) → Rewrites. Không đổi thứ tự |
| Profile reset scope | Xóa: progress, mastery, SRS, study time. GIỮ: xu, enrollments |
| Adaptive scope | Adaptive (SRS) **chỉ cho vocab**. Exam dùng ngân hàng đề cố định, không gen đề |
| No roadmap | Không lộ trình ép buộc. Tabs rời rạc, user tự chọn module học |
| Grammar by level | Cấu trúc câu/ngữ pháp phải gắn level (A2/B1/B2) để user biết dùng gì cho trình độ mình |

## Open questions

1. Dark mode phase 1 hay phase 2? — Nghiêng phase 2.
2. Animation library: Framer Motion hay CSS transitions? — Phase 1 CSS, phase 2 Framer.
3. Mobile app: React Native hay responsive web? — Phase 1 responsive web only.
4. Icon set: Lucide, Phosphor, hay custom? — Nghiêng Lucide (consistent, tree-shakeable).
5. Chart library cho spider chart + heatmap: Recharts hay D3? — Nghiêng Recharts (React-native).
6. Pre-exam device check: Web Audio API đủ hay cần thư viện riêng cho mic test?
7. Listening highlight mode: CSS animation sync với audio timestamp hay dùng Web Speech API?
8. Writing annotation stickers: Canvas overlay hay absolute-positioned divs?
