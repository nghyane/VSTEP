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
  }, []);

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
  const chart = overview?.chart ?? null;

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
          <StreakButton streak={streakData?.currentStreak ?? 0} />
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

            <View style={styles.bannerMascot}>
              <Mascot name="hero" size={64} animation="none" />
            </View>
          </View>

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
      </Animated.View>

      <Animated.View style={[styles.statsGrid, toAnimStyle(3)]}>
        <StatCard icon="fire" label="Streak" value={`${streakData?.currentStreak ?? 0} ngày`} accent={c.streak} />
        <StatCard icon="clock" label="Thời gian học" value={stats ? formatMinutes(stats.totalStudyMinutes) : "—"} accent={c.info} />
        <StatCard icon="pencil" label="Bài thi" value={stats ? `${stats.totalTests}/${stats.minTestsRequired}` : "—"} accent={c.skillReading} />
        <StatCard icon="crown" label="Band hiện tại" value={chart ? computeAvgBand(chart) : "—"} accent={c.coin} />
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
              <Text style={[styles.chartLockedSub, { color: c.mutedForeground }]}>Cần thêm {Math.max(0, (stats.minTestsRequired ?? 5) - (stats.totalTests ?? 0))} bài thi để hiển thị biểu đồ mạng nhện.</Text>
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

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: Parameters<typeof GameIcon>[0]["name"];
  label: string;
  value: string;
  accent: string;
}) {
  const c = useThemeColors();

  return (
    <View style={[styles.statCard, { backgroundColor: c.card, borderColor: accent + "30", borderBottomColor: accent + "60" }]}>
      <GameIcon name={icon} size={26} />
      <Text style={[styles.statLabel, { color: c.subtle }]}>{label}</Text>
      <Text style={[styles.statValue, { color: c.foreground }]}>{value}</Text>
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

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins} phút`;
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  return minutes > 0 ? `${hours}g ${minutes}p` : `${hours} giờ`;
}

function computeAvgBand(chart: {
  listening: number | null;
  reading: number | null;
  writing: number | null;
  speaking: number | null;
}): string {
  const values = [chart.listening, chart.reading, chart.writing, chart.speaking].filter(
    (value): value is number => value !== null,
  );
  if (!values.length) return "—";
  return (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1);
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
  bannerMascot: { position: "absolute", right: 0, bottom: -2 },
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
  skillGrid: { gap: spacing.sm, marginBottom: spacing.base },
  skillCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  skillTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  skillIconBg: { width: 48, height: 48, borderRadius: radius.lg, alignItems: "center", justifyContent: "center" },
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
