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
import type { Skill } from "@/types/api";
import { MOCK_OVERVIEW_STATS, MOCK_PRACTICE_TRACK } from "@/lib/mock";

type Tab = "overview" | "track";

export default function OverviewScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const { data: progress } = useProgress();
  const { data: activity } = useActivity(90);

  const fullName = user?.fullName ?? "Học viên";
  const initials = fullName.split(" ").map((w) => w[0]).join("").slice(-2).toUpperCase();
  const stats = MOCK_OVERVIEW_STATS;

  return (
    <ScrollView style={[s.root, { backgroundColor: c.background }]} contentContainerStyle={[s.scroll, { paddingTop: insets.top }]}>
      {/* ── Profile Banner ── */}
      <LinearGradient colors={["#1a6ef5", "#1a6ef5CC"]} style={s.banner}>
        <View style={s.bannerRow}>
          <View style={s.avatar}><Text style={s.avatarText}>{initials}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>Hi, {fullName}</Text>
            <Text style={s.greetingSub}>Còn <Text style={{ fontFamily: fontFamily.bold }}>{stats.daysLeft} ngày</Text> diễn ra kỳ thi. Giữ vững tập trung nhé!</Text>
          </View>
        </View>
        {/* Level track */}
        <View style={s.levelTrack}>
          <LevelDot label="Đầu vào" value="A2" variant="done" />
          <View style={s.levelLine} />
          <LevelDot label="Dự đoán" value="B1" variant="active" />
          <View style={s.levelLine} />
          <LevelDot label="Mục tiêu" value="B2" variant="target" />
        </View>
        {/* Goal button — absolute top-right */}
        <HapticTouchable style={s.goalBtn} onPress={() => router.push("/(app)/onboarding")}>
          <Ionicons name="navigate-outline" size={16} color="#fff" />
        </HapticTouchable>
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
        <StatCard icon={stats.trend === "up" ? "trending-up-outline" : stats.trend === "down" ? "trending-down-outline" : "swap-horizontal-outline"} label="Xu hướng" value={trendLabel[stats.trend] ?? "—"} color={trendColor[stats.trend] ?? c.mutedForeground} />
        <StatCard icon="checkmark-done-outline" label="Tổng bài test" value={String(stats.totalTests)} color={c.success} />
        <StatCard icon="alert-circle-outline" label="Kỹ năng yếu" value={stats.weakestSkill ? weakLabel[stats.weakestSkill] ?? "—" : "—"} color={c.foreground} />
      </View>

      {/* Exam Countdown */}
      <ExamCountdown daysLeft={stats.daysLeft} />

      {/* Spider Chart */}
      <View style={[s.card, { backgroundColor: c.muted + "80" }]}>
        <Text style={[s.cardTitle, { color: c.foreground }]}>Biểu đồ kỹ năng</Text>
        <SpiderChart skills={spider} />
      </View>

      {/* Doughnut Chart */}
      <View style={[s.card, { backgroundColor: c.muted + "80" }]}>
        <Text style={[s.cardTitle, { color: c.foreground }]}>Phân bố bài tập</Text>
        <View style={s.doughnutRow}>
          {(["listening", "reading", "writing", "speaking"] as Skill[]).map((sk) => {
            const info = skills.find((si: any) => si.skill === sk);
            const count = info?.attemptCount ?? 0;
            const total = skills.reduce((sum: number, si: any) => sum + (si.attemptCount ?? 0), 0) || 1;
            const pct = Math.round((count / total) * 100);
            const color = useSkillColor(sk);
            return (
              <View key={sk} style={s.doughnutItem}>
                <View style={[s.doughnutBar, { backgroundColor: c.muted }]}>
                  <View style={[s.doughnutFill, { backgroundColor: color, height: `${Math.max(pct, 5)}%` }]} />
                </View>
                <Text style={[s.doughnutLabel, { color: c.mutedForeground }]}>{SKILL_LABELS[sk]}</Text>
                <Text style={[s.doughnutPct, { color }]}>{pct}%</Text>
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
    <View style={[s.statCard, { backgroundColor: c.muted + "80" }]}>
      <Ionicons name={icon as any} size={22} color={color} />
      <Text style={[s.statLabel, { color: c.mutedForeground }]}>{label}</Text>
      <Text style={[s.statValue, { color }]}>{value}</Text>
    </View>
  );
}

function ExamCountdown({ daysLeft }: { daysLeft: number }) {
  const c = useThemeColors();
  const deadline = useMemo(() => new Date(Date.now() + daysLeft * 86400000).toISOString(), [daysLeft]);
  const [time, setTime] = useState({ d: daysLeft, h: 0, m: 0, sec: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, new Date(deadline).getTime() - Date.now());
      const totalSec = Math.floor(diff / 1000);
      setTime({ d: Math.floor(totalSec / 86400), h: Math.floor((totalSec % 86400) / 3600), m: Math.floor((totalSec % 3600) / 60), sec: totalSec % 60 });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <View style={[s.countdownCard, { borderColor: c.border }]}>
      <View style={s.countdownHeader}>
        <Ionicons name="calendar" size={18} color={c.primary} />
        <Text style={[s.countdownTitle, { color: c.foreground }]}>Đếm ngày thi</Text>
      </View>
      <View style={s.countdownRow}>
        {[{ v: pad(time.d), l: "Ngày" }, { v: pad(time.h), l: "Giờ" }, { v: pad(time.m), l: "Phút" }, { v: pad(time.sec), l: "Giây" }].map((b, i) => (
          <View key={b.l} style={s.countdownBlockWrap}>
            {i > 0 && <Text style={[s.countdownColon, { color: c.mutedForeground }]}>:</Text>}
            <View style={s.countdownBlockInner}>
              <View style={[s.countdownBlock, { backgroundColor: c.primary }]}>
                <Text style={s.countdownNum}>{b.v}</Text>
              </View>
              <Text style={[s.countdownLabel, { color: c.mutedForeground }]}>{b.l}</Text>
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
      <View style={[s.card, { backgroundColor: c.muted + "80" }]}>
        <Text style={[s.cardTitle, { color: c.foreground }]}>Điểm trung bình hàng tuần</Text>
        <View style={s.scoreGrid}>
          {SKILLS.map((sk) => {
            const info = data.skills.find((s) => s.skill === sk);
            const score = data.spider[sk]?.current ?? 0;
            const color = useSkillColor(sk);
            return (
              <View key={sk} style={[s.scoreCard, { borderColor: c.border, backgroundColor: c.card }]}>
                <View style={s.scoreCardHeader}>
                  <Text style={[s.scoreCardLabel, { color: c.mutedForeground }]}>{SKILL_LABELS[sk]}</Text>
                  <SkillIcon skill={sk} size={16} />
                </View>
                <Text style={[s.scoreCardValue, { color: c.foreground }]}>{score > 0 ? score.toFixed(1) : "—.—"}</Text>
                <Text style={[s.scoreCardMeta, { color: c.mutedForeground }]}>{info?.attemptCount ?? 0} bài test</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Test history */}
      <View style={[s.card, { backgroundColor: c.muted + "80" }]}>
        <Text style={[s.cardTitle, { color: c.foreground }]}>Lịch sử Test Practice</Text>
        {data.testSessions.length === 0 ? (
          <Text style={[s.emptyText, { color: c.mutedForeground }]}>Chưa có lịch sử test</Text>
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
                <View key={sess.id} style={[s.historyRow, { borderColor: c.border, backgroundColor: c.card }]}>
                  <View style={[s.historyScore, { backgroundColor: bestColor + "20" }]}>
                    <Text style={[s.historyScoreText, { color: bestColor }]}>{best?.score.toFixed(1) ?? "—"}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    {best && <Text style={[s.historySkill, { color: bestColor }]}>{SKILL_LABELS[best.skill]}</Text>}
                    <Text style={[s.historyId, { color: c.foreground }]}>Bài test #{sess.examId.slice(-6).toUpperCase()}</Text>
                  </View>
                  <Text style={[s.historyDate, { color: c.mutedForeground }]}>{dateStr}</Text>
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
  banner: { marginHorizontal: spacing.xl, borderRadius: radius["2xl"], padding: spacing.xl, gap: spacing.lg, marginTop: spacing.base },
  goalBtn: { position: "absolute", top: spacing.base, right: spacing.base, width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)", backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  bannerRow: { flexDirection: "row", alignItems: "center", gap: spacing.base },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: fontSize.xl, fontFamily: fontFamily.bold },
  greeting: { color: "#fff", fontSize: fontSize.xl, fontFamily: fontFamily.bold },
  greetingSub: { color: "rgba(255,255,255,0.85)", fontSize: fontSize.sm, marginTop: 2 },
  // Level track
  levelTrack: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: radius.xl, paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  levelDotWrap: { alignItems: "center", gap: 4, minWidth: 50 },
  levelLabel: { color: "rgba(255,255,255,0.7)", fontSize: 10 },
  levelDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: "#fff" },
  levelDotDone: { backgroundColor: "#fff" },
  levelDotActive: { backgroundColor: "#fff", shadowColor: "#fff", shadowOpacity: 0.4, shadowRadius: 6 },
  levelDotTarget: { backgroundColor: "transparent" },
  levelValue: { color: "#fff", fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  levelLine: { height: 1, flex: 1, backgroundColor: "rgba(255,255,255,0.3)", marginHorizontal: 4 },
  // Stat grid
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  statCard: { width: "48%", borderRadius: radius["2xl"], padding: spacing.base, gap: 4 },
  statLabel: { fontSize: fontSize.xs },
  statValue: { fontSize: fontSize.lg, fontFamily: fontFamily.bold },
  // Card
  card: { borderRadius: radius["2xl"], padding: spacing.lg, gap: spacing.base },
  cardTitle: { fontSize: fontSize.base, fontFamily: fontFamily.semiBold },
  // Doughnut
  doughnutRow: { flexDirection: "row", justifyContent: "space-around", alignItems: "flex-end", height: 120, paddingTop: spacing.sm },
  doughnutItem: { alignItems: "center", gap: 4, flex: 1 },
  doughnutBar: { width: 28, height: 80, borderRadius: 4, justifyContent: "flex-end", overflow: "hidden" },
  doughnutFill: { width: "100%", borderRadius: 4 },
  doughnutLabel: { fontSize: 10 },
  doughnutPct: { fontSize: 11, fontFamily: fontFamily.bold },
  // Countdown
  countdownCard: { borderWidth: 1, borderRadius: radius["2xl"], padding: spacing.lg, gap: spacing.base },
  countdownHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  countdownTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  countdownRow: { flexDirection: "row", justifyContent: "center", alignItems: "flex-start" },
  countdownBlockWrap: { flexDirection: "row", alignItems: "flex-start" },
  countdownColon: { fontSize: fontSize.lg, fontFamily: fontFamily.bold, marginTop: spacing.sm, marginHorizontal: 4 },
  countdownBlockInner: { alignItems: "center", gap: 4 },
  countdownBlock: { width: 52, height: 48, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  countdownNum: { color: "#fff", fontSize: fontSize.lg, fontFamily: fontFamily.bold, fontVariant: ["tabular-nums"] },
  countdownLabel: { fontSize: 9, fontFamily: fontFamily.semiBold, textTransform: "uppercase", minWidth: 40, textAlign: "center" },
  // Score grid
  scoreGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  scoreCard: { width: "48%", borderWidth: 1, borderRadius: radius.xl, padding: spacing.base },
  scoreCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  scoreCardLabel: { fontSize: fontSize.sm },
  scoreCardValue: { fontSize: fontSize["2xl"], fontFamily: fontFamily.bold, fontVariant: ["tabular-nums"] },
  scoreCardMeta: { fontSize: fontSize.xs, marginTop: 2 },
  // History
  historyRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 1, borderRadius: radius.lg, padding: spacing.md },
  historyScore: { width: 40, height: 40, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  historyScoreText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  historySkill: { fontSize: fontSize.xs, fontFamily: fontFamily.medium },
  historyId: { fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  historyDate: { fontSize: fontSize.xs },
  emptyText: { fontSize: fontSize.sm, textAlign: "center", paddingVertical: spacing["2xl"] },
});
