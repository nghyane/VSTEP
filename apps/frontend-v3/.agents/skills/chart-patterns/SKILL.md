---
name: chart-patterns
description: "SVG chart specs: spider/radar, grouped bar + trend line, heatmap. Load when creating or modifying dashboard charts."
---

# Chart Patterns

## Spider Chart (Radar)

4 axes from SkillKey. Scale 0-10. Two polygons: current (primary) + target (destructive dashed).
Reference: `src/features/dashboard/components/SpiderCard.tsx`

## Grouped Bar + Average Line

X = test dates. Y = band 0-10. 4 bars per test (skill colors, opacity 0.65).
One line = overall average (primary-dark). Target dashed line (destructive).
Reference: `src/features/dashboard/components/ScoreTrend.tsx`

## Heatmap

grid-rows-7 grid-flow-col. Day labels Mon-Sun. 5 intensity levels using primary opacity.
Reference: `src/features/dashboard/components/ActivityHeatmap.tsx`

## Rules

- Hide spider if total_tests < min_tests_required
- Colors from `SKILL_CONFIG` (`lib/skills.ts`), never hardcode hex
- Rounding via `round()` from `lib/utils.ts`
- Data from API, no mock data in components
