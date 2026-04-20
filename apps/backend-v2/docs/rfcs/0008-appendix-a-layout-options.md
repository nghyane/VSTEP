---
RFC: 0008-appendix-A
Title: Layout Options Analysis
Status: Draft
Created: 2025-07-14
Updated: 2025-07-14
Parent: RFC 0008
---

# RFC 0008 Appendix A — Layout Options

## Context

VSTEP là app luyện thi chứng chỉ — khác Duolingo ở:
- **Goal-driven**: có target level + deadline, không phải casual learning
- **Session-heavy**: sessions 30–120 phút, cần focus mode
- **Content-dense**: split view (passage + MCQ, bài làm + grading result)
- **Desktop-first**: thi trên máy tính, mobile là phụ
- **Multi-module**: 7 module song song, không phải 1 path linear
- **3 roles**: Learner / Teacher / Admin — mỗi role có workflow riêng

Design tokens (font, color, icons, components) vẫn dùng Duo DS. Chỉ layout khác.

---

## Option A: Dashboard-centric (Notion/Linear style)

```
Desktop (>1024px):
┌──────────────────────────────────────────────────────┐
│ ┌────────┐ ┌──────────────────────────────────────┐  │
│ │        │ │ 🎯 B2 · ĐH Văn Lang · còn 45 ngày   │  │
│ │  Left  │ ├──────────────────────────────────────┤  │
│ │  Nav   │ │                                      │  │
│ │        │ │         Main Content Area             │  │
│ │ 🏠 Home │ │                                      │  │
│ │ 📖 Vocab│ │   (scrollable, full width)           │  │
│ │ 📝 Gram │ │                                      │  │
│ │ 🎧 List │ │                                      │  │
│ │ 📕 Read │ │                                      │  │
│ │ ✏️ Write│ │                                      │  │
│ │ 🎤 Speak│ │                                      │  │
│ │ 📋 Exam │ │                                      │  │
│ │ 📚 Course│ │                                      │  │
│ │ 💰 Wallet│ │                                      │  │
│ │        │ │                                      │  │
│ │────────│ │                                      │  │
│ │ 🔥7 80xu│ │                                      │  │
│ │ [avatar]│ │                                      │  │
│ └────────┘ └──────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
  ~220px                    ~rest

Mobile (<768px):
┌──────────────────────┐
│ 🎯 B2 · 45 ngày  🔔💰│  ← sticky top bar
├──────────────────────┤
│                      │
│   Main Content       │
│   (full width)       │
│                      │
├──────────────────────┤
│ 🏠  📖  📋  📚  💰  │  ← bottom tab (5 items)
└──────────────────────┘
```

**Đặc điểm:**
- Left sidebar cố định ~220px, chứa tất cả navigation
- Main content chiếm toàn bộ phần còn lại — không chia cột phải
- Target banner ghim trên cùng main content
- Streak + xu + avatar ở bottom sidebar
- Dashboard = grid cards (stats, spider chart, streak, next action)
- Khi vào exercise/exam → sidebar collapse hoặc ẩn → full-width focus mode

**Phù hợp cho:**
- Navigation rõ ràng giữa 7+ modules
- Content area rộng cho split view (passage + MCQ)
- Focus mode khi làm bài (ẩn sidebar)
- Admin panel dùng cùng layout (thay nav items)

**Nhược:**
- Sidebar chiếm space trên tablet
- Không có right panel cho contextual info (streak, notifications)

---

## Option B: Top nav + Focus content (Coursera/Khan Academy style)

