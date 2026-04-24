---
name: component-patterns
description: "UI component rules: type safety, props, styling, tokens, icons, context providers. Load when creating or styling components."
---

# Component Patterns

## Design tokens

Source of truth: `src/styles.css` `@theme` block.

- Semantic: primary, destructive, warning, success, info
- Neutrals: foreground, muted, subtle, placeholder, border, surface, background
- Domain: skill-*, streak, coin
- Components use token names (`bg-primary`), never hardcode hex
- Tint variants (`bg-*-tint` + `text-*`) for interactive states

## Icons

- Icons: `src/assets/icons/*.svg`
- Import: `import Icon from "#/assets/icons/name.svg?react"`
- Mono icons: `currentColor`, color via `style={{ color }}` or className
- Sidebar icons: multi-color hardcoded (house, weights, target, guidebook)
- New icons: filled style matching Duolingo aesthetic
- Skill → icon mapping: `src/lib/skills.ts`

## Styling

- Button/Card classes: `src/styles.css` `@layer components`
- Dynamic colors via `style={{ color: config.color }}`, not Tailwind class injection

## Context providers

- Factory: `src/lib/create-strict-context.ts`
- Usage: `const [Provider, useHook] = createStrictContext<Value>("Name")`

## Type safety

- No `as` casts in business logic — only at DOM/React boundary
- Discriminated unions for variant data — `switch (x.kind)` for exhaustive handling
- URL search params: validate with `===` checks, not `includes()` + cast
- Hook returns: `null` for optional, `status` field for state machines
- No `!` non-null assertions — early return or `{value && <Comp />}`

## Code rules

- Write UI elements explicitly — no `.map()` over config arrays for small fixed sets
- Props ≤ 3 per component. Group related props into shared types
- No inline type annotations on API responses — define in `types.ts`
- Keyboard handlers: use lookup objects (`Record<string, T>`)
