---
name: icon-patterns
description: "Duo SVG icons: import, coloring, creating new icons. Load when adding or modifying icons."
---

# Icon Patterns

- Icons: `src/assets/icons/*.svg` — use `currentColor` for dynamic color
- Import as component: `import Icon from "#/assets/icons/name.svg?react"`
- Color via `style={{ color }}` or className — never edit SVG fill per-use
- New icons: 2-tone filled style, see `pencil-small.svg` as reference
- Skill → icon mapping: `src/lib/skills.ts` `SKILL_CONFIG`
