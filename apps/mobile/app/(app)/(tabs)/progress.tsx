import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useFadeIn } from "@/hooks/use-fade-in";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BouncyScrollView } from "@/components/BouncyScrollView";
import { HapticTouchable } from "@/components/HapticTouchable";
import { GradientBackground } from "@/components/GradientBackground";
import { StickyHeader, HEADER_H } from "@/components/StickyHeader";
import { SpiderChart } from "@/components/SpiderChart";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ErrorScreen } from "@/components/ErrorScreen";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useProgress, useSpiderChart } from "@/hooks/use-progress";
import { useThemeColors, useSkillColor, spacing, radius, fontSize, fontFamily } from "@/theme";
import type { Skill } from "@/types/api";

const SKILLS: { key: Skill; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "listening", label: "Listening", icon: "headset" },
  { key: "reading", label: "Reading", icon: "book" },
  { key: "writing", label: "Writing", icon: "create" },
  { key: "speaking", label: "Speaking", icon: "mic" },
];

const trendDisplay: Record<string, { text: string; type: "success" | "muted" | "destructive" | "warning" }> = {
  improving: { text: "↑ Đang tiến bộ", type: "success" },
  stable: { text: "→ Ổn định", type: "muted" },
  declining: { text: "↓ Giảm", type: "destructive" },
  inconsistent: { text: "~ Không đều", type: "warning" },
  insufficient_data: { text: "— Chưa đủ dữ liệu", type: "muted" },
};

