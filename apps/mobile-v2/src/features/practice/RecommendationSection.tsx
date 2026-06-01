import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { GameIcon } from "@/components/GameIcon";
import { SkillIcon } from "@/components/SkillIcon";
import { useLearningPath } from "@/features/practice/use-learning-path";
import { fontFamily, fontSize, radius, spacing, useThemeColors, type ThemeColors } from "@/theme";
import type { LearningPathSkill, Skill } from "@/types/api";

const SKILL_LABELS: Record<LearningPathSkill["skill"], string> = {
  listening: "Nghe",
  reading: "Đọc",
  writing: "Viết",
  speaking: "Nói",
  vocabulary: "Từ vựng",
  grammar: "Ngữ pháp",
};

function isCoreSkill(skill: LearningPathSkill["skill"]): skill is Skill {
  return skill === "listening" || skill === "reading" || skill === "writing" || skill === "speaking";
}

function routeForSkill(skill: LearningPathSkill["skill"]): string {
  switch (skill) {
    case "listening": return "/(app)/practice/listening";
    case "reading": return "/(app)/practice/reading";
    case "writing": return "/(app)/practice/writing";
    case "speaking": return "/(app)/practice/speaking";
    case "vocabulary": return "/(app)/vocabulary";
    case "grammar": return "/(app)/practice/grammar";
  }
}

function weakSkills(skills: LearningPathSkill[]): LearningPathSkill[] {
  return skills.filter((item) => {
    if (item.band !== null && item.band < 5) return true;
    if (item.coveragePct !== null && item.coveragePct < 50) return true;
    return false;
  });
}

function dotColor(item: LearningPathSkill, c: ThemeColors): string {
  if (item.band === null) return c.border;
  if (item.skill === "vocabulary" || item.skill === "grammar") return c.info;
  if (item.band >= 8.5) return c.success;
  if (item.band >= 5) return c.warning;
  return c.destructive;
}

export function RecommendationSection() {
  const c = useThemeColors();
  const router = useRouter();
  const { data } = useLearningPath();

  if (!data) return null;

  const items = weakSkills(data.skills);
  if (items.length === 0) return null;

  return (
    <View style={styles.root}>
      <Text style={[styles.title, { color: c.foreground }]}>Gợi ý luyện tập</Text>
      <Text style={[styles.subtitle, { color: c.subtle }]}>
        Dựa trên kết quả thi thử · {data.currentLevel} → {data.targetLevel}
        {data.daysRemaining !== null ? ` · còn ${data.daysRemaining} ngày` : ""}
      </Text>

      <DepthCard style={styles.card}>
        {items.map((item) => (
          <RecommendationRow
            key={item.skill}
            item={item}
            onPress={() => router.push(routeForSkill(item.skill) as never)}
          />
        ))}
      </DepthCard>
    </View>
  );
}

function RecommendationRow({
  item,
  onPress,
}: {
  item: LearningPathSkill;
  onPress: () => void;
}) {
  const c = useThemeColors();
  const metric = item.band !== null
    ? item.band.toFixed(1)
    : item.coveragePct !== null
      ? `${item.coveragePct}%`
      : null;

  return (
    <View style={[styles.row, { borderBottomColor: c.borderLight }]}>
      <View style={[styles.dot, { backgroundColor: dotColor(item, c) }]} />
      <View style={[styles.iconWrap, { backgroundColor: c.surfaceTint }]}>
        {isCoreSkill(item.skill) ? (
          <SkillIcon skill={item.skill} size={20} bare />
        ) : (
          <GameIcon name={item.skill === "vocabulary" ? "vocabulary" : "grammar"} size={20} />
        )}
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={[styles.skillLabel, { color: c.foreground }]}>{SKILL_LABELS[item.skill]}</Text>
          {metric ? <Text style={[styles.metric, { color: c.subtle }]}>{metric}</Text> : null}
        </View>
        <Text style={[styles.suggestion, { color: c.mutedForeground }]} numberOfLines={2}>
          {item.suggestion ?? "Tiếp tục luyện đều để giữ nhịp tiến bộ."}
        </Text>
      </View>
      <DepthButton variant="secondary" size="sm" onPress={onPress}>
        {isCoreSkill(item.skill) ? "Luyện" : "Vào học"}
      </DepthButton>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.extraBold,
  },
  subtitle: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  card: {
    paddingVertical: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  skillLabel: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.extraBold,
  },
  metric: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.bold,
  },
  suggestion: {
    fontSize: fontSize.xs,
    lineHeight: 18,
  },
});
