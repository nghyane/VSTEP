import { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTouchable } from "@/components/HapticTouchable";
import { LoadingScreen } from "@/components/LoadingScreen";
import { GradientBackground } from "@/components/GradientBackground";
import { StickyHeader, HEADER_H } from "@/components/StickyHeader";
import { useAuth } from "@/hooks/use-auth";
import { useProgress, useActivity } from "@/hooks/use-progress";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

type QuickAction = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
};


function useFadeIn(delay = 0) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, damping: 18, stiffness: 120, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, opacity, translateY]);

  return { opacity, transform: [{ translateY }] };
}

export default function HomeScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const progress = useProgress();
  const { data: activityData, isLoading: activityLoading } = useActivity(7);
  const scrollY = useRef(new Animated.Value(0)).current;

  const fade0 = useFadeIn(0);
  const fade1 = useFadeIn(100);
  const fade2 = useFadeIn(200);
  const fade3 = useFadeIn(300);

  useEffect(() => {
    if (!progress.isLoading && progress.data && !progress.data.goal) {
      router.replace("/(app)/onboarding");
    }
  }, [progress.isLoading, progress.data, router]);

  if (progress.isLoading) return <LoadingScreen />;

  const skills = progress.data?.skills ?? [];
  const goal = progress.data?.goal;
  const totalAttempts = skills.reduce((sum, s) => sum + s.attemptCount, 0);

  const currentAvg =
    skills.length > 0
      ? skills.map((s) => s.currentLevel).filter(Boolean).join(", ") || "—"
      : "—";

  const quickActions: QuickAction[] = [
    { title: "Luyện tập", icon: "school", color: c.primary, onPress: () => router.push("/(app)/practice") },
    { title: "Lộ trình", icon: "map-outline", color: c.primary, onPress: () => router.push("/(app)/(tabs)/progress") },
    { title: "Bài kiểm tra", icon: "document-text", color: c.primary, onPress: () => router.push("/(app)/(tabs)/exams") },
    { title: "Xem thêm", icon: "add-circle-outline", color: c.mutedForeground, onPress: () => router.push("/(app)/submissions") },
  ];

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <GradientBackground />
      <StickyHeader scrollY={scrollY} subtitle="Bạn đang học Aptis" />
      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: HEADER_H + insets.top + 8, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
      >
        {/* ── Quick Actions ── */}
        <Animated.View style={fade0}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Dành cho bạn</Text>
          <View style={[styles.actionGrid, { marginTop: spacing.base }]}>
            {quickActions.map((action) => (
              <HapticTouchable
                key={action.title}
                style={[styles.actionCard, { backgroundColor: c.card, borderColor: c.border }]}
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: action.color + "18" }]}>
                  <Ionicons name={action.icon} size={24} color={action.color} />
                </View>
                <Text style={[styles.actionTitle, { color: c.foreground }]}>{action.title}</Text>
              </HapticTouchable>
            ))}
          </View>
        </Animated.View>

        {/* ── Learning Profile ── */}
        <Animated.View style={fade1}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.foreground }]}>Learning Profile</Text>
            <HapticTouchable onPress={() => router.push("/(app)/(tabs)/progress")}>
              <Text style={[styles.sectionLink, { color: c.primary }]}>Xem tất cả</Text>
            </HapticTouchable>
          </View>

          <View style={[styles.profileCard, { backgroundColor: c.card, borderColor: c.border, marginTop: spacing.base }]}>
            <Text style={[styles.profileTitle, { color: c.foreground }]}>Trình độ Aptis của bạn</Text>
            <View style={styles.progressTrack}>
              <View style={styles.progressNode}>
                <View style={[styles.progressDot, { backgroundColor: c.primary + "18" }]}>
                  <View style={[styles.dotInner, { backgroundColor: c.primary }]} />
                </View>
                <Text style={[styles.progressLabel, { color: c.mutedForeground }]}>Đầu vào</Text>
                <Text style={[styles.progressValue, { color: c.foreground }]}>
                  {goal?.currentEstimatedBand ?? "—"}
                </Text>
              </View>
              <View style={[styles.progressLine, { borderColor: c.border }]} />
              <View style={styles.progressNode}>
                <View style={[styles.progressDot, { backgroundColor: c.primary + "18" }]}>
                  <View style={[styles.dotInner, { backgroundColor: c.primary }]} />
                </View>
                <Text style={[styles.progressLabel, { color: c.mutedForeground }]}>Dự đoán</Text>
                <Text style={[styles.progressValue, { color: c.primary }]}>{currentAvg}</Text>
              </View>
              <View style={[styles.progressLine, { borderColor: c.border }]} />
              <View style={styles.progressNode}>
                <View style={[styles.progressDot, { backgroundColor: c.success + "18" }]}>
                  <Ionicons name="locate" size={14} color={c.success} />
                </View>
                <Text style={[styles.progressLabel, { color: c.mutedForeground }]}>Mục tiêu</Text>
                <Text style={[styles.progressValue, { color: c.success }]}>
                  {goal?.targetBand ?? "—"}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── Stats Grid ── */}
        <Animated.View style={fade2}>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { borderColor: c.border }]}>
              <Text style={styles.statEmoji}>⏱</Text>
              <Text style={[styles.statLabel, { color: c.mutedForeground }]}>Tổng thời lượng</Text>
              <Text style={[styles.statValue, { color: c.primary }]}>
                {activityLoading ? "—" : (activityData?.totalStudyTimeMinutes ?? 0) >= 60 ? `${Math.round((activityData?.totalStudyTimeMinutes ?? 0) / 60 * 10) / 10} giờ` : `${activityData?.totalStudyTimeMinutes ?? 0} phút`}
              </Text>
            </View>
            <View style={[styles.statCard, { borderColor: c.border }]}>
              <Text style={styles.statEmoji}>🏆</Text>
              <Text style={[styles.statLabel, { color: c.mutedForeground }]}>Chuỗi ngày học</Text>
              <Text style={[styles.statValue, { color: c.warning }]}>{activityLoading ? "—" : activityData?.streak ?? 0}</Text>
            </View>
            <View style={[styles.statCard, { borderColor: c.border }]}>
              <Text style={styles.statEmoji}>📝</Text>
              <Text style={[styles.statLabel, { color: c.mutedForeground }]}>Số bài test đã làm</Text>
              <Text style={[styles.statValue, { color: c.primary }]}>{activityLoading ? "—" : activityData?.totalExercises ?? 0}</Text>
            </View>
            <View style={[styles.statCard, { borderColor: c.border }]}>
              <Text style={styles.statEmoji}>📚</Text>
              <Text style={[styles.statLabel, { color: c.mutedForeground }]}>Số bài đã học</Text>
              <Text style={[styles.statValue, { color: c.primary }]}>{activityLoading ? "—" : activityData?.total ?? 0}</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Study Plan ── */}
        <Animated.View style={fade3}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.foreground }]}>Study Plan</Text>
            <HapticTouchable onPress={() => router.push("/(app)/goal")}>
              <Text style={[styles.sectionLink, { color: c.primary }]}>Xem tất cả</Text>
            </HapticTouchable>
          </View>

          {goal ? (
            <View style={[styles.goalCard, { backgroundColor: c.card, borderColor: c.border, marginTop: spacing.base }]}>
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
          ) : (
            <HapticTouchable
              style={[styles.goalCard, { backgroundColor: c.card, borderColor: c.border, marginTop: spacing.base }]}
              onPress={() => router.push("/(app)/onboarding")}
            >
              <View style={styles.goalRow}>
                <Ionicons name="add-circle-outline" size={16} color={c.primary} />
                <Text style={[styles.goalTitle, { color: c.primary }]}>Thiết lập mục tiêu</Text>
              </View>
              <Text style={[styles.goalMeta, { color: c.mutedForeground }]}>
                Đặt mục tiêu để theo dõi tiến độ học tập
              </Text>
            </HapticTouchable>
          )}
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, gap: spacing.base },

  // Section
  sectionTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.bold },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionLink: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },

  // Quick Actions
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  actionCard: {
    width: "48.5%" as any,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.base,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold, flexShrink: 1 },

  // Learning Profile
  profileCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.base,
    gap: spacing.lg,
  },
  profileTitle: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
  progressTrack: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  progressNode: { alignItems: "center", gap: spacing.xs },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  dotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  progressLine: {
    flex: 1,
    height: 0,
    borderTopWidth: 1,
    borderStyle: "dashed",
    marginHorizontal: spacing.xs,
  },
  progressLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.regular },
  progressValue: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },

  // Stats
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  statCard: {
    width: "48.5%" as any,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.base,
    gap: spacing.xs,
  },
  statEmoji: { fontSize: fontSize.lg },
  statLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.regular },
  statValue: { fontSize: fontSize.xl, fontFamily: fontFamily.bold },

  // Goal
  goalCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.base,
    gap: spacing.xs,
  },
  goalRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  goalTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  goalMeta: { fontSize: fontSize.xs, fontFamily: fontFamily.regular },
});
