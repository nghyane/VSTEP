import { useEffect, useRef } from "react";
import { Animated, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { HapticTouchable } from "@/components/HapticTouchable";
import { SpiderChart } from "@/components/SpiderChart";
import { SkillIcon } from "@/components/SkillIcon";
import { GameIcon } from "@/components/GameIcon";
import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { Mascot } from "@/components/Mascot";
import { StreakButton } from "@/features/streak/StreakButton";
import { NotificationButton } from "@/features/notification/NotificationButton";
import { CoinButton } from "@/features/coin/CoinButton";
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap";
import { GapAnalysis } from "@/components/dashboard/GapAnalysis";
import { ScoreTrend } from "@/components/dashboard/ScoreTrend";
import { useAuth } from "@/hooks/use-auth";
import { useOverview, useStreak } from "@/hooks/use-progress";
import { getTargetBand } from "@/lib/vstep";
import { useThemeColors, useSkillColor, spacing, radius, fontSize, fontFamily } from "@/theme";
import type { Skill } from "@/types/api";

const SKILLS: Skill[] = ["listening", "reading", "writing", "speaking"];
const MIN_TESTS_FOR_CHART = 5;

const SKILL_META: Record<Skill, { vi: string }> = {
  listening: { vi: "Nghe" },
  reading: { vi: "Đọc" },
  writing: { vi: "Viết" },
  speaking: { vi: "Nói" },
};

function useStaggerFade(count: number, baseDelay = 0, step = 80) {
  const anims = useRef(Array.from({ length: count }, () => new Animated.Value(0))).current;

  useEffect(() => {
    anims.forEach((a, i) => {
      Animated.timing(a, {
        toValue: 1,
        duration: 400,
        delay: baseDelay + i * step,
        useNativeDriver: true,
      }).start();
    });
  }, [anims, baseDelay, step]);

  return anims;
}

export default function DashboardScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const router = useRouter();
  const { data: overview } = useOverview();
  const { data: streakData } = useStreak();
  const sectionAnims = useStaggerFade(5, 100);

  const nickname = profile?.nickname ?? user?.fullName ?? "Bạn";
  const initial = nickname.charAt(0).toUpperCase();
  const daysLeft = overview?.profile?.daysUntilExam ?? null;
  const targetLevel = profile?.targetLevel ?? overview?.profile?.targetLevel ?? "B2";
  const targetDeadline = profile?.targetDeadline ?? overview?.profile?.targetDeadline ?? null;
  const stats = overview?.stats;
  const chart = overview?.scores.spider ?? null;

  const targetBand = getTargetBand(targetLevel);
  const weakest = chart
    ? SKILLS.reduce((weakestSkill, skill) => {
        const gapSkill = (chart[skill] ?? 0) - targetBand;
        const gapWeakest = (chart[weakestSkill] ?? 0) - targetBand;
        return gapSkill < gapWeakest ? skill : weakestSkill;
      }, SKILLS[0])
    : "listening";

  function toAnimStyle(index: number) {
    return {
      opacity: sectionAnims[index],
      transform: [
        {
          translateY: sectionAnims[index].interpolate({
            inputRange: [0, 1],
            outputRange: [14, 0],
          }),
        },
      ],
    };
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: c.background }]}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={[styles.topBar, toAnimStyle(0)]}>
        <Text style={[styles.topBarTitle, { color: c.foreground }]}>Tổng quan</Text>
        <View style={styles.topRight}>
          <StreakButton streak={streakData?.current ?? 0} />
          <CoinButton />
          <NotificationButton />
        </View>
      </Animated.View>

      <Animated.View style={toAnimStyle(1)}>
        <LinearGradient
          colors={[c.primaryLight, c.primary, c.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <View style={styles.decoCircle1} />
          <View style={styles.decoCircle2} />

          <View style={styles.bannerTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.bannerHi}>Xin chào, {nickname}!</Text>
              <Text style={styles.bannerSub}>
                {daysLeft != null
                  ? `Còn ${daysLeft} ngày đến kỳ thi`
                  : "Hãy đặt mục tiêu để bắt đầu lộ trình của bạn"}
              </Text>
            </View>
          </View>

          <LevelProgress
            entry={overview?.profile?.entryLevel ?? null}
            predicted={overview?.profile?.predictedLevel ?? null}
            target={targetLevel}
          />

          <View style={styles.targetRow}>
            <View style={[styles.targetPill, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
              <GameIcon name="target" size={14} />
              <Text style={styles.targetPillText}>Mục tiêu: {targetLevel}</Text>
            </View>
            {targetDeadline ? (
              <View style={[styles.targetPill, { backgroundColor: "rgba(255,255,255,0.12)" }]}>
                <GameIcon name="calendar" size={14} />
                <Text style={styles.targetPillText}>{targetDeadline}</Text>
              </View>
            ) : null}
          </View>
        </LinearGradient>
      </Animated.View>

      <Animated.View style={toAnimStyle(2)}>
        <NextActionCard
          totalTests={stats?.totalTests ?? 0}
          todayActive={streakData?.todayActive ?? false}
          currentStreak={streakData?.current ?? 0}
          weakest={weakest}
        />
      </Animated.View>

      <Animated.View style={[styles.statsGrid, toAnimStyle(3)]}>
        {SKILLS.map((skill) => (
          <SkillStatCard
            key={skill}
            skill={skill}
            score={chart?.[skill] ?? null}
            targetBand={targetBand}
          />
        ))}
      </Animated.View>

      <ActivityHeatmap />

      <Animated.View style={toAnimStyle(4)}>
        <Text style={[styles.sectionTitle, { color: c.foreground }]}>4 kỹ năng</Text>
        <View style={styles.skillGrid}>
          {SKILLS.map((skill) => (
            <SkillCard
              key={skill}
              skill={skill}
              score={chart?.[skill] ?? null}
              onPress={() => router.push(`/(app)/skill/${skill}` as any)}
            />
          ))}
        </View>

        {chart ? (
          <DepthCard style={styles.chartCard}>
            <Text style={[styles.chartTitle, { color: c.foreground }]}>Biểu đồ năng lực</Text>
            <Text style={[styles.chartSub, { color: c.subtle }]}>Dựa trên {chart.sampleSize} bài thi gần nhất</Text>
            <SpiderChart
              skills={{
                listening: { current: chart.listening ?? 0, trend: "stable" },
                reading: { current: chart.reading ?? 0, trend: "stable" },
                writing: { current: chart.writing ?? 0, trend: "stable" },
                speaking: { current: chart.speaking ?? 0, trend: "stable" },
              }}
            />
          </DepthCard>
        ) : stats ? (
          <DepthCard style={styles.chartCard}>
            <View style={styles.chartLocked}>
              <Mascot name="think" size={72} animation="none" />
              <Text style={[styles.chartLockedTitle, { color: c.foreground }]}>Chưa đủ dữ liệu biểu đồ</Text>
              <Text style={[styles.chartLockedSub, { color: c.mutedForeground }]}>Cần thêm {Math.max(0, MIN_TESTS_FOR_CHART - (stats.totalTests ?? 0))} bài thi để hiển thị biểu đồ mạng nhện.</Text>
            </View>
          </DepthCard>
        ) : null}

        <GapAnalysis />
        <ScoreTrend />
      </Animated.View>

      <View style={{ height: insets.bottom + 40 }} />
    </ScrollView>
  );
}

function LevelProgress({ entry, predicted, target }: { entry: string | null; predicted: string | null; target: string }) {
  const display = predicted ?? entry ?? "—";
  return (
    <View style={styles.levelRow}>
      <LevelDot label="Đầu vào" value={entry ?? "—"} variant="done" />
      <View style={styles.levelLine} />
      <LevelDot label="Dự đoán" value={display} variant="active" />
      <View style={styles.levelLine} />
      <LevelDot label="Mục tiêu" value={target} variant="target" />
    </View>
  );
}

function LevelDot({ label, value, variant }: { label: string; value: string; variant: "done" | "active" | "target" }) {
  return (
    <View style={styles.levelItem}>
      <Text style={styles.levelLabel}>{label}</Text>
      <View style={[styles.levelDot, variant === "done" && styles.levelDotDone, variant === "active" && styles.levelDotActive, variant === "target" && styles.levelDotTarget]} />
      <Text style={[styles.levelValue, variant === "active" && styles.levelValueHighlight]}>{value}</Text>
    </View>
  );
}

function SkillStatCard({ skill, score, targetBand }: { skill: Skill; score: number | null; targetBand: number }) {
  const c = useThemeColors();
  const color = useSkillColor(skill);
  const gap = score !== null ? score - targetBand : null;
  const gapText = score === null ? "Chưa có điểm" : gap !== null && gap >= 0 ? "✓ Đạt mục tiêu" : `Cần +${Math.abs(gap ?? 0).toFixed(1)}`;
  const gapColor = score === null ? c.mutedForeground : gap !== null && gap >= 0 ? c.success : c.warning;

  return (
    <View style={[styles.statCard, { backgroundColor: c.card, borderColor: color + "30", borderBottomColor: color }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
        <SkillIcon skill={skill} size={20} bare />
        <Text style={[styles.statLabel, { color: c.subtle }]}>{SKILL_META[skill].vi}</Text>
      </View>
      <Text style={[styles.statValue, { color: c.foreground }]}>
        {score !== null ? score.toFixed(1) : "—"}
        <Text style={{ fontSize: fontSize.xs, color: c.subtle }}> /10</Text>
      </Text>
      <Text style={{ fontSize: fontSize.xs, fontFamily: fontFamily.bold, color: gapColor }}>{gapText}</Text>
    </View>
  );
}

function SkillCard({
  skill,
  score,
  onPress,
}: {
  skill: Skill;
  score: number | null;
  onPress: () => void;
}) {
  const c = useThemeColors();
  const color = useSkillColor(skill);

  return (
    <HapticTouchable
      style={[styles.skillCard, { backgroundColor: c.card, borderColor: color + "40", borderBottomColor: color }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.skillTop}>
        <View style={[styles.skillIconBg, { backgroundColor: color + "15" }]}>
          <SkillIcon skill={skill} size={26} bare />
        </View>
        <Text style={[styles.skillScore, { color: c.foreground }]}>
          {score !== null ? score.toFixed(1) : "—"}
        </Text>
      </View>
      <Text style={[styles.skillLabel, { color: c.mutedForeground }]}>{SKILL_META[skill].vi}</Text>
      <View style={[styles.skillBar, { backgroundColor: color + "20" }]}>
        <View style={[styles.skillBarFill, { backgroundColor: color, width: score !== null ? `${Math.min(score / 10 * 100, 100)}%` : "0%" }]} />
      </View>
    </HapticTouchable>
  );
}

function NextActionCard({
  totalTests,
  todayActive,
  currentStreak,
  weakest,
}: {
  totalTests: number;
  todayActive: boolean;
  currentStreak: number;
  weakest: Skill;
}) {
  const c = useThemeColors();
  const router = useRouter();

  // Case 1: No tests yet — onboarding prompt
  if (totalTests === 0) {
    return (
      <DepthCard style={styles.nextCard}>
        <View style={[styles.nextIcon, { backgroundColor: c.primaryTint }]}>
          <GameIcon name="target" size={22} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.nextTitle, { color: c.foreground }]}>Hãy làm bài thi đầu tiên để xem trình độ thật</Text>
          <Text style={[styles.nextSub, { color: c.subtle }]}>Sau bài full-test đầu, dashboard sẽ ước tính band và chỉ ra kỹ năng cần luyện</Text>
        </View>
        <DepthButton onPress={() => router.push("/(app)/(tabs)/exams" as any)} size="sm">
          Bắt đầu
        </DepthButton>
      </DepthCard>
    );
  }

  // Case 2: Today has no activity yet — streak nudge
  if (!todayActive) {
    const streakCopy = currentStreak > 0
      ? `Bắt đầu luyện tập hôm nay để duy trì streak ${currentStreak} ngày`
      : "Bắt đầu một phiên ngắn để tạo streak học tập đầu tiên";

    return (
      <DepthCard style={styles.nextCard}>
        <View style={[styles.nextIcon, { backgroundColor: c.streak + "18" }]}>
          <GameIcon name="fire" size={22} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.nextTitle, { color: c.foreground }]}>Hôm nay chưa luyện tập!</Text>
          <Text style={[styles.nextSub, { color: c.subtle }]}>{streakCopy}</Text>
        </View>
        <DepthButton onPress={() => router.push("/(app)/(tabs)/practice" as any)} size="sm">
          Bắt đầu
        </DepthButton>
      </DepthCard>
    );
  }

  // Case 3: Goal met — suggest practice weakest skill
  return (
    <DepthCard style={styles.nextCard}>
      <View style={[styles.nextIcon, { backgroundColor: c.primaryTint }]}>
        <SkillIcon skill={weakest} size={22} bare />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.nextTitle, { color: c.foreground }]}>Bài gợi ý hôm nay</Text>
        <Text style={[styles.nextSub, { color: c.subtle }]}>Luyện {SKILL_META[weakest].vi} trong 15 phút để duy trì chuỗi học tập.</Text>
      </View>
      <DepthButton onPress={() => router.push(`/(app)/practice/${weakest}` as any)} size="sm">
        Bắt đầu
      </DepthButton>
    </DepthCard>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing["3xl"] },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.base },
  topBarTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold },
  topRight: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  banner: { borderRadius: radius["2xl"], padding: spacing.lg, overflow: "hidden", marginBottom: spacing.base, gap: spacing.sm },
  decoCircle1: { position: "absolute", top: -40, right: -40, width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(255,255,255,0.08)" },
  decoCircle2: { position: "absolute", bottom: -20, left: 60, width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.06)" },
  bannerTop: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFF", fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  bannerHi: { color: "#FFF", fontSize: fontSize.xl, fontFamily: fontFamily.extraBold },
  bannerSub: { color: "rgba(255,255,255,0.82)", fontSize: fontSize.xs, marginTop: 2 },
  levelRow: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: radius.xl, paddingHorizontal: spacing.base, paddingVertical: spacing.sm, marginTop: spacing.xs },
  levelItem: { alignItems: "center", gap: 3, minWidth: 50 },
  levelLabel: { fontSize: 10, color: "rgba(255,255,255,0.7)" },
  levelDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: "#FFF" },
  levelDotDone: { backgroundColor: "#FFF" },
  levelDotActive: { backgroundColor: "#FFF", shadowColor: "#FFF", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 4 },
  levelDotTarget: { backgroundColor: "transparent" },
  levelValue: { fontSize: fontSize.xs, fontFamily: fontFamily.bold, color: "#FFF" },
  levelValueHighlight: { color: "#B3E5FC" },
  levelLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.3)", marginHorizontal: spacing.xs },
  targetRow: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  targetPill: { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full },
  targetPillText: { color: "rgba(255,255,255,0.92)", fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },
  nextCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.base, padding: spacing.base },
  nextIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  nextTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  nextSub: { fontSize: fontSize.xs, marginTop: 2, lineHeight: 16 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.lg, padding: spacing.base, width: "48%", gap: 4 },
  statLabel: { fontSize: fontSize.xs },
  statValue: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold },
  sectionTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.extraBold, marginBottom: spacing.md },
  skillGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.base },
  skillCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.base, gap: spacing.sm, width: "48.5%" },
  skillTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  skillIconBg: { width: 40, height: 40, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  skillLabel: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  skillScore: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  skillBar: { height: 6, borderRadius: radius.full, overflow: "hidden" },
  skillBarFill: { height: 6, borderRadius: radius.full },
  chartCard: { marginBottom: spacing.base },
  chartTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.extraBold },
  chartSub: { fontSize: fontSize.sm, marginBottom: spacing.sm },
  chartLocked: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xl },
  chartLockedTitle: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
  chartLockedSub: { fontSize: fontSize.sm, textAlign: "center" },
});
