import { StyleSheet, Text, View } from "react-native";

import { DepthCard } from "@/components/DepthCard";
import { SkillIcon } from "@/components/SkillIcon";
import { HapticTouchable } from "@/components/HapticTouchable";
import { useOverview } from "@/hooks/use-progress";
import { useThemeColors, spacing, fontSize, fontFamily, radius } from "@/theme";
import { getTargetBand } from "@/lib/vstep";
import type { Skill } from "@/types/api";

const SKILLS: Skill[] = ["listening", "reading", "writing", "speaking"];
const SKILL_META: Record<Skill, { vi: string }> = {
  listening: { vi: "Nghe" },
  reading: { vi: "Đọc" },
  writing: { vi: "Viết" },
  speaking: { vi: "Nói" },
};

type GapStatus = "pass" | "gap" | "fail" | "none";

function getSkillColor(skill: Skill): string {
  const map: Record<Skill, string> = {
    listening: "#1CB0F6",
    reading: "#7850C8",
    writing: "#58CC02",
    speaking: "#FFC800",
  };
  return map[skill];
}

function getStatus(current: number | null, targetBand: number): GapStatus {
  if (current === null) return "none";
  const gap = current - targetBand;
  if (gap >= 0) return "pass";
  if (gap < -1) return "fail";
  return "gap";
}

function getStatusText(status: GapStatus, gap: number | null): string {
  if (status === "none") return "Chưa thi";
  if (status === "pass") return "✓ Đạt";
  if (gap !== null) return `${gap.toFixed(1)}`;
  return "—";
}

export function GapAnalysis() {
  const c = useThemeColors();
  const { data } = useOverview();

  if (!data?.chart) return null;

  const targetBand = getTargetBand(data.profile.targetLevel);
  const gaps = SKILLS.map((skill) => {
    const current = data.chart?.[skill] ?? null;
    const gap = current !== null ? Math.round((current - targetBand) * 10) / 10 : null;
    const status = getStatus(current, targetBand);
    return { skill, current, gap, status };
  });

  const weakest = gaps
    .filter((g) => g.gap !== null && g.gap < 0)
    .sort((a, b) => (a.gap ?? 0) - (b.gap ?? 0))[0];

  return (
    <DepthCard style={styles.root}>
      <Text style={[styles.title, { color: c.foreground }]}>Khoảng cách mục tiêu</Text>
      <Text style={[styles.subtitle, { color: c.subtle }]}>
        Mục tiêu{" "}
        <Text style={{ fontFamily: fontFamily.extraBold, color: c.primaryDark }}>
          {data.profile.targetLevel} ({targetBand})
        </Text>{" "}
        cho mỗi kỹ năng
      </Text>

      <View style={styles.gapList}>
        {gaps.map((g) => (
          <GapRow
            key={g.skill}
            skill={g.skill}
            current={g.current}
            targetBand={targetBand}
            status={g.status}
            gap={g.gap}
          />
        ))}
      </View>

      {weakest && (
        <HapticTouchable
          style={[styles.weakestRow, { backgroundColor: c.surfaceTint }]}
          onPress={() => {}}
          activeOpacity={0.85}
        >
          <SkillIcon skill={weakest.skill} size={22} bare />
          <View style={styles.weakestInfo}>
            <Text style={[styles.weakestLabel, { color: c.subtle }]}>Tập trung kỹ năng yếu nhất</Text>
            <Text style={[styles.weakestValue, { color: c.foreground }]}>
              {SKILL_META[weakest.skill].vi} · cách mục tiêu {Math.abs(weakest.gap ?? 0).toFixed(1)} band
            </Text>
          </View>
          <Text style={[styles.weakestArrow, { color: c.mutedForeground }]}>→</Text>
        </HapticTouchable>
      )}
    </DepthCard>
  );
}

function GapRow({
  skill,
  current,
  targetBand,
  status,
  gap,
}: {
  skill: Skill;
  current: number | null;
  targetBand: number;
  status: GapStatus;
  gap: number | null;
}) {
  const c = useThemeColors();

  const statusColor = status === "fail" ? c.destructive : status === "pass" ? c.success : c.subtle;
  const scoreColor = status === "fail" ? c.destructive : current === null ? c.subtle : c.foreground;
  const scoreText = current !== null ? current.toFixed(1) : "—";

  return (
    <View style={styles.gapRow}>
      <View style={[styles.dot, { backgroundColor: getSkillColor(skill) }]} />
      <Text style={[styles.gapLabel, { color: c.mutedForeground }]}>{SKILL_META[skill].vi}</Text>
      <View style={styles.gapScoreRow}>
        <Text style={[styles.gapScore, { color: scoreColor }]}>{scoreText}</Text>
        <Text style={[styles.gapTarget, { color: c.subtle }]}> / {targetBand}</Text>
      </View>
      <Text style={[styles.gapStatus, { color: statusColor }]}>
        {getStatusText(status, gap)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  title: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.extraBold,
  },
  subtitle: {
    fontSize: fontSize.xs,
    marginTop: 4,
  },
  gapList: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  gapRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  gapLabel: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semiBold,
    width: 36,
  },
  gapScoreRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  gapScore: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.extraBold,
  },
  gapTarget: {
    fontSize: fontSize.xs,
  },
  gapStatus: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bold,
    marginLeft: "auto",
  },
  weakestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.base,
    padding: spacing.md,
    borderRadius: radius.xl,
  },
  weakestInfo: {
    flex: 1,
  },
  weakestLabel: {
    fontSize: fontSize.xs,
  },
  weakestValue: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bold,
  },
  weakestArrow: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bold,
  },
});
