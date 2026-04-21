---
name: component-patterns
description: "UI component rules: type safety, props, styling, discriminated unions, no casts. Load when creating or styling components."
---

# Component Patterns

## Styling

- Button/Card classes: `src/styles.css` `@layer components`
- Dynamic colors via `style={{ color: config.color }}`, not Tailwind class injection
- Use design token tint variants (`bg-*-tint` + `text-*`) instead of solid backgrounds

## Icons

- Skill config (colors, icons, routes): `src/lib/skills.ts`
- SVG icons as React components: `vite-plugin-svgr`, use `currentColor`

## Type safety

- No `as` casts in business logic — only acceptable at boundaries (DOM events, React internals)
- Discriminated unions for variant data (e.g. `VocabExercise` per `kind`)
- `switch (x.kind)` for exhaustive handling — TS narrows payload type automatically
- URL search params: validate with `===` checks, not `includes()` + cast
- Hook returns: `null` for optional values, `status` field for state machines
- No `!` non-null assertions — early return or `{value && <Comp />}`

## Code rules

- Write UI elements explicitly — no `.map()` over config arrays for small fixed sets
- Props ≤ 3 per component. Group related props into shared types (e.g. `BackLink`)
- No inline type annotations on API responses — define in `types.ts`
- Keyboard handlers: use lookup objects (`Record<string, T>`) instead of casting
