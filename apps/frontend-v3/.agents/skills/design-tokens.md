# Skill: Design Tokens

Naming convention cho Tailwind classes. KHÔNG hardcode hex trong components.

## Semantic (components dùng)

| Token | Class | Dùng cho |
|---|---|---|
| `primary` | `bg-primary`, `text-primary` | CTA, active nav, links, brand |
| `primary-foreground` | `text-primary-foreground` | Text trên bg-primary |
| `primary-dark` | `shadow: primary-dark` | Button pressed, shadow |
| `primary-tint` | `bg-primary-tint` | Active nav bg, light highlight |
| `destructive` | `text-destructive` | Error, danger, gap negative |
| `warning` | `text-warning` | Warning states |
| `success` | `text-success` | Correct, pass |
| `info` | `text-info` | Info states |

## Neutrals

| Token | Class | Dùng cho |
|---|---|---|
| `foreground` | `text-foreground` | Primary text (headings, values) |
| `muted` | `text-muted` | Secondary text (labels) |
| `subtle` | `text-subtle` | Tertiary (placeholders) |
| `placeholder` | `text-placeholder` | Input placeholder |
| `border` | `border-border` | Borders, dividers |
| `surface` | `bg-surface` | Cards, inputs |
| `background` | `bg-background` | Page bg |

## Domain (VSTEP specific)

| Token | Class | Dùng cho |
|---|---|---|
| `skill-listening` | `bg-skill-listening`, `text-skill-listening` | Nghe |
| `skill-reading` | `bg-skill-reading`, `text-skill-reading` | Đọc |
| `skill-writing` | `bg-skill-writing`, `text-skill-writing` | Viết |
| `skill-speaking` | `bg-skill-speaking`, `text-skill-speaking` | Nói |
| `streak` | `text-streak` | Streak flame |
| `coin` | `text-coin`, `text-coin-dark` | Xu/gem |

## Rules

1. Components dùng semantic: `bg-primary` không `bg-[#58cc02]`
2. Skill colors chỉ cho skill-specific UI (badges, chart, progress)
3. Đổi brand color = chỉ sửa `styles.css`, không sửa components
4. Mỗi bg có foreground: text trên `bg-primary` dùng `text-primary-foreground`
