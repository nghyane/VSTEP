import { useState } from "react";
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent } from "react-native";
import Svg, { Circle, Text as SvgText } from "react-native-svg";

import { DepthCard } from "@/components/DepthCard";
import { SkillIcon } from "@/components/SkillIcon";
import { useExamSessions } from "@/hooks/use-exams";
import { fontFamily, fontSize, radius, spacing, type ThemeColors, useThemeColors } from "@/theme";
import type { ExamSessionResult, Skill } from "@/types/api";

const SKILLS: Skill[] = ["listening", "reading", "writing", "speaking"];
const SIZE = 200;
const CENTER = SIZE / 2;
const RADIUS = 70;
const STROKE = 28;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const SKILL_META: Record<Skill, { vi: string }> = {
  listening: { vi: "Nghe" },
  reading: { vi: "Đọc" },
  writing: { vi: "Viết" },
  speaking: { vi: "Nói" },
};

function getSkillColor(skill: Skill, theme: ThemeColors): string {
  const map: Record<Skill, string> = {
    listening: theme.skillListening,
    reading: theme.skillReading,
    writing: theme.skillWriting,
    speaking: theme.skillSpeaking,
  };
  return map[skill];
}

function countBySkill(sessions: ExamSessionResult[]): Record<Skill, number> {
  const result: Record<Skill, number> = { listening: 0, reading: 0, writing: 0, speaking: 0 };
  for (const session of sessions) {
    if (session.submittedAt === null || session.scores === null) continue;
    for (const skill of SKILLS) {
      if (session.scores[skill] !== null && session.scores[skill] !== undefined) {
        result[skill] += 1;
      }
    }
  }
  return result;
}

function averageBySkill(sessions: ExamSessionResult[]): Record<Skill, number | null> {
  const result: Record<Skill, number | null> = { listening: null, reading: null, writing: null, speaking: null };
  for (const skill of SKILLS) {
    const values = sessions
      .map((session) => session.scores?.[skill] ?? null)
      .filter((value): value is number => value !== null);
    result[skill] = values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  }
  return result;
}

function selectedSkillFromPress(event: GestureResponderEvent, segments: { skill: Skill; value: number; percent: number; offsetDeg: number }[]): Skill | null {
  const { locationX, locationY } = event.nativeEvent;
  const dx = locationX - CENTER;
  const dy = locationY - CENTER;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const innerRadius = RADIUS - STROKE / 2 - 8;
  const outerRadius = RADIUS + STROKE / 2 + 8;

  if (distance < innerRadius || distance > outerRadius) return null;

  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const clockwiseFromTop = (angle + 90 + 360) % 360;

  return segments.find((segment) => {
    if (segment.value === 0) return false;
    const start = segment.offsetDeg;
    const end = start + segment.percent * 360;
    return clockwiseFromTop >= start && clockwiseFromTop < end;
  })?.skill ?? null;
}

