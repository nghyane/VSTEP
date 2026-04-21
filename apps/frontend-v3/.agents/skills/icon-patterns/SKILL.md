---
name: icon-patterns
description: "Duo SVG icons: import, coloring, creating new icons. Load when adding or modifying icons."
---

# Icon Patterns

- Icons: `src/assets/icons/*.svg` — use `currentColor` for dynamic color
- Import as component: `import Icon from "#/assets/icons/name.svg?react"`
- Color via `style={{ color }}` or className — never edit SVG fill per-use
- New icons: filled style matching Duolingo aesthetic, multi-color hardcoded for sidebar icons, `currentColor` for mono icons
- Sidebar icons use native colors (not currentColor) — see house, weights, target, guidebook
- Skill → icon mapping: `src/lib/skills.ts` `SKILL_CONFIG`
