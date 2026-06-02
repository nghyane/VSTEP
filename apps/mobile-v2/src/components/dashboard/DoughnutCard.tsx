import { StyleSheet, Text, View } from "react-native";
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

export function DoughnutCard() {
  const c = useThemeColors();
  const { data: sessions } = useExamSessions();

  if (!sessions) return null;

  const counts = countBySkill(sessions);
  const total = SKILLS.reduce((sum, skill) => sum + counts[skill], 0);

  let cursor = 0;
  const segments = SKILLS.map((skill) => {
    const value = counts[skill];
    const percent = total > 0 ? value / total : 0;
    const dash = percent * CIRCUMFERENCE;
    const offset = cursor;
    cursor += dash;
    return { skill, value, dash, offsetDeg: (offset / CIRCUMFERENCE) * 360 };
  });

  return (
    <DepthCard style={styles.root}>
      <Text style={[styles.title, { color: c.foreground }]}>Số bài thi đã làm</Text>
      <Text style={[styles.subtitle, { color: c.subtle }]}>{total > 0 ? `Tổng ${total} lượt làm theo từng kỹ năng` : "Chưa có bài thi nào được hoàn thành"}</Text>

      <View style={styles.chartWrap}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke={c.background} strokeWidth={STROKE} />
          {total > 0
            ? segments.map((segment) =>
                segment.value === 0 ? null : (
                  <Circle
                    key={segment.skill}
                    cx={CENTER}
                    cy={CENTER}
                    r={RADIUS}
                    fill="none"
                    stroke={getSkillColor(segment.skill, c)}
                    strokeWidth={STROKE}
                    strokeDasharray={`${segment.dash} ${CIRCUMFERENCE - segment.dash}`}
                    strokeDashoffset={0}
                    strokeLinecap="butt"
                    transform={`rotate(${segment.offsetDeg - 90} ${CENTER} ${CENTER})`}
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
            {total}
          </SvgText>
          <SvgText
            x={CENTER}
            y={CENTER + 22}
            textAnchor="middle"
            alignmentBaseline="central"
            fontSize={11}
            fontWeight="700"
            fill={c.subtle}
          >
            LƯỢT
          </SvgText>
        </Svg>
      </View>

      <View style={styles.legendGrid}>
        {SKILLS.map((skill) => (
          <View key={skill} style={styles.legendItem}>
            <SkillIcon skill={skill} size={18} bare />
            <Text style={[styles.legendLabel, { color: c.foreground }]}>{SKILL_META[skill].vi}</Text>
            <Text style={[styles.legendValue, { color: getSkillColor(skill, c) }]}>{counts[skill]}</Text>
          </View>
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
  legendGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  legendItem: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
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
