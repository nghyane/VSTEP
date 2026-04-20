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
import { SkillIcon, SKILL_LABELS } from "@/components/SkillIcon";
import { useAuth } from "@/hooks/use-auth";
import { useProgress, useActivity, usePracticeTrack } from "@/hooks/use-progress";
import { useThemeColors, useSkillColor, spacing, radius, fontSize, fontFamily } from "@/theme";
import { depthNeutral, depthSemantic } from "@/theme/depth";
import type { Skill } from "@/types/api";
import { MOCK_OVERVIEW_STATS, MOCK_PRACTICE_TRACK } from "@/lib/mock";
import { GameIcon } from "@/components/GameIcon";
import { useCoins } from "@/features/coin/coin-store";
import { StreakButton } from "@/features/streak/StreakButton";
import { NotificationButton } from "@/features/notification/NotificationButton";
import { TopUpDialog } from "@/features/coin/TopUpDialog";

type Tab = "overview" | "track";

export default function OverviewScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const profile = useAuth((s) => s.profile);
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [topUpVisible, setTopUpVisible] = useState(false);
  const coins = useCoins();
  const { data: progress } = useProgress();
  const { data: activity } = useActivity(90);

  const fullName = profile?.nickname ?? "Học viên";
  const initials = fullName.split(" ").map((w) => w[0]).join("").slice(-2).toUpperCase();
  const stats = MOCK_OVERVIEW_STATS;

  return (
    <ScrollView style={[s.root, { backgroundColor: c.background }]} contentContainerStyle={[s.scroll, { paddingTop: insets.top }]}>
      {/* ── Topbar: coin + actions ── */}
      <View style={s.topBar}>
        <Text style={[s.topBarTitle, { color: c.foreground }]}>Tổng quan</Text>
        <View style={s.topBarRight}>
          <StreakButton streak={activity?.streak ?? 0} activityByDay={(activity as any)?.activityByDay ?? {}} />
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
            <Text style={s.greeting}>Hi, {fullName}</Text>
            <Text style={s.greetingSub}>Còn <Text style={{ fontFamily: fontFamily.bold }}>{stats.daysLeft} ngày</Text> diễn ra kỳ thi. Giữ vững nhé!</Text>
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
        {tab === "overview" ? <OverviewTab stats={stats} /> : <PracticeTrackTab />}
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

function OverviewTab({ stats }: { stats: typeof MOCK_OVERVIEW_STATS }) {
  const c = useThemeColors();
  const { data: progress } = useProgress();
  const skills = progress?.skills ?? [];
  const spider = {
    listening: { current: 6.2, trend: "up" },
    reading: { current: 7.1, trend: "stable" },
    writing: { current: 5.4, trend: "down" },
    speaking: { current: 5.8, trend: "up" },
  } as Record<Skill, { current: number; trend: string }>;

  const weakLabel: Record<string, string> = { listening: "Listening", reading: "Reading", writing: "Writing", speaking: "Speaking" };

  const trendLabel: Record<string, string> = { up: "Cải thiện", stable: "Ổn định", down: "Cần cải thiện" };
  const trendColor: Record<string, string> = { up: c.success, stable: c.warning, down: c.destructive };

  return (
    <View style={{ gap: spacing.base }}>
      {/* Stat Grid */}
      <View style={s.statGrid}>
        <StatCard icon="scale-outline" label="Band còn thiếu" value={stats.avgScore > 0 ? `+${stats.bandGap.toFixed(1)}` : "—"} color={c.primary} />
        <StatCard icon={stats.trend === "up" ? "trending-up-outline" : stats.trend === "down" ? "trending-down-outline" : "swap-horizontal-outline"} label="Xu hướng" value={trendLabel[stats.trend] ?? "—"} color={trendColor[stats.trend] ?? c.subtle} />
        <StatCard icon="checkmark-done-outline" label="Tổng bài test" value={String(stats.totalTests)} color={c.success} />
        <StatCard icon="alert-circle-outline" label="Kỹ năng yếu" value={stats.weakestSkill ? weakLabel[stats.weakestSkill] ?? "—" : "—"} color={c.foreground} />
      </View>

      {/* Exam Countdown */}
      <ExamCountdown daysLeft={stats.daysLeft} />

      {/* Spider Chart */}
      <View style={[s.card, { }]}>
        <Text style={[s.cardTitle, { color: c.foreground }]}>Biểu đồ kỹ năng</Text>
        <SpiderChart skills={spider} />
      </View>

      {/* Doughnut Chart */}
      <View style={[s.card, { }]}>
        <Text style={[s.cardTitle, { color: c.foreground }]}>Phân bố bài tập</Text>
        <View style={s.doughnutRow}>
          {(["listening", "reading", "writing", "speaking"] as Skill[]).map((sk) => {
            const info = skills.find((si: any) => si.skill === sk);
            const count = info?.attemptCount ?? 0;
            const total = skills.reduce((sum: number, si: any) => sum + (si.attemptCount ?? 0), 0) || 1;
            const pct = Math.round((count / total) * 100);
            const skColor = c[`skill${sk.charAt(0).toUpperCase() + sk.slice(1)}` as keyof typeof c] ?? c.primary;
            return (
              <View key={sk} style={s.doughnutItem}>
                <View style={[s.doughnutBar, { backgroundColor: c.background }]}>
                  <View style={[s.doughnutFill, { backgroundColor: skColor, height: `${Math.max(pct, 5)}%` }]} />
                </View>
                <Text style={[s.doughnutLabel, { color: c.subtle }]}>{SKILL_LABELS[sk]}</Text>
                <Text style={[s.doughnutPct, { color: skColor }]}>{pct}%</Text>
              </View>
            );
          })}
        </View>
      </View>

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
  const data = MOCK_PRACTICE_TRACK;
  const SKILLS: Skill[] = ["listening", "reading", "writing", "speaking"];

  return (
    <View style={{ gap: spacing.base }}>
      {/* Score cards */}
      <View style={[s.card, { }]}>
        <Text style={[s.cardTitle, { color: c.foreground }]}>Điểm trung bình hàng tuần</Text>
        <View style={s.scoreGrid}>
          {SKILLS.map((sk) => {
            const info = data.skills.find((s) => s.skill === sk);
            const score = data.spider[sk]?.current ?? 0;
            const color = useSkillColor(sk);
            return (
              <View key={sk} style={[s.scoreCard, { borderColor: c.border, backgroundColor: c.surface }]}>
                <View style={s.scoreCardHeader}>
                  <Text style={[s.scoreCardLabel, { color: c.subtle }]}>{SKILL_LABELS[sk]}</Text>
                  <SkillIcon skill={sk} size={16} />
                </View>
                <Text style={[s.scoreCardValue, { color: c.foreground }]}>{score > 0 ? score.toFixed(1) : "—.—"}</Text>
                <Text style={[s.scoreCardMeta, { color: c.subtle }]}>{info?.attemptCount ?? 0} bài test</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Test history */}
      <View style={[s.card, { }]}>
        <Text style={[s.cardTitle, { color: c.foreground }]}>Lịch sử Test Practice</Text>
        {data.testSessions.length === 0 ? (
          <Text style={[s.emptyText, { color: c.subtle }]}>Chưa có lịch sử test</Text>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {data.testSessions.map((sess) => {
              const scores = [
                sess.listeningScore != null && { skill: "listening" as Skill, score: sess.listeningScore },
                sess.readingScore != null && { skill: "reading" as Skill, score: sess.readingScore },
                sess.writingScore != null && { skill: "writing" as Skill, score: sess.writingScore },
                sess.speakingScore != null && { skill: "speaking" as Skill, score: sess.speakingScore },
              ].filter(Boolean) as { skill: Skill; score: number }[];
              const best = scores.sort((a, b) => b.score - a.score)[0];
              const bestColor = best ? useSkillColor(best.skill) : c.muted;
              const dateStr = new Date(sess.completedAt).toLocaleDateString("vi-VN", { day: "numeric", month: "short" });

              return (
                <View key={sess.id} style={[s.historyRow, { borderColor: c.border, backgroundColor: c.surface }]}>
                  <View style={[s.historyScore, { backgroundColor: bestColor + "20" }]}>
                    <Text style={[s.historyScoreText, { color: bestColor }]}>{best?.score.toFixed(1) ?? "—"}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    {best && <Text style={[s.historySkill, { color: bestColor }]}>{SKILL_LABELS[best.skill]}</Text>}
                    <Text style={[s.historyId, { color: c.foreground }]}>Bài test #{sess.examId.slice(-6).toUpperCase()}</Text>
                  </View>
                  <Text style={[s.historyDate, { color: c.subtle }]}>{dateStr}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
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