```
Desktop (>1024px):
┌──────────────────────────────────────────────────────┐
│  VSTEP  │ Home │ Practice │ Exams │ Courses │ Wallet │  🔥7  💰80  🔔  [Nghia ▾]
├──────────────────────────────────────────────────────┤
│ 🎯 Mục tiêu: B2 · ĐH Văn Lang 15/04 · còn 45 ngày │  ← target banner
├──────────────────────────────────────────────────────┤
│                                                      │
│              Main Content Area                       │
│              (max-width: 1200px, centered)           │
│                                                      │
│                                                      │
│                                                      │
└──────────────────────────────────────────────────────┘

Practice sub-nav (khi ở /practice):
┌──────────────────────────────────────────────────────┐
│  VSTEP  │ Home │ Practice ▾│ Exams │ Courses │ Wallet│
├──────────────────────────────────────────────────────┤
│  Từ vựng │ Ngữ pháp │ Nghe │ Đọc │ Viết │ Nói      │  ← sub-tabs
├──────────────────────────────────────────────────────┤
│                                                      │
│              Exercise list / content                 │
│                                                      │
└──────────────────────────────────────────────────────┘

Exam session (focus mode):
┌──────────────────────────────────────────────────────┐
│  ← Thoát  │  Phần 2: Đọc hiểu  │  ⏱ 42:15  │ 12/40│  ← minimal header
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────────┐  ┌──────────────────────────┐   │
│  │                 │  │                          │   │
│  │   Passage       │  │   Questions (MCQ)        │   │
│  │   (scrollable)  │  │                          │   │
│  │                 │  │                          │   │
│  └─────────────────┘  └──────────────────────────┘   │
│         ~50%                    ~50%                  │
├──────────────────────────────────────────────────────┤
│                    [Nộp bài]                         │
└──────────────────────────────────────────────────────┘
```

**Đặc điểm:**
- Top nav ngang — quen thuộc với web app giáo dục (Coursera, edX, Khan)
- Practice có sub-tabs cho 6 modules
- Content centered, max-width — dễ đọc passage dài
- Exam/exercise → chuyển sang focus mode: ẩn nav, chỉ còn timer + progress
- Split view 50/50 cho reading (passage | MCQ), writing (editor | grading)

**Phù hợp cho:**
- Người dùng quen web giáo dục truyền thống
- Content-heavy screens (reading passages, writing prompts)
- Focus mode thi thử rất clean
- Responsive tốt — top nav → hamburger trên mobile

**Nhược:**
- Top nav giới hạn số items (5-6 max)
- Practice sub-tabs thêm 1 layer navigation
- Không có persistent sidebar cho quick access

---

## Option C: Hybrid — Collapsible sidebar + Contextual right panel

```
Desktop (>1024px):
┌──────────────────────────────────────────────────────────────┐
│ ┌──┐ ┌────────────────────────────────────┐ ┌─────────────┐ │
│ │  │ │ 🎯 B2 · Văn Lang · 45 ngày        │ │  🔥 Streak  │ │
│ │  │ ├────────────────────────────────────┤ │  7 ngày     │ │
│ │🏠│ │                                    │ │─────────────│ │
│ │📖│ │                                    │ │  💰 80 xu   │ │
│ │📝│ │       Main Content                 │ │─────────────│ │
│ │🎧│ │                                    │ │  📊 Tiến độ │ │
│ │📕│ │                                    │ │  Nghe: 60%  │ │
│ │✏️│ │                                    │ │  Đọc: 45%   │ │
│ │🎤│ │                                    │ │  Viết: 30%  │ │
│ │📋│ │                                    │ │  Nói: 20%   │ │
│ │📚│ │                                    │ │─────────────│ │
│ │💰│ │                                    │ │  🔔 Thông   │ │
│ │  │ │                                    │ │  báo mới (3)│ │
│ └──┘ └────────────────────────────────────┘ └─────────────┘ │
│ ~64px           ~rest                         ~280px        │
└──────────────────────────────────────────────────────────────┘

Sidebar expanded (hover/click):
┌──────────────────────────────────────────────────────────────┐
│ ┌────────┐ ┌──────────────────────────────┐ ┌─────────────┐ │
│ │ VSTEP  │ │                              │ │             │ │
│ │        │ │                              │ │             │ │
│ │ 🏠 Home │ │       Main Content           │ │  Right      │ │
│ │ 📖 Vocab│ │                              │ │  Panel      │ │
│ │ 📝 Gram │ │                              │ │             │ │
│ │ 🎧 Nghe │ │                              │ │             │ │
│ │ 📕 Đọc  │ │                              │ │             │ │
│ │ ✏️ Viết │ │                              │ │             │ │
│ │ 🎤 Nói  │ │                              │ │             │ │
│ │ 📋 Thi  │ │                              │ │             │ │
│ │ 📚 Khóa │ │                              │ │             │ │
│ │ 💰 Ví   │ │                              │ │             │ │
│ │────────│ │                              │ │             │ │
│ │ [Nghia]│ │                              │ │             │ │
│ └────────┘ └──────────────────────────────┘ └─────────────┘ │
│  ~220px              ~rest                    ~280px        │
└──────────────────────────────────────────────────────────────┘

Focus mode (exam/exercise):
┌──────────────────────────────────────────────────────┐
│  ← Thoát  │  Đọc hiểu  │  ⏱ 42:15  │  12/40       │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────┐  ┌───────────────────────┐     │
│  │   Passage         │  │   MCQ Questions       │     │
│  │                   │  │                       │     │
│  └──────────────────┘  └───────────────────────┘     │
│                                                      │
├──────────────────────────────────────────────────────┤
│                    [Nộp bài]                         │
└──────────────────────────────────────────────────────┘
  (sidebar + right panel ẩn hoàn toàn)
```

