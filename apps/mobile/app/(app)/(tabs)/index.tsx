import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { HapticTouchable } from "@/components/HapticTouchable";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";
import { SpiderChart } from "@/components/SpiderChart";
import { SkillIcon, SKILL_LABELS } from "@/components/SkillIcon";
import { GameIcon } from "@/components/GameIcon";
import { StreakButton } from "@/features/streak/StreakButton";
import { NotificationButton } from "@/features/notification/NotificationButton";
import { TopUpDialog } from "@/features/coin/TopUpDialog";
import { useCoins } from "@/features/coin/coin-store";
import { useAuth } from "@/hooks/use-auth";
import { useOverview, useStreak } from "@/hooks/use-progress";
import { useThemeColors, useSkillColor, spacing, radius, fontSize, fontFamily } from "@/theme";
import { depthNeutral } from "@/theme/depth";
import { useState } from "react";
import type { Skill } from "@/types/api";

const SKILLS: Skill[] = ["listening", "reading", "writing", "speaking"];

const SKILL_META: Record<Skill, { label: string; desc: string }> = {
  listening: { label: "Nghe", desc: "Listening" },
  reading:   { label: "Đọc", desc: "Reading" },
  writing:   { label: "Viết", desc: "Writing" },
  speaking:  { label: "Nói", desc: "Speaking" },
};

export default function DashboardScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const router = useRouter();
  const coins = useCoins();
  const [topUpVisible, setTopUpVisible] = useState(false);
  const { data: overview } = useOverview();
  const { data: streakData } = useStreak();

  const nickname = profile?.nickname ?? user?.fullName ?? "Bạn";
  const initial = nickname.charAt(0).toUpperCase();
  const daysLeft = overview?.profile?.daysUntilExam ?? null;
  const targetLevel = profile?.targetLevel ?? overview?.profile?.targetLevel ?? "B2";
  const targetDeadline = profile?.targetDeadline ?? overview?.profile?.targetDeadline ?? null;
  const stats = overview?.stats;
  const chart = overview?.chart ?? null;

  // Weakest skill from chart
  const weakest = chart
    ? SKILLS.reduce((w, s) => (chart[s] ?? 0) < (chart[w] ?? 0) ? s : w, SKILLS[0])
    : "listening";

  return (
    <ScrollView
      style={[s.root, { backgroundColor: c.background }]}
      contentContainerStyle={[s.scroll, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Topbar ── */}
      <View style={s.topBar}>
        <Text style={[s.topBarTitle, { color: c.foreground }]}>Tổng quan</Text>
        <View style={s.topBarRight}>
          <StreakButton streak={streakData?.currentStreak ?? 0} activityByDay={{}} />
          <HapticTouchable
            style={[s.coinBadge, { backgroundColor: c.coinTint }]}
            onPress={() => setTopUpVisible(true)}
          >
            <GameIcon name="coin" size={16} />
            <Text style={[s.coinText, { color: c.coinDark }]}>{coins}</Text>
          </HapticTouchable>
          <NotificationButton />
        </View>
      </View>

      {/* ── Profile Banner (green gradient like frontend-v3) ── */}
      <LinearGradient
        colors={[c.primaryLight, c.primary, c.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.banner}
      >
        <View style={s.decoCircle1} />
        <View style={s.decoCircle2} />
        <View style={s.bannerRow}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.bannerHi}>Hi, {nickname}</Text>
            <Text style={s.bannerSub}>
              {daysLeft != null
                ? `Còn ${daysLeft} ngày đến kỳ thi — giữ vững!`
                : "Đặt mục tiêu để bắt đầu lộ trình!"}
            </Text>
          </View>
        </View>
        <View style={[s.targetBox, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
          <Text style={s.targetLabel}>Mục tiêu</Text>
          <Text style={s.targetLevel}>{targetLevel}</Text>
          {targetDeadline && <Text style={s.targetDate}>{targetDeadline}</Text>}
        </View>
      </LinearGradient>

      {/* ── Next Action ── */}
      <View style={[s.card, s.nextAction]}>
        <View style={[s.nextIconWrap, { backgroundColor: c.primaryTint }]}>
          <SkillIcon skill={weakest} size={22} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.nextTitle, { color: c.foreground }]}>Bạn chưa luyện tập hôm nay!</Text>
          <Text style={[s.nextSub, { color: c.subtle }]}>
            Gợi ý: Luyện {SKILL_META[weakest].label} · 15 phút · Giữ streak {(streakData?.currentStreak ?? 0) + 1} ngày
          </Text>
        </View>
        <HapticTouchable
          style={[s.nextBtn, { backgroundColor: c.primary }]}
          onPress={() => router.push(`/(app)/practice/${weakest}`)}
        >
          <Text style={s.nextBtnText}>Bắt đầu</Text>
        </HapticTouchable>
      </View>

      {/* ── Stats Row ── */}
      <View style={s.statsGrid}>
        <StatCard icon="🔥" label="Streak" value={`${streakData?.currentStreak ?? 0} ngày`} />
        <StatCard
          icon="⏱"
          label="Luyện tập"
          value={stats ? formatMinutes(stats.totalStudyMinutes) : "—"}
        />
        <StatCard
          icon="📝"
          label="Bài thi"
          value={stats ? `${stats.totalTests}/${stats.minTestsRequired}` : "—"}
        />
        <StatCard icon="🏆" label="Band" value={chart ? computeAvgBand(chart) : "—"} />
      </View>

      {/* ── Spider Chart ── */}
      <View style={s.card}>
        <Text style={[s.sectionTitle, { color: c.foreground }]}>Năng lực 4 kỹ năng</Text>
        <Text style={[s.sectionSub, { color: c.subtle }]}>
          {chart
            ? `Từ ${chart.sampleSize} bài thi thử gần nhất`
            : stats
              ? `Cần thêm ${Math.max(0, (stats.minTestsRequired ?? 5) - (stats.totalTests ?? 0))} bài thi để hiện biểu đồ`
              : "Chưa có dữ liệu"}
        </Text>
        <SpiderChart
          skills={{
            listening: { current: chart?.listening ?? 0, trend: "stable" },
            reading:   { current: chart?.reading   ?? 0, trend: "stable" },
            writing:   { current: chart?.writing   ?? 0, trend: "stable" },
            speaking:  { current: chart?.speaking  ?? 0, trend: "stable" },
          }}
        />
      </View>

      {/* ── Activity Heatmap ── */}
      <ActivityHeatmap />

      <View style={{ height: insets.bottom + 40 }} />
      <TopUpDialog visible={topUpVisible} onClose={() => setTopUpVisible(false)} />
    </ScrollView>
  );
}

