# Skill: Component Patterns

Reference: `apps/mockup/screens/dashboard.html`.

## Button

```
.btn — rounded-(--radius-button), font-bold text-sm uppercase, box-shadow bottom
.btn-primary — bg-primary, text-primary-foreground, shadow primary-dark
.btn-secondary — bg-surface, text-foreground, shadow border
```

## Card

```
.card — bg-surface, rounded-(--radius-card), border-2 border-border, border-b-4
.card-interactive — thêm hover:translateY(-2px)
```

Không background tint cho icon containers. Icons trần.

## Stats Card

Icon `w-10 h-10 object-contain` (dùng medium SVG).
Label `text-sm text-subtle`. Value `font-extrabold text-2xl text-foreground`.

## Header Inline

Icons `h-7 w-auto` đều nhau. Gem + Streak + Avatar. Gap `gap-6`.
Notification dot trên avatar, không bell icon riêng.

## Sidebar Nav

Active: `bg-primary-tint text-primary font-bold`.
Inactive: `text-muted font-bold hover:bg-background`.
Icon `w-7 h-7`, text `text-base`, gap-4, px-4 py-3, rounded-xl.

## Skill Pill

`rounded-full px-3 py-1.5 bg-skill-{name}/10 text-skill-{name} text-xs font-bold` + dot.