**Đặc điểm:**
- Left sidebar icon-only (64px) mặc định, expand khi hover/click (220px)
- Right panel contextual: thay đổi theo page
  - Dashboard: streak + xu + mini progress + notifications
  - Practice list: SRS queue count + mastery summary
  - Exam list: recent attempts + band estimate
  - Course detail: schedule + commitment status
- Focus mode: ẩn cả 2 sidebar → full-width split view
- 3-column → 2-column → 1-column responsive

**Phù hợp cho:**
- Tận dụng màn hình rộng desktop
- Right panel giữ context mà không cần rời page
- Icon sidebar tiết kiệm space nhưng vẫn accessible
- Focus mode clean nhất cho thi thử

**Nhược:**
- Phức tạp nhất để implement
- Right panel content thay đổi theo page → nhiều logic
- Tablet (768-1024) phải ẩn right panel

---

## So sánh

| Tiêu chí | Option A (Dashboard) | Option B (Top nav) | Option C (Hybrid) |
|---|---|---|---|
| Navigation clarity | ⭐⭐⭐ sidebar rõ ràng | ⭐⭐ top nav giới hạn | ⭐⭐⭐ icon + expand |
| Content space | ⭐⭐ sidebar chiếm 220px | ⭐⭐⭐ full width centered | ⭐⭐ 3 cột chia nhỏ |
| Focus mode (exam) | ⭐⭐⭐ ẩn sidebar | ⭐⭐⭐ ẩn top nav | ⭐⭐⭐ ẩn cả 2 |
| Split view (passage+MCQ) | ⭐⭐⭐ rộng | ⭐⭐⭐ rộng | ⭐⭐ hẹp hơn |
| Contextual info | ⭐ không có right panel | ⭐ không có | ⭐⭐⭐ right panel |
| Mobile responsive | ⭐⭐⭐ sidebar → bottom tab | ⭐⭐⭐ top → hamburger | ⭐⭐ phức tạp |
| Implementation effort | ⭐⭐⭐ đơn giản nhất | ⭐⭐⭐ đơn giản | ⭐⭐ phức tạp |
| Quen thuộc với user | ⭐⭐ app style (Notion) | ⭐⭐⭐ web giáo dục | ⭐⭐ hybrid |
| Admin/Teacher reuse | ⭐⭐⭐ thay nav items | ⭐⭐ thay top nav | ⭐⭐⭐ thay nav + panel |
| Scalability (thêm module) | ⭐⭐⭐ sidebar scroll | ⭐⭐ top nav hết chỗ | ⭐⭐⭐ sidebar scroll |

## Recommendation

**Option A (Dashboard-centric)** cho phase 1:
- Đơn giản nhất implement
- Navigation rõ ràng cho 9+ modules
- Focus mode clean cho exam
- Admin/Teacher dùng cùng layout shell
- Streak/xu/notifications đặt trong sidebar bottom hoặc top bar nhỏ

Phase 2 có thể nâng lên Option C nếu cần right panel contextual.

## Open questions

1. Sidebar mặc định expanded hay collapsed (icon-only)?
2. Mobile bottom tab chọn 5 items nào? (Home, Practice, Exam, Course, More?)
3. Focus mode có nút thoát nhanh hay phải confirm?
4. Admin panel dùng cùng sidebar layout hay layout riêng (data table heavy)?
