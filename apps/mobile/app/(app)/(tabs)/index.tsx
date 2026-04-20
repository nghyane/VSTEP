import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { HapticTouchable } from "@/components/HapticTouchable";
import { SegmentedTabs } from "@/components/SegmentedTabs";
import { SpiderChart } from "@/components/SpiderChart";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { overviewQuery, selectProfile, selectStats, selectSpider, activityHeatmapQuery, getTargetBand } from "@/features/dashboard/queries";
import { skills } from "@/lib/skills";
import { useThemeColors, useSkillColor, spacing, radius, fontSize, fontFamily } from "@/theme";
import { depthNeutral, depthSemantic } from "@/theme/depth";
import { GameIcon } from "@/components/GameIcon";
import { useWalletBalance } from "@/features/wallet/queries";
import { StreakButton } from "@/features/streak/StreakButton";
import { NotificationButton } from "@/features/notification/NotificationButton";
import { TopUpDialog } from "@/features/coin/TopUpDialog";

type Tab = "overview" | "track";

export default function OverviewScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const authProfile = useAuth((s) => s.profile);
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [topUpVisible, setTopUpVisible] = useState(false);
  const coins = useWalletBalance();
  const { data: apiProfile } = useQuery({ ...overviewQuery, select: selectProfile });
  const { data: stats } = useQuery({ ...overviewQuery, select: selectStats });
  const { data: spider } = useQuery({ ...overviewQuery, select: selectSpider });

  const nickname = apiProfile?.nickname ?? authProfile?.nickname ?? "Học viên";
  const initials = nickname.split(" ").map((w: string) => w[0]).join("").slice(-2).toUpperCase();
  const daysLeft = apiProfile?.days_until_exam ?? 0;

  return (
    <ScrollView style={[s.root, { backgroundColor: c.background }]} contentContainerStyle={[s.scroll, { paddingTop: insets.top }]}>
      {/* ── Topbar: coin + actions ── */}
      <View style={s.topBar}>
        <Text style={[s.topBarTitle, { color: c.foreground }]}>Tổng quan</Text>
        <View style={s.topBarRight}>
          <StreakButton streak={stats?.streak ?? 0} activityByDay={{}} />
          <HapticTouchable style={[s.coinBadge, { backgroundColor: c.coin + "15" }]} onPress={() => setTopUpVisible(true)}>
            <GameIcon name="coin" size={16} />
            <Text style={[s.coinBadgeText, { color: c.coinDark }]}>{coins}</Text>
          </HapticTouchable>
          <NotificationButton />
          <HapticTouchable style={[s.topBarBtn, { backgroundColor: c.background }]} onPress={() => router.push("/(app)/onboarding")}>
            <Ionicons name="settings-outline" size={18} color={c.subtle} />
          </HapticTouchable>
        </View>
      </View>

      {/* ── Profile Banner ── */}
      <LinearGradient colors={["#58CC02", "#79D634"]} style={s.banner}>
        <View style={s.decoCircle1} />
        <View style={s.decoCircle2} />
        <View style={s.bannerRow}>
          <View style={s.avatar}><Text style={s.avatarText}>{initials}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>Hi, {nickname}</Text>
            <Text style={s.greetingSub}>Còn <Text style={{ fontFamily: fontFamily.bold }}>{daysLeft} ngày</Text> diễn ra kỳ thi. Giữ vững nhé!</Text>
          </View>
        </View>
        <View style={s.levelTrack}>
          <LevelDot label="Đầu vào" value="A2" variant="done" />
          <View style={s.levelLine} />
          <LevelDot label="Dự đoán" value="B1" variant="active" />
          <View style={s.levelLine} />
          <LevelDot label="Mục tiêu" value="B2" variant="target" />
        </View>
      </LinearGradient>

      {/* ── Tab Bar ── */}
      <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.base }}>
        <SegmentedTabs tabs={[{ key: "overview", label: "Tổng quan" }, { key: "track", label: "Lộ trình" }]} activeKey={tab} onTabChange={(k) => setTab(k as Tab)} />
      </View>

      {/* ── Tab Content ── */}
      <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.base }}>
        {tab === "overview" ? <OverviewTab /> : <PracticeTrackTab />}
      </View>

      <View style={{ height: insets.bottom + 40 }} />
      <TopUpDialog visible={topUpVisible} onClose={() => setTopUpVisible(false)} />
    </ScrollView>
  );
}

