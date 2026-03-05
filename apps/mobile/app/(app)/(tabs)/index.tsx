import { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { HapticTouchable } from "@/components/HapticTouchable";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Logo } from "@/components/Logo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useAuth } from "@/hooks/use-auth";
import { useProgress } from "@/hooks/use-progress";
import { useThemeColors, spacing, radius, fontSize } from "@/theme";

type QuickAction = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  onPress: () => void;
};

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

  const quickActions: QuickAction[] = [
    {
      title: "Luyện tập",
      icon: "school",
      iconBg: c.primary,
      onPress: () => router.push("/(app)/practice"),
    },
    {
      title: "Bài thi",
      icon: "document-text",
      iconBg: c.success,
      onPress: () => router.push("/(app)/(tabs)/exams"),
    },
    {
      title: "Tiến độ",
      icon: "analytics",
      iconBg: c.warning,
      onPress: () => router.push("/(app)/(tabs)/progress"),
    },
    {
      title: "Xem thêm",
      icon: "add-circle-outline",
      iconBg: c.mutedForeground,
      onPress: () => router.push("/(app)/submissions"),
    },
  ];

  const currentAvg =
    skills.length > 0
      ? skills
          .map((s) => s.currentLevel)
          .filter(Boolean)
          .join(", ") || "—"
      : "—";

  return (
    <ScreenWrapper>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Header with Logo */}
        <View style={styles.headerRow}>
          <View style={[styles.avatar, { backgroundColor: c.primary }]}>
            <Text style={styles.avatarText}>
              {(user?.fullName ?? "?").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.greeting}>
            <Text style={[styles.greetingText, { color: c.foreground }]}>
              Xin chào, {user?.fullName ?? "bạn"} 👋
            </Text>
          </View>
          <Logo size="sm" />
        </View>

        {/* Quick Actions — Dành cho bạn */}
        <Text style={[styles.sectionTitle, { color: c.foreground }]}>Dành cho bạn</Text>
        <View style={styles.actionGrid}>
          {quickActions.map((action) => (
            <HapticTouchable
              key={action.title}
              style={[styles.actionCard, { backgroundColor: c.card, borderColor: c.border }]}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: action.iconBg + "18" }]}>
                <Ionicons name={action.icon} size={22} color={action.iconBg} />
              </View>
              <Text style={[styles.actionTitle, { color: c.foreground }]}>{action.title}</Text>
            </HapticTouchable>
          ))}
        </View>

        {/* Learning Profile — Tiến độ học tập */}
        {goal && (
          <View style={[styles.profileCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={styles.profileHeader}>
              <Text style={[styles.profileTitle, { color: c.foreground }]}>Tiến độ học tập</Text>
              <HapticTouchable onPress={() => router.push("/(app)/(tabs)/progress")}>
                <Text style={[styles.profileLink, { color: c.primary }]}>Xem tất cả</Text>
              </HapticTouchable>
            </View>
            <View style={styles.progressTrack}>
              <View style={styles.progressNode}>
                <View style={[styles.progressDot, { backgroundColor: c.muted }]}>
                  <Ionicons name="flag-outline" size={14} color={c.mutedForeground} />
                </View>
                <Text style={[styles.progressNodeLabel, { color: c.mutedForeground }]}>Đầu vào</Text>
                <Text style={[styles.progressNodeValue, { color: c.foreground }]}>
                  {goal.currentEstimatedBand ?? "—"}
                </Text>
              </View>
              <View style={[styles.progressLine, { borderColor: c.border }]} />
              <View style={styles.progressNode}>
                <View style={[styles.progressDot, { backgroundColor: c.primary + "18" }]}>
                  <Ionicons name="trending-up" size={14} color={c.primary} />
                </View>
                <Text style={[styles.progressNodeLabel, { color: c.mutedForeground }]}>Hiện tại</Text>
                <Text style={[styles.progressNodeValue, { color: c.primary }]}>{currentAvg}</Text>
              </View>
              <View style={[styles.progressLine, { borderColor: c.border }]} />
              <View style={styles.progressNode}>
                <View style={[styles.progressDot, { backgroundColor: c.success + "18" }]}>
                  <Ionicons name="trophy" size={14} color={c.success} />
                </View>
                <Text style={[styles.progressNodeLabel, { color: c.mutedForeground }]}>Mục tiêu</Text>
                <Text style={[styles.progressNodeValue, { color: c.success }]}>
                  {goal.targetBand}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Stats 2×2 Grid */}
        <Text style={[styles.sectionTitle, { color: c.foreground }]}>Thống kê</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: c.muted }]}>
            <Text style={styles.statEmoji}>⏱</Text>
            <Text style={[styles.statValue, { color: c.foreground }]}>
              {goal?.dailyStudyTimeMinutes ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: c.mutedForeground }]}>Phút/ngày</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: c.muted }]}>
            <Text style={styles.statEmoji}>📝</Text>
            <Text style={[styles.statValue, { color: c.foreground }]}>{totalAttempts}</Text>
            <Text style={[styles.statLabel, { color: c.mutedForeground }]}>Bài đã làm</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: c.muted }]}>
            <Text style={styles.statEmoji}>📊</Text>
            <Text style={[styles.statValue, { color: c.foreground }]}>{skills.length}</Text>
            <Text style={[styles.statLabel, { color: c.mutedForeground }]}>Kỹ năng</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: c.muted }]}>
            <Text style={styles.statEmoji}>🎯</Text>
            <Text style={[styles.statValue, { color: c.foreground }]}>
              {goal?.targetBand ?? "—"}
            </Text>
            <Text style={[styles.statLabel, { color: c.mutedForeground }]}>Mục tiêu</Text>
          </View>
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

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: spacing["3xl"], gap: spacing.base },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  greeting: { flex: 1, marginLeft: spacing.sm },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: fontSize.lg, fontWeight: "700" },
  greetingText: { fontSize: fontSize["2xl"], fontWeight: "700" },
  greetingSub: { fontSize: fontSize.sm, marginTop: spacing.xs },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: "700", marginTop: spacing.sm },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  actionCard: {
    width: "48.5%" as any,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.base,
    alignItems: "center",
    gap: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: { fontSize: fontSize.sm, fontWeight: "600" },
  profileCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.base,
    gap: spacing.md,
  },
  profileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profileTitle: { fontSize: fontSize.base, fontWeight: "700" },
  profileLink: { fontSize: fontSize.sm, fontWeight: "600" },
  progressTrack: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  progressNode: { alignItems: "center", gap: spacing.xs },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  progressLine: {
    flex: 1,
    height: 0,
    borderTopWidth: 1,
    borderStyle: "dashed",
    marginHorizontal: spacing.xs,
  },
  progressNodeLabel: { fontSize: fontSize.xs },
  progressNodeValue: { fontSize: fontSize.sm, fontWeight: "700" },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  statBox: {
    width: "48.5%" as any,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: "center",
    gap: spacing.xs,
  },
  statEmoji: { fontSize: fontSize.xl },
  statValue: { fontSize: fontSize.xl, fontWeight: "700" },
  statLabel: { fontSize: fontSize.xs },
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
