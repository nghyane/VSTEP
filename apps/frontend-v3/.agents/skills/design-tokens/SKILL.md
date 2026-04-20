---
name: design-tokens
description: "Color tokens, typography, spacing, radius. Load when adding colors, adjusting theme, or reviewing token usage."
---

# Design Tokens

Source of truth: `src/styles.css` `@theme` block.

- Semantic: primary, destructive, warning, success, info
- Neutrals: foreground, muted, subtle, placeholder, border, surface, background
- Domain: skill-*, streak, coin
- Components use token names (`bg-primary`), never hardcode hex
