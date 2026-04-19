# Skill: Chart Patterns

Library: Recharts. Reference: `apps/mockup/screens/dashboard.html` SVG charts.

## Spider Chart (Radar)

4 axes: Listening, Reading, Writing, Speaking. Scale 0-10.
2 polygons: current (brand fill 15%, stroke 2.5px) + target B2 (error dashed).
Dots per skill in skill color. Labels in skill color.

```tsx
<RadarChart data={data}>
  <PolarGrid stroke="#E5E5E5" />
  <PolarAngleAxis dataKey="skill" />
  <PolarRadiusAxis domain={[0, 10]} />
  <Radar name="Mục tiêu" dataKey="target" stroke="#EA4335" strokeDasharray="4 3" fill="#EA4335" fillOpacity={0.05} />
  <Radar name="Hiện tại" dataKey="current" stroke="#58CC02" fill="#58CC02" fillOpacity={0.15} />
</RadarChart>
```

Ẩn nếu `total_tests < min_tests_required`. Show placeholder text.

## Grouped Bar + Avg Line

X = test dates. Y = band 0-10. 4 bars per test (skill colors, opacity 0.65).
1 line = overall average (brand-dark #478700, stroke 2px).
Target dashed line B2=6.0 (error red).
Skill toggle pills bật/tắt bars.

## Heatmap

grid-rows-7 grid-flow-col. Day labels T2-CN trái. Month labels trên.
Cells h-4 rounded gap-1. 5 levels: ink-200, brand/25, brand/50, brand/75, brand.
Data = drill duration only. Weekdays active hơn weekends.
