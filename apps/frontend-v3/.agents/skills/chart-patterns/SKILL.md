---
name: chart-patterns
description: >
  Chart and data-visualization conventions (radar, bar, heatmap, trend lines).
  Load before creating or modifying any chart, graph, or visual data display.
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
