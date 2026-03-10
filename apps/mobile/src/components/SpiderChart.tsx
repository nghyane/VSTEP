import { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet } from "react-native";
import Svg, { Polygon, Circle, Line, Text as SvgText, G } from "react-native-svg";
import { useThemeColors, spacing } from "@/theme";
import type { Skill } from "@/types/api";

const SCREEN_W = Dimensions.get("window").width;
const CHART_SIZE = Math.min(SCREEN_W - 64, 300);
const CENTER = CHART_SIZE / 2;
const MAX_SCORE = 10;
const LEVELS = [2, 4, 6, 8, 10];
const LABEL_OFFSET = 22;

const SKILLS_META: { key: Skill; label: string }[] = [
  { key: "listening", label: "Nghe" },
  { key: "reading", label: "Đọc" },
  { key: "writing", label: "Viết" },
  { key: "speaking", label: "Nói" },
];

const SKILL_COLORS: Record<Skill, string> = {
  listening: "#4B7BF5",
  reading: "#34B279",
  writing: "#9B59D0",
  speaking: "#E5A817",
};

const AXIS_COUNT = SKILLS_META.length;
const RADIUS = CENTER - LABEL_OFFSET - 8;

function angleFor(i: number) {
  return (i * (2 * Math.PI)) / AXIS_COUNT - Math.PI / 2;
}

function pointAt(i: number, value: number): [number, number] {
  const r = (value / MAX_SCORE) * RADIUS;
  const a = angleFor(i);
  return [CENTER + r * Math.cos(a), CENTER + r * Math.sin(a)];
}

function polygonPoints(value: number): string {
  return SKILLS_META.map((_, i) => pointAt(i, value).join(",")).join(" ");
}

interface SpiderChartProps {
  skills: Record<Skill, { current: number; trend: string }>;
}

export function SpiderChart({ skills }: SpiderChartProps) {
  const c = useThemeColors();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const dataPoints = SKILLS_META.map((s, i) =>
    pointAt(i, skills[s.key]?.current ?? 0).join(","),
  ).join(" ");

  return (
    <Animated.View
      style={[
        styles.chartWrapper,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      <Svg width={CHART_SIZE} height={CHART_SIZE}>
        {/* Grid rings */}
        {LEVELS.map((lvl) => (
          <Polygon
            key={`grid-${lvl}`}
            points={polygonPoints(lvl)}
            fill="none"
            stroke={c.border}
            strokeWidth={lvl === MAX_SCORE ? 1.2 : 0.7}
            strokeDasharray={lvl === MAX_SCORE ? undefined : "4,4"}
          />
        ))}

        {/* Axis lines */}
        {SKILLS_META.map((_, i) => {
          const [x, y] = pointAt(i, MAX_SCORE);
          return (
            <Line
              key={`axis-${i}`}
              x1={CENTER}
              y1={CENTER}
              x2={x}
              y2={y}
              stroke={c.border}
              strokeWidth={0.7}
            />
          );
        })}

        {/* Data polygon */}
        <Polygon
          points={dataPoints}
          fill={c.primary + "25"}
          stroke={c.primary}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Vertex dots + score labels */}
        {SKILLS_META.map((s, i) => {
          const val = skills[s.key]?.current ?? 0;
          const [cx, cy] = pointAt(i, val);
          const skillColor = SKILL_COLORS[s.key];
          const a = angleFor(i);
          const textDx = Math.cos(a) * 14;
          const textDy = Math.sin(a) * 14;

          return (
            <G key={s.key}>
              <Circle cx={cx} cy={cy} r={7} fill={skillColor + "30"} />
              <Circle cx={cx} cy={cy} r={4} fill={skillColor} />
              <SvgText
                x={cx + textDx}
                y={cy + textDy}
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

        {/* Corner labels */}
        {SKILLS_META.map((s, i) => {
          const a = angleFor(i);
          const lx = CENTER + (RADIUS + LABEL_OFFSET) * Math.cos(a);
          const ly = CENTER + (RADIUS + LABEL_OFFSET) * Math.sin(a);
          const skillColor = SKILL_COLORS[s.key];

          return (
            <SvgText
              key={`label-${s.key}`}
              x={lx}
              y={ly}
              fontSize={13}
              fontWeight="600"
              fill={skillColor}
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
  chartWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
});