// ── Helpers ──

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins} phút`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}g ${m}p` : `${h} giờ`;
}

function computeAvgBand(chart: { listening: number | null; reading: number | null; writing: number | null; speaking: number | null }): string {
  const vals = [chart.listening, chart.reading, chart.writing, chart.speaking].filter((v): v is number => v !== null);
  if (!vals.length) return "—";
  return (Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10).toFixed(1);
}

// ── Sub-components ──

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  const c = useThemeColors();
  return (
    <View style={[s.statCard, { backgroundColor: c.card }]}>
      <Text style={s.statIcon}>{icon}</Text>
      <Text style={[s.statLabel, { color: c.subtle }]}>{label}</Text>
      <Text style={[s.statValue, { color: c.foreground }]}>{value}</Text>
    </View>
  );
}

// ── Styles ──

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing["3xl"] },

  // Topbar
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.base },
  topBarTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold },
  topBarRight: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  coinBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full },
  coinText: { fontSize: 13, fontFamily: fontFamily.bold },

  // Banner (ProfileBanner equivalent)
  banner: {
    borderRadius: radius["2xl"],
    padding: spacing.lg,
    gap: spacing.md,
    overflow: "hidden",
    marginBottom: spacing.base,
  },
  decoCircle1: { position: "absolute", top: -32, right: -32, width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.1)" },
  decoCircle2: { position: "absolute", bottom: -12, right: 24, width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(255,255,255,0.08)" },
  bannerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFF", fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  bannerHi: { color: "#FFF", fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  bannerSub: { color: "rgba(255,255,255,0.85)", fontSize: fontSize.sm, marginTop: 2 },
  targetBox: { borderRadius: radius.xl, padding: spacing.md, alignSelf: "flex-start", minWidth: 120 },
  targetLabel: { color: "rgba(255,255,255,0.7)", fontSize: fontSize.xs, fontFamily: fontFamily.semiBold, marginBottom: 2 },
  targetLevel: { color: "#FFF", fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  targetDate: { color: "rgba(255,255,255,0.7)", fontSize: fontSize.xs, marginTop: 2 },

  // Card base (frontend-v3 .card)
  card: {
    ...depthNeutral,
    backgroundColor: "#FFF",
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.base,
    gap: spacing.sm,
  },

  // Next Action
  nextAction: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.base },
  nextIconWrap: { width: 44, height: 44, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  nextTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  nextSub: { fontSize: fontSize.xs, marginTop: 2, lineHeight: 16 },
  nextBtn: { borderRadius: radius.button, paddingHorizontal: spacing.base, paddingVertical: spacing.sm },
  nextBtnText: { color: "#FFF", fontSize: fontSize.xs, fontFamily: fontFamily.bold, textTransform: "uppercase" },

  // Stats grid (2x2)
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.base },
  statCard: {
    ...depthNeutral,
    borderRadius: radius.lg,
    padding: spacing.base,
    width: "48%",
    gap: 2,
  },
  statIcon: { fontSize: 22 },
  statLabel: { fontSize: fontSize.xs },
  statValue: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold },

  // Section headings
  sectionTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.extraBold },
  sectionSub: { fontSize: fontSize.sm },
});
