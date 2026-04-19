---
name: component-patterns
description: "Duo-style UI components: buttons, cards, skill pills. Load when creating or styling components."
---

# Component Patterns

- Button/Card classes: `src/styles.css` `@layer components`
- Skill config (colors, icons, routes): `src/lib/skills.ts`
- SVG icons as React components: `vite-plugin-svgr`, use `currentColor`
- Dynamic colors via `style={{ color: config.color }}`, not Tailwind class injection
