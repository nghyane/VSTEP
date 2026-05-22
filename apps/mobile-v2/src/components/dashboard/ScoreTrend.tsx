import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { DepthCard } from "@/components/DepthCard";
import { HapticTouchable } from "@/components/HapticTouchable";
import { SkillIcon } from "@/components/SkillIcon";
import { api } from "@/lib/api";
import { useOverview } from "@/hooks/use-progress";
import { getTargetBand } from "@/lib/vstep";
import { useThemeColors, spacing, fontSize, fontFamily, radius, type ThemeColors } from "@/theme";
import type { ExamSessionResult, Skill } from "@/types/api";

const SKILLS: Skill[] = ["listening", "reading", "writing", "speaking"];
const SKILL_META: Record<Skill, { vi: string }> = {
  listening: { vi: "Nghe" },
  reading: { vi: "Đọc" },
  writing: { vi: "Viết" },
  speaking: { vi: "Nói" },
};

function getSkillColor(skill: Skill, theme: ReturnType<typeof useThemeColors>): string {
  const map: Record<Skill, string> = {
    listening: theme.info,
    reading: theme.skillReading,
    writing: theme.primary,
    speaking: theme.coin,
  };
  return map[skill];
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function computeAvg(scores: Record<Skill, number | null>): number {
  const vals = SKILLS.map((s) => scores[s]).filter((v): v is number => v !== null);
  if (vals.length === 0) return 0;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

export function ScoreTrend() {
  const c = useThemeColors();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data: overview } = useOverview();
  const { data, isLoading } = useQuery({
    queryKey: ["exam-sessions"],
    queryFn: () => api.get<ExamSessionResult[]>("/api/v1/exam-sessions"),
  });

  if (isLoading || !data || !overview) return null;

  const sessions = data;
  if (!sessions || sessions.length === 0) {
    return (
      <DepthCard style={styles.root}>
        <Text style={[styles.title, { color: c.foreground }]}>Điểm qua các lần thi</Text>
        <Text style={[styles.subtitle, { color: c.subtle }]}>Chưa có bài thi thử nào</Text>
      </DepthCard>
    );
  }

  const targetBand = getTargetBand(overview.profile.targetLevel);
  const tests = sessions
    .filter((s): s is ExamSessionResult & { scores: Record<Skill, number | null>; submittedAt: string } =>
      s.submittedAt !== null && s.scores !== null,
    )
    .slice(0, 10)
    .reverse();

  if (tests.length === 0) {
    return (
      <DepthCard style={styles.root}>
        <Text style={[styles.title, { color: c.foreground }]}>Điểm qua các lần thi</Text>
        <Text style={[styles.subtitle, { color: c.subtle }]}>Chưa có bài thi thử nào</Text>
      </DepthCard>
    );
  }

  return (
    <DepthCard style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: c.foreground }]}>Điểm qua các lần thi</Text>
          <Text style={[styles.subtitle, { color: c.subtle }]}>
            {tests.length} bài thi gần nhất
          </Text>
        </View>
        <View style={[styles.targetBadge, { backgroundColor: c.destructiveTint }]}>
          <Text style={[styles.targetBadgeText, { color: c.destructive }]}>
            Mục tiêu: {targetBand}
          </Text>
        </View>
      </View>

      {/* Skill legend */}
      <View style={styles.legend}>
        {SKILLS.map((s) => (
          <View key={s} style={styles.legendItem}>
            <SkillIcon skill={s} size={14} bare />
            <Text style={[styles.legendText, { color: getSkillColor(s, c) }]}>
              {SKILL_META[s].vi}
            </Text>
          </View>
        ))}
      </View>

      {/* Test rows */}
      <View style={styles.testRows}>
        {tests.map((test) => {
          const avg = computeAvg(test.scores);
          const aboveTarget = avg >= targetBand;

          return (
            <ScoreRow
              key={test.id}
              test={test}
              avg={avg}
              aboveTarget={aboveTarget}
              expanded={expandedId === test.id}
              onPress={() => setExpandedId(expandedId === test.id ? null : test.id)}
            />
          );
        })}
      </View>
    </DepthCard>
  );
}

interface ScoreRowProps {
  test: ExamSessionResult & { scores: Record<Skill, number | null>; submittedAt: string };
  avg: number;
  aboveTarget: boolean;
  expanded: boolean;
  onPress: () => void;
}

function ScoreRow({ test, avg, aboveTarget, expanded, onPress }: ScoreRowProps) {
  const c = useThemeColors();

  return (
    <HapticTouchable onPress={onPress} activeOpacity={0.85} scalePress>
      <View style={[styles.testRow, { borderBottomColor: c.border }]}>
        <View style={styles.testInfo}>
          <Text style={[styles.testDate, { color: c.subtle }]}>{formatShortDate(test.submittedAt)}</Text>
          <ScoreBars scores={test.scores} colors={c} />
          {expanded && <SkillBreakdown scores={test.scores} />}
        </View>
        <View style={styles.avgBadge}>
          <Text style={[styles.avgValue, { color: aboveTarget ? c.success : c.destructive }]}>{avg.toFixed(1)}</Text>
          <Text style={[styles.expandHint, { color: c.subtle }]}>{expanded ? "Ẩn" : "Chi tiết"}</Text>
        </View>
      </View>
    </HapticTouchable>
  );
}

function ScoreBars({ scores, colors }: { scores: Record<Skill, number | null>; colors: ThemeColors }) {
  return (
    <View style={styles.scoreDots}>
      {SKILLS.map((skill) => {
        const score = scores[skill] ?? 0;
        const ratio = score / 10;
        return (
          <View
            key={skill}
            style={[styles.scoreBar, { width: Math.max(4, ratio * 40), backgroundColor: getSkillColor(skill, colors), opacity: score > 0 ? 0.8 : 0.2 }]}
          />
        );
      })}
    </View>
  );
}

function SkillBreakdown({ scores }: { scores: Record<Skill, number | null> }) {
  const c = useThemeColors();
  return (
    <View style={styles.breakdown}>
      {SKILLS.map((skill) => (
        <View key={skill} style={styles.breakdownItem}>
          <Text style={[styles.breakdownLabel, { color: getSkillColor(skill, c) }]}>{SKILL_META[skill].vi}</Text>
          <Text style={[styles.breakdownValue, { color: c.foreground }]}>{scores[skill]?.toFixed(1) ?? "—"}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.extraBold,
  },
  subtitle: {
    fontSize: fontSize.xs,
    marginTop: 4,
  },
  targetBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.md,
  },
  targetBadgeText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.bold,
  },
  legend: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.bold,
  },
  testRows: {
    gap: spacing.sm,
  },
  testRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  testInfo: {
    flex: 1,
    gap: 4,
  },
  testDate: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.semiBold,
  },
  scoreDots: {
    flexDirection: "row",
    gap: 2,
    alignItems: "center",
  },
  scoreBar: {
    height: 6,
    borderRadius: 3,
  },
  avgBadge: {
    alignItems: "center",
  },
  avgValue: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.extraBold,
  },
  expandHint: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
  },
  breakdown: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  breakdownItem: {
    minWidth: 70,
  },
  breakdownLabel: {
    fontSize: 10,
    fontFamily: fontFamily.extraBold,
  },
  breakdownValue: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.extraBold,
  },
});