function LevelDot({ label, value, variant }: { label: string; value: string; variant: "done" | "active" | "target" }) {
  return (
    <View style={s.levelDotWrap}>
      <Text style={s.levelLabel}>{label}</Text>
      <View style={[s.levelDot, variant === "done" && s.levelDotDone, variant === "active" && s.levelDotActive, variant === "target" && s.levelDotTarget]} />
      <Text style={[s.levelValue, variant === "active" && { color: "#93C5FD" }]}>{value}</Text>
    </View>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────

function OverviewTab() {
  const c = useThemeColors();
  const { data: apiProfile } = useQuery({ ...overviewQuery, select: selectProfile });
  const { data: stats } = useQuery({ ...overviewQuery, select: selectStats });
  const { data: spiderData } = useQuery({ ...overviewQuery, select: selectSpider });

  const streak = stats?.streak ?? 0;
  const totalTests = stats?.total_tests ?? 0;
  const studyMins = stats?.total_study_minutes ?? 0;
  const studyHours = Math.floor(studyMins / 60);

  return (
    <View style={{ gap: spacing.base }}>
      {/* Stat Grid */}
      <View style={s.statGrid}>
        <StatCard icon="flame-outline" label="Streak" value={`${streak} ngày`} color={c.streak} />
        <StatCard icon="time-outline" label="Luyện tập" value={studyHours > 0 ? `${studyHours}h${studyMins % 60}p` : `${studyMins}p`} color={c.info} />
        <StatCard icon="document-text-outline" label="Bài thi" value={String(totalTests)} color={c.primary} />
        <StatCard icon="trophy-outline" label="Band TB" value={spiderData?.chart ? String(Math.round(((spiderData.chart.listening ?? 0) + (spiderData.chart.reading ?? 0) + (spiderData.chart.writing ?? 0) + (spiderData.chart.speaking ?? 0)) / 4 * 10) / 10) : "—"} color={c.foreground} />
      </View>
      {/* Exam Countdown */}
      <ExamCountdown daysLeft={apiProfile?.days_until_exam ?? 0} />

      {/* Spider Chart */}
      <SpiderChart skills={spiderData?.chart ? { listening: { current: spiderData.chart.listening ?? 0, trend: "stable" }, reading: { current: spiderData.chart.reading ?? 0, trend: "stable" }, writing: { current: spiderData.chart.writing ?? 0, trend: "stable" }, speaking: { current: spiderData.chart.speaking ?? 0, trend: "stable" } } : { listening: { current: 0, trend: "stable" }, reading: { current: 0, trend: "stable" }, writing: { current: 0, trend: "stable" }, speaking: { current: 0, trend: "stable" } }} />

      {/* Activity Heatmap */}
      <ActivityHeatmap />
    </View>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  const c = useThemeColors();
  return (
    <View style={[s.statCard, { }]}>
      <Ionicons name={icon as any} size={22} color={color} />
      <Text style={[s.statLabel, { color: c.subtle }]}>{label}</Text>
      <Text style={[s.statValue, { color }]}>{value}</Text>
    </View>
  );
}

function ExamCountdown({ daysLeft }: { daysLeft: number }) {
  const c = useThemeColors();
  // Countdown to midnight of exam day (daysLeft from now)
  const targetMs = useMemo(() => {
    const t = new Date();
    t.setDate(t.getDate() + daysLeft + 1); // +1 vì đếm nguyên ngày
    t.setHours(0, 0, 0, 0);
    return t.getTime();
  }, [daysLeft]);
  const [time, setTime] = useState({ d: daysLeft, h: 0, m: 0, sec: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, targetMs - Date.now());
      const totalSec = Math.floor(diff / 1000);
      setTime({ d: Math.floor(totalSec / 86400), h: Math.floor((totalSec % 86400) / 3600), m: Math.floor((totalSec % 3600) / 60), sec: totalSec % 60 });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <View style={[s.countdownCard, { borderColor: c.border }]}>
      <View style={s.countdownHeader}>
        <Ionicons name="calendar" size={18} color={c.primary} />
        <Text style={[s.countdownTitle, { color: c.foreground }]}>Đếm ngày thi</Text>
      </View>
      <View style={s.countdownRow}>
        {[{ v: pad(time.d), l: "ngày" }, { v: pad(time.h), l: "giờ" }, { v: pad(time.m), l: "phút" }, { v: pad(time.sec), l: "giây" }].map((b, i) => (
          <View key={b.l} style={s.countdownBlockWrap}>
            {i > 0 && <Text style={[s.countdownColon, { color: c.subtle }]}>:</Text>}
            <View style={s.countdownBlockInner}>
              <View style={[s.countdownBlock, { backgroundColor: c.primary }]}>
                <Text style={s.countdownNum}>{b.v}</Text>
              </View>
              <Text style={[s.countdownLabel, { color: c.subtle }]}>{b.l}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Practice Track Tab ───────────────────────────────────────────

function PracticeTrackTab() {
  const c = useThemeColors();
  return (
    <View style={{ padding: spacing.xl, alignItems: "center", gap: spacing.sm }}>
      <GameIcon name="target" size={48} />
      <Text style={{ color: c.foreground, fontSize: fontSize.lg, fontFamily: fontFamily.bold }}>Lộ trình học tập</Text>
      <Text style={{ color: c.subtle, fontSize: fontSize.sm, textAlign: "center" }}>Hoàn thành bài thi thử để xem tiến độ chi tiết.</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: spacing["3xl"] },
  // Banner
  // Topbar
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.xl, marginBottom: spacing.sm },
  topBarTitle: { flex: 1, fontSize: fontSize.xl, fontFamily: fontFamily.bold },
  topBarRight: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  coinBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  coinBadgeText: { fontSize: 13, fontFamily: fontFamily.bold },
  topBarBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  // Banner
  banner: { marginHorizontal: spacing.xl, borderRadius: radius["2xl"], padding: spacing.lg, gap: spacing.md, overflow: "hidden" },
  decoCircle1: { position: "absolute", top: -32, right: -32, width: 128, height: 128, borderRadius: 64, backgroundColor: "rgba(255,255,255,0.05)" },
  decoCircle2: { position: "absolute", bottom: -16, right: -16, width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.05)" },
  bannerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: fontSize.base, fontFamily: fontFamily.bold },
  greeting: { color: "#fff", fontSize: fontSize.lg, fontFamily: fontFamily.bold },
  greetingSub: { color: "rgba(255,255,255,0.85)", fontSize: fontSize.xs, marginTop: 2 },
  // Level track
  levelTrack: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: radius.xl, paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  levelDotWrap: { alignItems: "center", gap: 4, flex: 1 },
  levelLabel: { color: "rgba(255,255,255,0.7)", fontSize: 10 },
  levelDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: "#fff" },
  levelDotDone: { backgroundColor: "#fff" },
  levelDotActive: { backgroundColor: "#fff", shadowColor: "#fff", shadowOpacity: 0.4, shadowRadius: 6 },
  levelDotTarget: { backgroundColor: "transparent" },
  levelValue: { color: "#fff", fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  levelLine: { height: 1, flex: 1, backgroundColor: "rgba(255,255,255,0.3)", marginHorizontal: 4 },
  // Stat grid
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  statCard: { width: "48%", borderRadius: radius["2xl"], padding: spacing.base, gap: 4, ...depthNeutral, backgroundColor: "#FFF" },
  statLabel: { fontSize: fontSize.xs },
  statValue: { fontSize: fontSize.lg, fontFamily: fontFamily.bold },
  // Card
  card: { borderRadius: radius["2xl"], padding: spacing.lg, gap: spacing.base, ...depthNeutral, backgroundColor: "#FFF" },
  cardTitle: { fontSize: fontSize.base, fontFamily: fontFamily.semiBold },
  // Doughnut
  doughnutRow: { flexDirection: "row", justifyContent: "space-around", alignItems: "flex-end", height: 120, paddingTop: spacing.sm },
  doughnutItem: { alignItems: "center", gap: 4, flex: 1 },
  doughnutBar: { width: 28, height: 80, borderRadius: 4, justifyContent: "flex-end", overflow: "hidden" },
  doughnutFill: { width: "100%", borderRadius: 4 },
  doughnutLabel: { fontSize: 10 },
  doughnutPct: { fontSize: 11, fontFamily: fontFamily.bold },
  // Countdown
  countdownCard: { ...depthNeutral, borderRadius: radius["2xl"], padding: spacing.lg, gap: spacing.base, backgroundColor: "#FFF" },
  countdownHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  countdownTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  countdownRow: { flexDirection: "row", justifyContent: "center", alignItems: "flex-start" },
  countdownBlockWrap: { flexDirection: "row", alignItems: "flex-start" },
  countdownColon: { fontSize: fontSize.xl, fontFamily: fontFamily.bold, marginTop: spacing.md, marginHorizontal: 2 },
  countdownBlockInner: { alignItems: "center", gap: 4 },
  countdownBlock: { width: 56, height: 48, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  countdownNum: { color: "#fff", fontSize: fontSize.xl, fontFamily: fontFamily.bold, fontVariant: ["tabular-nums"] },
  countdownLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.medium, textAlign: "center" },
  // Score grid
  scoreGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  scoreCard: { width: "48%", ...depthNeutral, borderRadius: radius.xl, padding: spacing.base, backgroundColor: "#FFF" },
  scoreCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  scoreCardLabel: { fontSize: fontSize.sm },
  scoreCardValue: { fontSize: fontSize["2xl"], fontFamily: fontFamily.bold, fontVariant: ["tabular-nums"] },
  scoreCardMeta: { fontSize: fontSize.xs, marginTop: 2 },
  // History
  historyRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, ...depthNeutral, borderRadius: radius.lg, padding: spacing.md, backgroundColor: "#FFF" },
  historyScore: { width: 40, height: 40, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  historyScoreText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  historySkill: { fontSize: fontSize.xs, fontFamily: fontFamily.medium },
  historyId: { fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  historyDate: { fontSize: fontSize.xs },
  emptyText: { fontSize: fontSize.sm, textAlign: "center", paddingVertical: spacing["2xl"] },
});
