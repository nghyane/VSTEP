import { useEffect } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Logo } from "@/components/Logo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SkillIcon, SKILL_LABELS } from "@/components/SkillIcon";
import { useAuth } from "@/hooks/use-auth";
import { useProgress } from "@/hooks/use-progress";
import { useThemeColors, useSkillColor, spacing, radius, fontSize } from "@/theme";
import type { Skill } from "@/types/api";

const SKILL_ORDER: Skill[] = ["listening", "reading", "writing", "speaking"];

export default function HomeScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const { user } = useAuth();
  const progress = useProgress();

  // Redirect new users (no goal) to onboarding — runs exactly once
  useEffect(() => {
    if (!progress.isLoading && progress.data && !progress.data.goal) {
      router.replace("/(app)/onboarding");
    }
  }, [progress.isLoading, progress.data, router]);

  if (progress.isLoading) return <LoadingScreen />;

  const skills = progress.data?.skills ?? [];
  const goal = progress.data?.goal;
  const totalAttempts = skills.reduce((sum, s) => sum + s.attemptCount, 0);

  return (
    <ScreenWrapper>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Header with Logo */}
        <View style={styles.headerRow}>
          <View style={styles.greeting}>
            <Text style={[styles.greetingText, { color: c.foreground }]}>
              Xin chào, {user?.fullName ?? "bạn"} 👋
            </Text>
            <Text style={[styles.greetingSub, { color: c.mutedForeground }]}>
              Hãy tiếp tục luyện tập hôm nay!
            </Text>
          </View>
          <Logo size="sm" />
        </View>

        {/* Hero Action — Practice */}
        <TouchableOpacity
          style={[styles.heroCard, { backgroundColor: c.primary }]}
          onPress={() => router.push("/(app)/practice")}
          activeOpacity={0.85}
        >
          <View style={styles.heroLeft}>
            <Ionicons name="school" size={28} color={c.primaryForeground} />
          </View>
          <View style={styles.heroText}>
            <Text style={[styles.heroTitle, { color: c.primaryForeground }]}>Luyện tập ngay</Text>
            <Text style={[styles.heroSub, { color: c.primaryForeground + "CC" }]}>
              Chọn kỹ năng và bắt đầu làm bài
            </Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={28} color={c.primaryForeground + "AA"} />
        </TouchableOpacity>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: c.muted }]}>
            <Ionicons name="flask" size={18} color={c.primary} />
            <Text style={[styles.statValue, { color: c.foreground }]}>{totalAttempts}</Text>
            <Text style={[styles.statLabel, { color: c.mutedForeground }]}>Bài đã làm</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: c.muted }]}>
            <Ionicons name="layers" size={18} color={c.primary} />
            <Text style={[styles.statValue, { color: c.foreground }]}>{skills.length}</Text>
            <Text style={[styles.statLabel, { color: c.mutedForeground }]}>Kỹ năng</Text>
          </View>
          {goal && (
            <View style={[styles.statBox, { backgroundColor: c.muted }]}>
              <Ionicons name="flag" size={18} color={c.primary} />
              <Text style={[styles.statValue, { color: c.foreground }]}>{goal.targetBand}</Text>
              <Text style={[styles.statLabel, { color: c.mutedForeground }]}>Mục tiêu</Text>
            </View>
          )}
        </View>

        {/* Skill Overview */}
        <Text style={[styles.sectionTitle, { color: c.foreground }]}>Kỹ năng</Text>
        <View style={styles.skillGrid}>
          {SKILL_ORDER.map((skill) => {
            const sp = skills.find((s) => s.skill === skill);
            return (
              <SkillCard
                key={skill}
                skill={skill}
                level={sp?.currentLevel ?? null}
                attempts={sp?.attemptCount ?? 0}
                onPress={() => router.push(`/(app)/skill/${skill}`)}
                colors={c}
              />
            );
          })}
        </View>

        {/* Goal Card */}
        {goal && (
          <View style={[styles.goalCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={styles.goalRow}>
              <Ionicons name="flag" size={16} color={c.primary} />
              <Text style={[styles.goalTitle, { color: c.foreground }]}>Mục tiêu học tập</Text>
            </View>
            <Text style={[styles.goalMeta, { color: c.mutedForeground }]}>
              Band {goal.targetBand}
              {goal.deadline
                ? ` · Hạn: ${new Date(goal.deadline).toLocaleDateString("vi-VN")}`
                : ""}
              {goal.dailyStudyTimeMinutes ? ` · ${goal.dailyStudyTimeMinutes} phút/ngày` : ""}
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

function SkillCard({
  skill,
  level,
  attempts,
  onPress,
  colors: c,
}: {
  skill: Skill;
  level: string | null;
  attempts: number;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const skillColor = useSkillColor(skill);
  return (
    <TouchableOpacity
      style={[styles.skillCard, { backgroundColor: c.card, borderColor: c.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.skillIconWrap, { backgroundColor: skillColor + "15" }]}>
        <SkillIcon skill={skill} size={20} />
      </View>
      <Text style={[styles.skillName, { color: c.foreground }]}>{SKILL_LABELS[skill]}</Text>
      <View style={styles.skillMeta}>
        <Text style={[styles.skillLevel, { color: skillColor, fontWeight: "700" }]}>
          {level ?? "—"}
        </Text>
        <Text style={[styles.skillAttempts, { color: c.mutedForeground }]}>
          {attempts} lần
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: spacing["3xl"], gap: spacing.base },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  greeting: { flex: 1 },
  greetingText: { fontSize: fontSize["2xl"], fontWeight: "700" },
  greetingSub: { fontSize: fontSize.sm, marginTop: spacing.xs },
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.xl,
    padding: spacing.base,
    gap: spacing.md,
    shadowColor: "#4F5BD5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  heroLeft: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroText: { flex: 1 },
  heroTitle: { fontSize: fontSize.lg, fontWeight: "700" },
  heroSub: { fontSize: fontSize.xs, marginTop: 2 },
  statsRow: { flexDirection: "row", gap: spacing.md },
  statBox: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: "center",
    gap: spacing.xs,
  },
  statValue: { fontSize: fontSize.xl, fontWeight: "700" },
  statLabel: { fontSize: fontSize.xs },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: "700", marginTop: spacing.sm },
  skillGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  skillCard: {
    width: "48.5%" as any,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  skillIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  skillName: { fontSize: fontSize.sm, fontWeight: "600" },
  skillMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  skillLevel: { fontSize: fontSize.base },
  skillAttempts: { fontSize: fontSize.xs },
  goalCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.base,
    gap: spacing.xs,
  },
  goalRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  goalTitle: { fontSize: fontSize.sm, fontWeight: "600" },
  goalMeta: { fontSize: fontSize.xs },
});
