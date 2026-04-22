# VSTEP Admin — Agent Instructions

Stack: bun · Vite · SvelteKit · Svelte 5 · Tailwind v4 · Lucide icons.

Commands: `bun run dev` · `bun run build`.

## Rules

- All styling via Tailwind utility classes. No `<style>` blocks. No inline `style=""`.
- Colors, radius, fonts defined as CSS variables in `app.css` `@theme` block. Components reference via `bg-(--color-x)`, `text-(--color-x)`.
- Icons: `lucide-svelte`. 16px, strokeWidth 1.75.
- Svelte 5 runes only: `$state`, `$derived`, `$effect`, `$props`.
- API calls via `$lib/api.ts`. Auth via `$lib/auth.svelte.ts`.
- No hardcoded hex in components. No emoji. No JS hover handlers.
- Design reference: Linear Design System (Figma `4GwMVQNSApf34GjbCJ6Oh2`).
- Font: Inter (Google Fonts import in app.html).

## Design tokens (from Linear Figma)

See `app.css` `@theme` block. Key values:
- Background: `#1d1e2b`, Surface: `#292a35`, Border: `#393a4b`
- Text: `#eeeffc` (primary), `#d2d3e0` (secondary), `#858699` (tertiary)
- Primary: `#575bc7`, Selected bg: `rgba(133,134,152,0.2)`
- Radius: 4px, Font: Inter 13px
