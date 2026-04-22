import { StyleSheet, Text, View } from "react-native";
import { BouncyScrollView } from "@/components/BouncyScrollView";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { HapticTouchable } from "@/components/HapticTouchable";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SkillIcon, SKILL_LABELS } from "@/components/SkillIcon";
import { useProgress } from "@/hooks/use-progress";
import { useThemeColors, useSkillColor, spacing, radius, fontSize } from "@/theme";
import { Mascot } from "@/components/Mascot";
import type { Skill } from "@/types/api";

const SKILL_ORDER: Skill[] = ["listening", "reading", "writing", "speaking"];

const TREND_MAP: Record<string, { icon: string; label: string }> = {
  up: { icon: "↑", label: "Tiến bộ" },
  neutral: { icon: "→", label: "Ổn định" },
  down: { icon: "↓", label: "Giảm" },
};

export default function PracticeScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const { data, isLoading } = useProgress();

  if (isLoading) return <LoadingScreen />;

  const skills = data?.skills ?? [];

  return (
    <ScreenWrapper noPadding>
      <BouncyScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: c.foreground }]}>Luyện tập</Text>
        <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
          Chọn kỹ năng để bắt đầu
        </Text>

        <View style={styles.grid}>
          {SKILL_ORDER.map((skill) => (
            <SkillCard
              key={skill}
              skill={skill}
              progress={skills.find((s) => s.skill === skill)}
              onPress={() => router.push(`/(app)/practice/${skill}`)}
            />
          ))}
        </View>

        {/* Browse questions */}
        <HapticTouchable
          style={[styles.browseBtn, { backgroundColor: c.card, borderColor: c.border }]}
          onPress={() => router.push("/(app)/practice/browse")}
          activeOpacity={0.7}
        >
          <Ionicons name="search-outline" size={20} color={c.primary} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.foreground, fontWeight: "600", fontSize: fontSize.sm }}>Chọn câu hỏi cụ thể</Text>
            <Text style={{ color: c.mutedForeground, fontSize: fontSize.xs }}>Lọc theo Part, Level, dạng bài</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={c.mutedForeground} />
        </HapticTouchable>
      </BouncyScrollView>
    </ScreenWrapper>
  );
}

function SkillCard({
  skill,
  progress,
  onPress,
}: {
  skill: Skill;
  progress?: { currentLevel: string | null; attemptCount: number; streakCount?: number };
  onPress: () => void;
}) {
  const c = useThemeColors();
  const skillColor = useSkillColor(skill);
  const trend = TREND_MAP[((progress?.streakCount ?? 0) > 0 ? "up" : "neutral")];

  return (
    <HapticTouchable
      style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <SkillIcon skill={skill} size={22} />
        <Text style={[styles.levelBadge, { color: skillColor, backgroundColor: skillColor + "18" }]}>
          {progress?.currentLevel ?? "—"}
        </Text>
      </View>

      <Text style={[styles.cardTitle, { color: c.foreground }]}>{SKILL_LABELS[skill]}</Text>

      <View style={styles.cardMeta}>
        <Ionicons name="repeat-outline" size={14} color={c.mutedForeground} />
        <Text style={[styles.metaText, { color: c.mutedForeground }]}>
          {progress?.attemptCount ?? 0} lần
        </Text>
      </View>

      <Text style={[styles.trendText, { color: c.mutedForeground }]}>
        {trend.icon} {trend.label}
      </Text>
    </HapticTouchable>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: spacing["3xl"] },
  title: { fontSize: fontSize["2xl"], fontWeight: "700" },
  subtitle: { fontSize: fontSize.sm, marginTop: spacing.xs, marginBottom: spacing.base },
  hero: { alignItems: "center", marginBottom: spacing.base },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  card: {
    width: "48%",
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.base,
    gap: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  levelBadge: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  cardTitle: { fontSize: fontSize.base, fontWeight: "600" },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  metaText: { fontSize: fontSize.xs },
  trendText: { fontSize: fontSize.xs },
  browseBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.base,
    marginTop: spacing.md,
  },
});
