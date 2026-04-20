---
name: component-patterns
description: >
  How UI components are built and styled in this project (buttons, cards, pills,
  colors, SVG icons). Load before creating, modifying, or styling any React
  component.
---

# Component Patterns

- Button/Card classes: `src/styles.css` `@layer components`
- Skill config (colors, icons, routes): `src/lib/skills.ts`
- SVG icons as React components: `vite-plugin-svgr`, use `currentColor`
- Dynamic colors via `style={{ color: config.color }}`, not Tailwind class injection
- Write UI elements explicitly — no `.map()` over config arrays for small fixed sets (buttons, nav items)
- Use design token tint variants (`bg-*-tint` + `text-*`) instead of solid backgrounds for interactive states
