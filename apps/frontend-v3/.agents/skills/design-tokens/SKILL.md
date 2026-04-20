---
name: design-tokens
description: >
  Color palette, typography scale, spacing, and border-radius tokens defined in
  this project. Load before choosing any color, font size, spacing value, or
  theme variable — especially when creating new components or pages.
---

# Design Tokens

Source of truth: `src/styles.css` `@theme` block.

- Semantic: primary, destructive, warning, success, info
- Neutrals: foreground, muted, subtle, placeholder, border, surface, background
- Domain: skill-*, streak, coin
- Components use token names (`bg-primary`), never hardcode hex
