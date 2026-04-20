import { StyleSheet, Text, View } from "react-native";
import { BouncyScrollView } from "@/components/BouncyScrollView";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { ErrorScreen } from "@/components/ErrorScreen";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SKILL_LABELS } from "@/components/SkillIcon";
import { useSkillDetail } from "@/hooks/use-progress";
import { useThemeColors, useSkillColor, spacing, radius, fontSize } from "@/theme";
import type { Skill } from "@/types/api";

const trendDisplay: Record<string, { text: string; type: string }> = {
  improving: { text: "↑ Đang tiến bộ", type: "success" },
  stable: { text: "→ Ổn định", type: "muted" },
  declining: { text: "↓ Giảm", type: "destructive" },
  inconsistent: { text: "~ Không đều", type: "warning" },
  insufficient_data: { text: "— Chưa đủ dữ liệu", type: "muted" },
};

const streakArrow: Record<string, string> = { up: "↑", down: "↓", neutral: "→" };

export default function SkillDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const skill = name as Skill;
  const c = useThemeColors();
  const skillColor = useSkillColor(skill);
  const { data, isLoading, error } = useSkillDetail(skill);

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error.message} />;
  if (!data) return <ErrorScreen message="Kỹ năng không hợp lệ" />;

  const trend = trendDisplay[data.trend];
  const trendColor = trend.type === "success" ? c.success : trend.type === "destructive" ? c.destructive : trend.type === "warning" ? c.warning : c.subtle;
  const prog = data.progress;

  return (
    <BouncyScrollView style={[styles.container, { backgroundColor: c.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: c.foreground }]}>{SKILL_LABELS[skill]} — Chi tiết</Text>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard label="Trình độ" value={prog?.currentLevel ?? "—"} colors={c} />
        <StatCard label="Số lần luyện" value={String(prog?.attemptCount ?? 0)} colors={c} />
        <StatCard label="Chuỗi" value={`${prog?.streakCount ?? 0}`} colors={c} />
        <StatCard label="Xu hướng" value={trend.text} colors={c} valueColor={trendColor} />
      </View>

      {/* Score History */}
      <View style={[styles.section, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Text style={[styles.sectionTitle, { color: c.foreground }]}>Lịch sử điểm số</Text>
        {data.recentScores.length === 0 ? (
          <Text style={{ color: c.subtle, fontSize: fontSize.sm }}>Chưa có dữ liệu</Text>
        ) : (
          data.recentScores.map((s, i) => {
            const pct = Math.min(100, (s.score / 10) * 100);
            return (
              <View key={`${s.createdAt}-${i}`} style={styles.scoreRow}>
                <Text style={[styles.scoreDate, { color: c.subtle }]}>
                  {new Date(s.createdAt).toLocaleDateString("vi-VN")}
                </Text>
                <View style={[styles.barBg, { backgroundColor: c.background }]}>
                  <View style={[styles.barFill, { backgroundColor: skillColor, width: `${pct}%` }]} />
                </View>
                <Text style={[styles.scoreValue, { color: c.foreground }]}>{s.score.toFixed(1)}</Text>
              </View>
            );
          })
        )}
      </View>

      {/* Summary Stats */}
      <View style={[styles.section, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Text style={[styles.sectionTitle, { color: c.foreground }]}>Thống kê</Text>
        <View style={styles.summaryRow}>
          <SummaryItem label="Điểm trung bình" value={data.windowAvg != null ? `${data.windowAvg.toFixed(1)}/10` : "—"} colors={c} />
          <SummaryItem label="Độ lệch" value={data.windowDeviation != null ? data.windowDeviation.toFixed(2) : "—"} colors={c} />
          <SummaryItem label="ETA" value={data.eta != null ? `${data.eta} tuần` : "—"} colors={c} />
        </View>
      </View>
    </BouncyScrollView>
  );
}

function StatCard({ label, value, colors: c, valueColor }: { label: string; value: string; colors: any; valueColor?: string }) {
  return (
    <View style={[styles.statCard, { backgroundColor: c.background }]}>
      <Text style={{ color: c.subtle, fontSize: fontSize.xs }}>{label}</Text>
      <Text style={{ color: valueColor ?? c.foreground, fontSize: fontSize.lg, fontWeight: "700", marginTop: 4 }}>{value}</Text>
    </View>
  );
}

function SummaryItem({ label, value, colors: c }: { label: string; value: string; colors: any }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: c.subtle, fontSize: fontSize.xs }}>{label}</Text>
      <Text style={{ color: c.foreground, fontSize: fontSize.lg, fontWeight: "700", marginTop: 4 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.base, paddingBottom: spacing["3xl"] },
  title: { fontSize: fontSize["2xl"], fontWeight: "700" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  statCard: { width: "48%", borderRadius: radius.lg, padding: spacing.base },
  section: { borderWidth: 1, borderRadius: radius.xl, padding: spacing.base, gap: spacing.md },
  sectionTitle: { fontWeight: "700", fontSize: fontSize.base },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  scoreDate: { width: 80, fontSize: fontSize.xs, fontVariant: ["tabular-nums"] },
  barBg: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3 },
  scoreValue: { width: 36, textAlign: "right", fontWeight: "600", fontSize: fontSize.sm, fontVariant: ["tabular-nums"] },
  summaryRow: { flexDirection: "row", gap: spacing.md },
});
