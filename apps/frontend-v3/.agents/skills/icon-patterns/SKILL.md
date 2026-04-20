---
name: icon-patterns
description: >
  How to import, color, and create SVG icons. Load before adding a new icon,
  changing icon colors, or importing an icon into a component.
---

# Icon Patterns

- Icons: `src/assets/icons/*.svg` — use `currentColor` for dynamic color
- Import as component: `import Icon from "#/assets/icons/name.svg?react"`
- Color via `style={{ color }}` or className — never edit SVG fill per-use
- New icons: filled style matching Duolingo aesthetic, multi-color hardcoded for sidebar icons, `currentColor` for mono icons
- Sidebar icons use native colors (not currentColor) — see house, weights, target, guidebook
- Skill → icon mapping: `src/lib/skills.ts` `SKILL_CONFIG`
