import { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
import { useFadeIn } from "@/hooks/use-fade-in";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTouchable } from "@/components/HapticTouchable";
import { LoadingScreen } from "@/components/LoadingScreen";
import { GradientBackground } from "@/components/GradientBackground";
import { StickyHeader, HEADER_H } from "@/components/StickyHeader";
import { useAuth } from "@/hooks/use-auth";
import { useProgress, useActivity, useLearningPath } from "@/hooks/use-progress";
import { useExamSessions } from "@/hooks/use-exam-session";
import { SkillIcon, SKILL_LABELS } from "@/components/SkillIcon";
import { useThemeColors, useSkillColor, spacing, radius, fontSize, fontFamily } from "@/theme";
import type { Skill, ExamSessionWithExam } from "@/types/api";

type QuickAction = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
};


export default function HomeScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const progress = useProgress();
  const { data: activityData, isLoading: activityLoading } = useActivity(7);
  const { data: learningPath } = useLearningPath();
  const { data: recentSessions } = useExamSessions({ status: "completed", limit: 5 });
  const scrollY = useRef(new Animated.Value(0)).current;

  const fade0 = useFadeIn(0);
  const fade1 = useFadeIn(100);
  const fade2 = useFadeIn(200);
  const fade3 = useFadeIn(300);
  const fade4 = useFadeIn(400);
  const fade5 = useFadeIn(500);

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
    { title: "Từ vựng", icon: "book-outline", color: c.primary, onPress: () => router.push("/(app)/vocabulary") },
  ];

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <GradientBackground />
      <StickyHeader scrollY={scrollY} subtitle="Bạn đang học VSTEP" />
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
            <Text style={[styles.profileTitle, { color: c.foreground }]}>Trình độ VSTEP của bạn</Text>
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

        {/* ── Recent Sessions ── */}
        {recentSessions?.data && recentSessions.data.length > 0 && (
          <Animated.View style={fade5}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: c.foreground }]}>Phiên thi gần đây</Text>
            </View>
            <View style={{ gap: spacing.sm, marginTop: spacing.base }}>
              {recentSessions.data.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </View>
          </Animated.View>
        )}

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

        {/* ── Learning Path ── */}
        {learningPath?.weeklyPlan && learningPath.weeklyPlan.length > 0 && (
          <Animated.View style={fade4}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: c.foreground }]}>Lộ trình tuần này</Text>
              <HapticTouchable onPress={() => router.push("/(app)/(tabs)/progress")}>
                <Text style={[styles.sectionLink, { color: c.primary }]}>Xem chi tiết</Text>
              </HapticTouchable>
            </View>

            <View style={{ gap: spacing.sm, marginTop: spacing.base }}>
              {learningPath.weeklyPlan.slice(0, 4).map((item) => (
                <View
                  key={item.skill}
                  style={[styles.lpCard, { backgroundColor: c.card, borderColor: c.border }]}
                >
                  <View style={styles.lpRow}>
                    <SkillIcon skill={item.skill as any} size={20} />
                    <Text style={[styles.lpSkill, { color: c.foreground }]}>
                      {SKILL_LABELS[item.skill as keyof typeof SKILL_LABELS] ?? item.skill}
                    </Text>
                  </View>
                  <Text style={[styles.lpMeta, { color: c.mutedForeground }]}>
                    {item.sessionsPerWeek} sessions/week · {item.estimatedMinutes} phút
                  </Text>
                  {item.weakTopics.length > 0 && (
                    <Text style={[styles.lpFocus, { color: c.warning }]}>
                      Cần tập trung: {item.weakTopics[0].name}
                    </Text>
                  )}
                </View>
              ))}
            </View>

            <Text style={[styles.lpTotal, { color: c.mutedForeground }]}>
              {learningPath.totalMinutesPerWeek} phút/tuần
            </Text>
          </Animated.View>
        )}
      </Animated.ScrollView>
    </View>
  );
}

// ── Session History Card ──

function SessionCard({ session }: { session: ExamSessionWithExam }) {
  const c = useThemeColors();
  const router = useRouter();
  const examTitle = session.exam?.title ?? `Đề ${session.exam?.level ?? ""}`;
  const date = new Date(session.completedAt ?? session.createdAt).toLocaleDateString("vi-VN");
  const skills: { skill: Skill; score: number | null }[] = [
    { skill: "listening", score: session.listeningScore },
    { skill: "reading", score: session.readingScore },
    { skill: "writing", score: session.writingScore },
    { skill: "speaking", score: session.speakingScore },
  ].filter((s) => s.score !== null && s.score !== undefined);

  return (
    <HapticTouchable
      style={[styles.sessionCard, { backgroundColor: c.card, borderColor: c.border }]}
      onPress={() => router.push(`/(app)/session/${session.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.sessionHeader}>
        <Text style={{ color: c.foreground, fontWeight: "600", fontSize: fontSize.sm, flex: 1 }} numberOfLines={1}>
          {examTitle}
        </Text>
        <Text style={{ color: c.mutedForeground, fontSize: fontSize.xs }}>{date}</Text>
      </View>
      {session.overallScore != null && (
        <View style={styles.sessionScoreRow}>
          <Text style={{ color: c.primary, fontWeight: "700", fontSize: fontSize.lg }}>
            {session.overallScore}/10
          </Text>
          {session.overallBand && (
            <View style={[styles.sessionBand, { borderColor: c.primary }]}>
              <Text style={{ color: c.primary, fontWeight: "700", fontSize: fontSize.xs }}>{session.overallBand}</Text>
            </View>
          )}
        </View>
      )}
      {skills.length > 0 && (
        <View style={styles.sessionSkills}>
          {skills.map(({ skill, score }) => (
            <SessionSkillChip key={skill} skill={skill} score={score!} />
          ))}
        </View>
      )}
    </HapticTouchable>
  );
}

function SessionSkillChip({ skill, score }: { skill: Skill; score: number }) {
  const c = useThemeColors();
  const color = useSkillColor(skill);
  return (
    <View style={[styles.sessionSkillChip, { backgroundColor: color + "15" }]}>
      <Ionicons name={skill === "listening" ? "headset" : skill === "reading" ? "book" : skill === "writing" ? "create" : "mic"} size={10} color={color} />
      <Text style={{ color, fontSize: 10, fontWeight: "600" }}>{score}/10</Text>
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

  // Learning Path
  lpCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.base,
    gap: spacing.xs,
  },
  lpRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  lpSkill: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  lpMeta: { fontSize: fontSize.xs, fontFamily: fontFamily.regular },
  lpFocus: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },
  lpTotal: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bold,
    textAlign: "center",
    marginTop: spacing.sm,
  },

  // Session history
  sessionCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.base,
    gap: spacing.sm,
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sessionScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sessionBand: {
    borderWidth: 1.5,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
  },
  sessionSkills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  sessionSkillChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
});
