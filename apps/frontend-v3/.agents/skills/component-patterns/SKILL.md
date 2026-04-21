---
name: component-patterns
description: >
  How UI components are built and styled in this project (buttons, cards, pills,
  colors, SVG icons). Load before creating, modifying, or styling any React
  component.
---

# Component Patterns

## Styling

- Button/Card classes: `src/styles.css` `@layer components`
- Dynamic colors via `style={{ color: config.color }}`, not Tailwind class injection
- Use design token tint variants (`bg-*-tint` + `text-*`) instead of solid backgrounds

## Icons

- Skill config (colors, icons, routes): `src/lib/skills.ts`
- SVG icons as React components: `vite-plugin-svgr`, use `currentColor`

## Code rules

- Write UI elements explicitly — no `.map()` over config arrays for small fixed sets
- Props ≤ 3 per component. Group related props into shared types (e.g. `BackLink`)
- No `!` non-null assertions — use early return or null check (`{value && <Comp />}`)
- No `as` type casts — use discriminated unions, early returns, or runtime checks
- No inline type annotations on API responses — define in `types.ts`
- Hook returns: use `status` field for state machines, `null` for optional values
- Keyboard handlers: use lookup objects (`Record<string, T>`) instead of casting