export function DoughnutCard() {
  const c = useThemeColors();
  const [activeSkill, setActiveSkill] = useState<Skill | null>(null);
  const { data: sessions } = useExamSessions();

  if (!sessions) return null;

  const counts = countBySkill(sessions);
  const averages = averageBySkill(sessions);
  const total = SKILLS.reduce((sum, skill) => sum + counts[skill], 0);

  let cursor = 0;
  const segments = SKILLS.map((skill) => {
    const value = counts[skill];
    const average = averages[skill];
    const percent = total > 0 ? value / total : 0;
    const dash = percent * CIRCUMFERENCE;
    const offset = cursor;
    cursor += dash;
    return { skill, value, average, percent, dash, offsetDeg: (offset / CIRCUMFERENCE) * 360 };
  });
  const activeSegment = segments.find((segment) => segment.skill === activeSkill && segment.value > 0) ?? null;
  const centerValue = activeSegment ? activeSegment.value : total;
  const centerLabel = activeSegment ? SKILL_META[activeSegment.skill].vi : "LƯỢT";

  function handleChartPress(event: GestureResponderEvent) {
    const skill = selectedSkillFromPress(event, segments);
    setActiveSkill((current) => (skill === current ? null : skill));
  }

  return (
    <DepthCard style={styles.root}>
      <Text style={[styles.title, { color: c.foreground }]}>Số bài thi đã làm</Text>
      <Text style={[styles.subtitle, { color: c.subtle }]}>{total > 0 ? `Tổng ${total} lượt làm theo từng kỹ năng` : "Chưa có bài thi nào được hoàn thành"}</Text>

      <View style={styles.chartWrap}>
        <Pressable style={styles.chartPressable} onPress={handleChartPress}>
          <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke={c.background} strokeWidth={STROKE} />
            {total > 0
              ? segments.map((segment) =>
                  segment.value === 0 ? null : (
                    <Circle
                      key={segment.skill}
                      cx={CENTER}
                      cy={CENTER}
                      r={activeSkill === segment.skill ? RADIUS + 2 : RADIUS}
                      fill="none"
                      stroke={getSkillColor(segment.skill, c)}
                      strokeWidth={activeSkill === segment.skill ? STROKE + 6 : STROKE}
                      strokeDasharray={`${segment.dash} ${CIRCUMFERENCE - segment.dash}`}
                      strokeDashoffset={0}
                      strokeLinecap="butt"
                      transform={`rotate(${segment.offsetDeg - 90} ${CENTER} ${CENTER})`}
                      opacity={activeSkill !== null && activeSkill !== segment.skill ? 0.35 : 0.95}
                    />
                  ),
                )
              : null}
            <SvgText
              x={CENTER}
              y={CENTER - 6}
              textAnchor="middle"
              alignmentBaseline="central"
              fontSize={36}
              fontWeight="800"
              fill={c.foreground}
            >
              {centerValue}
            </SvgText>
            <SvgText
              x={CENTER}
              y={CENTER + 22}
              textAnchor="middle"
              alignmentBaseline="central"
              fontSize={activeSegment ? 13 : 11}
              fontWeight="700"
              fill={activeSegment ? getSkillColor(activeSegment.skill, c) : c.subtle}
            >
              {centerLabel}
            </SvgText>
          </Svg>
        </Pressable>
      </View>

      {activeSegment ? (
        <View style={[styles.activeInfo, { backgroundColor: c.surface, borderColor: getSkillColor(activeSegment.skill, c) + "45" }]}> 
          <Text style={[styles.activeInfoLabel, { color: c.subtle }]}>Điểm trung bình {SKILL_META[activeSegment.skill].vi}</Text>
          <Text style={[styles.activeInfoValue, { color: getSkillColor(activeSegment.skill, c) }]}> 
            {activeSegment.average !== null ? activeSegment.average.toFixed(1) : "—"}
            <Text style={{ fontSize: fontSize.xs, color: c.subtle }}> /10 · {Math.round(activeSegment.percent * 100)}% tổng lượt</Text>
          </Text>
        </View>
      ) : null}

      <View style={styles.legendGrid}>
        {SKILLS.map((skill) => (
          <Pressable
            key={skill}
            onPress={() => setActiveSkill(activeSkill === skill ? null : skill)}
            style={[
              styles.legendItem,
              { borderColor: activeSkill === skill ? getSkillColor(skill, c) : "transparent", backgroundColor: activeSkill === skill ? c.surface : "transparent" },
            ]}
          >
            <SkillIcon skill={skill} size={18} bare />
            <Text style={[styles.legendLabel, { color: c.foreground }]}>{SKILL_META[skill].vi}</Text>
            <Text style={[styles.legendValue, { color: getSkillColor(skill, c) }]}>{counts[skill]}</Text>
          </Pressable>
        ))}
      </View>
    </DepthCard>
  );
}

const styles = StyleSheet.create({
  root: {
    marginBottom: spacing.base,
  },
  title: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.extraBold,
  },
  subtitle: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  chartWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.base,
  },
  chartPressable: {
    width: SIZE,
    height: SIZE,
  },
  legendGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  activeInfo: {
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  activeInfoLabel: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.bold,
  },
  activeInfoValue: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.extraBold,
    marginTop: 2,
  },
  legendItem: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1.5,
    borderRadius: radius.button,
    padding: spacing.sm,
  },
  legendLabel: {
    flex: 1,
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bold,
  },
  legendValue: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.extraBold,
  },
});
