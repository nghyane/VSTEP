---
name: ui-design-system
description: Project UI design system — read this before building any page or component. Defines visual style, color tokens, typography, and constraints.
globs:
  - "src/components/**"
  - "src/routes/**"
  - "src/styles.css"
---

# Soft Rounded UI

Friendly, soft design language. Tinted surfaces, rounded shapes, flat depth, saturated accents on muted backgrounds.

## Principles

- **Tinted, not bordered** — surfaces use low-opacity background fills (`bg-muted/30`, `bg-primary/5`), never solid borders or box shadows
- **Flat depth** — hierarchy through color lightness and opacity, not elevation or shadow
- **Very rounded** — large border-radius everywhere (`rounded-xl`+ for containers, `rounded-full` for pills and progress bars)
- **Subtle interaction** — hover changes background opacity or text color via `transition-colors`. No glow, gradient, shimmer, floating, parallax, or neon effects
- **Muted canvas, saturated accents** — backgrounds are near-white tinted surfaces; accent colors appear at full saturation only on text, icons, and small indicators

## Typography

- **Font**: DIN Round — geometric, rounded sans-serif (defined in `src/styles.css`)
- **Weights**: 500 (body), 700 (headings)
- **Numeric**: always `tabular-nums`

## Color System

All colors use **oklch** with a cohesive cool-gray surface hue of **260°**.

- **Semantic tokens**: primary (258° blue), destructive (27° red), success (150° green), warning (55° amber)
- **Skill colors**: Listening 258° · Reading 155° · Writing 290° · Speaking 60° — equal lightness/chroma, differentiated by hue
- **Surfaces**: tinted with hue 260°, ultra-low opacity. Accent backgrounds at `/5` to `/15`; text/icons at full saturation
- **Dark mode**: same hues, shift lightness up; borders become semi-transparent white

## Don'ts

- No `border` or `shadow` on cards — use tinted fills
- No hard-coded hex/rgb colors — use oklch tokens from `src/styles.css`
- No inline styles
- No glow, neon shadows, colored box-shadows, glowing borders
- No gratuitous gradients, shimmering text, or floating animations
- No AI-style icons (✨ sparkles, 🪄 wands, 🤖 robots) unless requested
