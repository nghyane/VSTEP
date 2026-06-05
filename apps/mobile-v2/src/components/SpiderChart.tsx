// SpiderChart — SVG radar chart for 4 VSTEP skills
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, useWindowDimensions } from "react-native";
import Svg, { Polygon, Circle, Line, Text as SvgText, G } from "react-native-svg";
import { useThemeColors } from "@/theme";
import type { Skill } from "@/types/api";

const MAX_SCORE = 10;
const LEVELS = [2, 4, 6, 8, 10];
const LABEL_OFFSET = 22;

const SKILLS_META: { key: Skill; label: string }[] = [
  { key: "listening", label: "Nghe" },
  { key: "reading",   label: "Đọc" },
  { key: "writing",   label: "Viết" },
  { key: "speaking",  label: "Nói" },
];

const SKILL_COLORS: Record<Skill, string> = {
  listening: "#1CB0F6",
  reading:   "#7850C8",
  writing:   "#58CC02",
  speaking:  "#FFC800",
};

const AXIS_COUNT = SKILLS_META.length;
function angleFor(i: number) {
  return (i * (2 * Math.PI)) / AXIS_COUNT - Math.PI / 2;
}

function pointAt(i: number, value: number, center: number, radius: number): [number, number] {
  const r = (value / MAX_SCORE) * radius;
  const a = angleFor(i);
  return [center + r * Math.cos(a), center + r * Math.sin(a)];
}

function polygonPoints(value: number, center: number, radius: number): string {
  return SKILLS_META.map((_, i) => pointAt(i, value, center, radius).join(",")).join(" ");
}

interface SpiderChartProps {
  skills: Record<Skill, { current: number; trend: string }>;
  targetBand?: number;
  hasData?: boolean;
}

export function SpiderChart({ skills, targetBand, hasData = true }: SpiderChartProps) {
  const c = useThemeColors();
  const { width } = useWindowDimensions();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const chartSize = Math.min(width >= 768 ? width * 0.42 : width - 64, width >= 1024 ? 360 : 320);
  const center = chartSize / 2;
  const radius = center - LABEL_OFFSET - 8;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const dataPoints = SKILLS_META.map((s, i) =>
    pointAt(i, skills[s.key]?.current ?? 0, center, radius).join(","),
  ).join(" ");

  return (
    <Animated.View
      style={[styles.wrapper, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
    >
      <Svg width={chartSize} height={chartSize}>
        {LEVELS.map((lvl) => (
          <Polygon
            key={`grid-${lvl}`}
            points={polygonPoints(lvl, center, radius)}
            fill="none"
            stroke={c.border}
            strokeWidth={lvl === MAX_SCORE ? 1.2 : 0.7}
            strokeDasharray={lvl === MAX_SCORE ? undefined : "4,4"}
          />
        ))}

        {SKILLS_META.map((_, i) => {
          const [x, y] = pointAt(i, MAX_SCORE, center, radius);
          return (
            <Line
              key={`axis-${i}`}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke={c.border}
              strokeWidth={0.7}
            />
          );
        })}

        {targetBand !== undefined ? (
          <Polygon
            points={polygonPoints(targetBand, center, radius)}
            fill="none"
            stroke={c.destructive}
            strokeWidth={1.4}
            strokeDasharray="5,4"
            opacity={0.7}
          />
        ) : null}

        {hasData ? (
          <Polygon
            points={dataPoints}
            fill={c.primary + "25"}
            stroke={c.primary}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        ) : null}

        {SKILLS_META.map((s, i) => {
          const val = skills[s.key]?.current ?? 0;
          if (!hasData || val <= 0) return null;

          const [cx, cy] = pointAt(i, val, center, radius);
          const skillColor = SKILL_COLORS[s.key];
          const a = angleFor(i);

          return (
            <G key={s.key}>
              <Circle cx={cx} cy={cy} r={7} fill={skillColor + "30"} />
              <Circle cx={cx} cy={cy} r={4} fill={skillColor} />
              <SvgText
                x={cx + Math.cos(a) * 14}
                y={cy + Math.sin(a) * 14}
                fontSize={11}
                fontWeight="700"
                fill={c.foreground}
                textAnchor="middle"
                alignmentBaseline="central"
              >
                {val.toFixed(1)}
              </SvgText>
            </G>
          );
        })}

        {SKILLS_META.map((s, i) => {
          const a = angleFor(i);
          const lx = center + (radius + LABEL_OFFSET) * Math.cos(a);
          const ly = center + (radius + LABEL_OFFSET) * Math.sin(a);

          return (
            <SvgText
              key={`label-${s.key}`}
              x={lx}
              y={ly}
              fontSize={13}
              fontWeight="600"
              fill={SKILL_COLORS[s.key]}
              textAnchor="middle"
              alignmentBaseline="central"
            >
              {s.label}
            </SvgText>
          );
        })}
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center", justifyContent: "center", paddingVertical: 8 },
});
