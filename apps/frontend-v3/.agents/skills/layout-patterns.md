# Skill: Layout Patterns

## App Shell

```
┌──────────┬────────────────────────────────┐
│ Sidebar  │ Header (sticky)                │
│ 260px    ├────────────────────────────────┤
│ fixed    │ Content (adaptive width)       │
│          │ px-10 pb-12 space-y-8          │
└──────────┴────────────────────────────────┘
```

Sidebar: `w-[260px] shrink-0 bg-white border-r border-ink-200 sticky top-0 h-screen`.
Content: `flex-1 min-w-0`.

## Sidebar Nav

5 items: Tổng quan, Luyện tập, Thi thử, Khóa học, Hồ sơ.
Active: `bg-brand-tint text-brand font-bold`. Inactive: `text-ink-700 font-bold hover:bg-ink-100`.
Icon `w-7 h-7`, text `text-base`, gap-4, padding `px-4 py-3`, rounded-xl.
Divider + "Xem thêm" dưới 5 items.
User footer: avatar + name + role trong `bg-ink-100 rounded-xl`.

## Header

Sticky `top-0 z-10 bg-ink-100 px-10 pt-8 pb-5`.
Left: page title `font-extrabold text-2xl`.
Right: gem + streak + avatar inline `gap-6`.

## Adaptive Content Width

| Page type | Width |
|---|---|
| Dashboard, lists | Full (no max-width) |
| Reading (vocab, grammar detail) | max-w-3xl centered |
| Forms (profile, settings) | max-w-2xl centered |
| Exam session | Full, split view |
| Focus mode | Ẩn sidebar + header |

## Focus Mode

Route `_focused.tsx` — no sidebar, no header. Minimal top bar: back + section + timer + progress.