function avgScore(skills: Record<Skill, { current: number; trend: string }>): number {
  const vals = Object.values(skills).map((s) => s.current);
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export default function ProgressScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const spider = useSpiderChart();
  const progress = useProgress();
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const chartFade = useFadeIn(0);
  const skillsFade = useFadeIn(150);
  const cardsFade = useFadeIn(300);

  if (spider.isLoading || progress.isLoading) return <LoadingScreen />;
  if (spider.error || progress.error)
    return <ErrorScreen message={(spider.error || progress.error)?.message} onRetry={() => { spider.refetch(); progress.refetch(); }} />;

  const spiderData = spider.data;
  const goal = spiderData?.goal ?? progress.data?.goal ?? null;
  const hasData = spiderData && Object.keys(spiderData.skills).length > 0;

  if (!hasData) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }}>
        <GradientBackground />
        <StickyHeader scrollY={scrollY} />
        <View style={[styles.emptyContainer, { paddingTop: HEADER_H + insets.top }]}>
          <Ionicons name="bar-chart-outline" size={64} color={c.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: c.foreground }]}>Hãy làm bài thi đầu tiên!</Text>
          <Text style={[styles.emptySub, { color: c.mutedForeground }]}>Chưa có dữ liệu tiến độ để hiển thị.</Text>
          <HapticTouchable
            style={[styles.emptyBtn, { backgroundColor: c.primary }]}
            onPress={() => router.push("/(app)/(tabs)/exams")}
          >
            <Text style={[styles.emptyBtnText, { color: c.primaryForeground }]}>Bắt đầu ngay</Text>
          </HapticTouchable>
        </View>
      </View>
    );
  }

  const avg = avgScore(spiderData!.skills);

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <GradientBackground />
      <StickyHeader scrollY={scrollY} />
      <BouncyScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: HEADER_H + insets.top + 8 }]}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
      >
        {/* ─── Spider Chart Card ─── */}
        <Animated.View style={[styles.chartCard, { backgroundColor: c.card, borderColor: c.border }, chartFade]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Tổng quan kỹ năng</Text>
          <SpiderChart skills={spiderData!.skills} />
          <View style={[styles.avgBadge, { backgroundColor: c.primary + "12" }]}>
            <Text style={[styles.avgLabel, { color: c.mutedForeground }]}>Điểm trung bình</Text>
            <Text style={[styles.avgValue, { color: c.primary }]}>{avg.toFixed(1)}</Text>
          </View>
        </Animated.View>

        {/* ─── Skills Detail ─── */}
        <Animated.View style={skillsFade}>
          <Text style={[styles.sectionHeader, { color: c.foreground }]}>Chi tiết kỹ năng</Text>
        </Animated.View>

        {SKILLS.map(({ key, label, icon }, idx) => {
          const data = spiderData?.skills[key];
          if (!data) return null;
          const pct = Math.min(100, (data.current / 10) * 100);
          const trend = trendDisplay[data.trend];
          const trendColor =
            trend.type === "success" ? c.success
            : trend.type === "destructive" ? c.destructive
            : trend.type === "warning" ? c.warning
            : c.mutedForeground;

          return (
            <AnimatedSkillBar
              key={key}
              skill={key}
              label={label}
              icon={icon}
              score={data.current}
              pct={pct}
              trendText={trend.text}
              trendColor={trendColor}
              colors={c}
              delay={200 + idx * 80}
              onPress={() => router.push(`/(app)/skill/${key}`)}
            />
          );
        })}

        {/* ─── ETA + Goal Cards ─── */}
        <Animated.View style={[styles.cardRow, cardsFade]}>
          {spiderData?.eta.weeks != null && (
            <View style={[styles.halfCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={[styles.halfCardIcon, { backgroundColor: c.primary + "15" }]}>
                <Ionicons name="time-outline" size={20} color={c.primary} />
              </View>
              <Text style={[styles.halfCardValue, { color: c.foreground }]}>
                {spiderData.eta.weeks} tuần
              </Text>
              <Text style={[styles.halfCardLabel, { color: c.mutedForeground }]}>
                Thời gian ước tính
              </Text>
            </View>
          )}
          {goal && (
            <View style={[styles.halfCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={[styles.halfCardIcon, { backgroundColor: c.success + "15" }]}>
                <Ionicons name="flag" size={20} color={c.success} />
              </View>
              <Text style={[styles.halfCardValue, { color: c.foreground }]}>
                Band {goal.targetBand}
              </Text>
              <Text style={[styles.halfCardLabel, { color: c.mutedForeground }]}>
                Hạn: {goal.deadline ? new Date(goal.deadline).toLocaleDateString("vi-VN") : "Chưa đặt"}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* ─── Per-skill ETA ─── */}
        {spiderData?.eta.perSkill && (
          <Animated.View style={[styles.perSkillCard, { backgroundColor: c.card, borderColor: c.border }, cardsFade]}>
            <Text style={[styles.perSkillTitle, { color: c.foreground }]}>Ước tính theo kỹ năng</Text>
            {SKILLS.map(({ key, label }) => {
              const weeks = spiderData.eta.perSkill[key];
              if (weeks == null) return null;
              return (
                <View key={key} style={styles.perSkillRow}>
                  <Text style={[styles.perSkillLabel, { color: c.mutedForeground }]}>{label}</Text>
                  <Text style={[styles.perSkillValue, { color: c.foreground }]}>{weeks} tuần</Text>
                </View>
              );
            })}
          </Animated.View>
        )}
      </BouncyScrollView>
    </View>
  );
}

// ─── Animated Skill Bar ──────────────────────────────────────────────────────

function AnimatedSkillBar(props: {
  skill: Skill;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  score: number;
  pct: number;
  trendText: string;
  trendColor: string;
  colors: ReturnType<typeof useThemeColors>;
  delay: number;
  onPress: () => void;
}) {
  const { skill, label, icon, score, pct, trendText, trendColor, colors: c, delay, onPress } = props;
  const skillColor = useSkillColor(skill);
  const fade = useFadeIn(delay);

  // Animated bar width
  const barWidth = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(barWidth, {
        toValue: pct,
        duration: 800,
        useNativeDriver: false,
      }).start();
    }, delay + 200);
    return () => clearTimeout(timer);
  }, [pct, delay, barWidth]);

  return (
    <Animated.View style={fade}>
      <HapticTouchable style={[styles.skillCard, { backgroundColor: c.card, borderColor: c.border }]} onPress={onPress}>
        <View style={styles.skillTop}>
          <View style={[styles.skillIconWrap, { backgroundColor: skillColor + "20" }]}>
            <Ionicons name={icon} size={18} color={skillColor} />
          </View>
          <Text style={[styles.skillLabel, { color: c.foreground }]}>{label}</Text>
          <Text style={{ color: trendColor, fontSize: fontSize.xs, fontFamily: fontFamily.regular }}>{trendText}</Text>
          <Text style={[styles.skillScore, { color: c.foreground }]}>{score.toFixed(1)}</Text>
        </View>
        <View style={[styles.barBg, { backgroundColor: c.muted }]}>
          <Animated.View
            style={[
              styles.barFill,
              {
                backgroundColor: skillColor,
                width: barWidth.interpolate({
                  inputRange: [0, 100],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
      </HapticTouchable>
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: spacing["3xl"], gap: spacing.md },

  // Empty
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing["2xl"], gap: spacing.sm },
  emptyTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.semiBold },
  emptySub: { fontSize: fontSize.sm, fontFamily: fontFamily.regular, textAlign: "center" },
  emptyBtn: { marginTop: spacing.base, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: radius.full },
  emptyBtnText: { fontFamily: fontFamily.bold, fontSize: fontSize.sm },

  // Spider Chart card
  chartCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.base,
    alignItems: "center",
    gap: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: { fontFamily: fontFamily.bold, fontSize: fontSize.lg, alignSelf: "flex-start" },
  avgBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  avgLabel: { fontFamily: fontFamily.regular, fontSize: fontSize.sm },
  avgValue: { fontFamily: fontFamily.bold, fontSize: fontSize.lg },

  // Section
  sectionHeader: { fontFamily: fontFamily.bold, fontSize: fontSize.base, marginTop: spacing.xs },

  // Skill bars
  skillCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.base,
    gap: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  skillTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  skillIconWrap: { width: 32, height: 32, borderRadius: radius.sm, justifyContent: "center", alignItems: "center" },
  skillLabel: { flex: 1, fontFamily: fontFamily.semiBold, fontSize: fontSize.sm },
  skillScore: { fontFamily: fontFamily.bold, fontSize: fontSize.sm },
  barBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3 },

  // Cards row (ETA + Goal)
  cardRow: { flexDirection: "row", gap: spacing.md },
  halfCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.base,
    alignItems: "center",
    gap: spacing.xs,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  halfCardIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  halfCardValue: { fontFamily: fontFamily.bold, fontSize: fontSize.xl },
  halfCardLabel: { fontFamily: fontFamily.regular, fontSize: fontSize.xs, textAlign: "center" },

  // Per-skill ETA
  perSkillCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.base,
    gap: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  perSkillTitle: { fontFamily: fontFamily.semiBold, fontSize: fontSize.sm },
  perSkillRow: { flexDirection: "row", justifyContent: "space-between" },
  perSkillLabel: { fontFamily: fontFamily.regular, fontSize: fontSize.sm },
  perSkillValue: { fontFamily: fontFamily.semiBold, fontSize: fontSize.sm },
});
