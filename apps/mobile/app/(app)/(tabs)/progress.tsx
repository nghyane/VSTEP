import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ErrorScreen } from "@/components/ErrorScreen";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useProgress, useSpiderChart } from "@/hooks/use-progress";
import { useThemeColors, useSkillColor, spacing, radius, fontSize } from "@/theme";
import type { Skill, Trend } from "@/types/api";

const SKILLS: { key: Skill; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "listening", label: "Listening", icon: "headset" },
  { key: "reading", label: "Reading", icon: "book" },
  { key: "writing", label: "Writing", icon: "create" },
  { key: "speaking", label: "Speaking", icon: "mic" },
];

const trendDisplay: Record<Trend, { text: string; type: "success" | "muted" | "destructive" | "warning" }> = {
  improving: { text: "↑ Đang tiến bộ", type: "success" },
  stable: { text: "→ Ổn định", type: "muted" },
  declining: { text: "↓ Giảm", type: "destructive" },
  inconsistent: { text: "~ Không đều", type: "warning" },
  insufficient_data: { text: "— Chưa đủ dữ liệu", type: "muted" },
};

export default function ProgressScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const spider = useSpiderChart();
  const progress = useProgress();

  if (spider.isLoading || progress.isLoading) return <LoadingScreen />;
  if (spider.error || progress.error)
    return <ErrorScreen message={(spider.error || progress.error)?.message} onRetry={() => { spider.refetch(); progress.refetch(); }} />;

  const spiderData = spider.data;
  const goal = spiderData?.goal ?? progress.data?.goal ?? null;
  const hasData = spiderData && Object.keys(spiderData.skills).length > 0;

  if (!hasData) {
    return (
      <ScreenWrapper>
        <View style={[styles.emptyContainer]}>
          <Text style={[styles.emptyTitle, { color: c.foreground }]}>Hãy làm bài thi đầu tiên!</Text>
          <Text style={[styles.emptySub, { color: c.mutedForeground }]}>Chưa có dữ liệu tiến độ để hiển thị.</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: c.foreground }]}>Tiến độ học tập</Text>
      <Text style={[styles.subtitle, { color: c.mutedForeground }]}>Theo dõi sự tiến bộ qua từng kỹ năng</Text>

      {/* Skill Bars */}
      {SKILLS.map(({ key, label, icon }) => {
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
          <SkillBar
            key={key}
            skill={key}
            label={label}
            icon={icon}
            score={data.current}
            pct={pct}
            trendText={trend.text}
            trendColor={trendColor}
            colors={c}
            onPress={() => router.push(`/(app)/skill/${key}`)}
          />
        );
      })}

      {/* ETA */}
      {spiderData?.eta.weeks != null && (
        <View style={[styles.etaCard, { backgroundColor: c.muted }]}>
          <View style={styles.etaHeader}>
            <Ionicons name="time-outline" size={18} color={c.mutedForeground} />
            <Text style={[styles.etaTitle, { color: c.foreground }]}>Thời gian ước tính</Text>
          </View>
          <Text style={[styles.etaValue, { color: c.foreground }]}>{spiderData.eta.weeks} tuần</Text>
        </View>
      )}

      {/* Goal */}
      {goal && (
        <View style={[styles.goalCard, { backgroundColor: c.muted }]}>
          <View style={styles.etaHeader}>
            <Ionicons name="flag" size={18} color={c.mutedForeground} />
            <Text style={[styles.etaTitle, { color: c.foreground }]}>Mục tiêu</Text>
          </View>
          <View style={styles.goalRow}>
            <Text style={{ color: c.mutedForeground, fontSize: fontSize.sm }}>Band</Text>
            <Text style={{ color: c.foreground, fontWeight: "600", fontSize: fontSize.sm }}>{goal.targetBand}</Text>
          </View>
          <View style={styles.goalRow}>
            <Text style={{ color: c.mutedForeground, fontSize: fontSize.sm }}>Hạn</Text>
            <Text style={{ color: c.foreground, fontWeight: "600", fontSize: fontSize.sm }}>
              {new Date(goal.deadline).toLocaleDateString("vi-VN")}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
    </ScreenWrapper>
  );
}

function SkillBar({
  skill,
  label,
  icon,
  score,
  pct,
  trendText,
  trendColor,
  colors: c,
  onPress,
}: {
  skill: Skill;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  score: number;
  pct: number;
  trendText: string;
  trendColor: string;
  colors: ReturnType<typeof useThemeColors>;
  onPress: () => void;
}) {
  const skillColor = useSkillColor(skill);
  return (
    <TouchableOpacity style={[styles.skillCard, { backgroundColor: c.card, borderColor: c.border }]} onPress={onPress}>
      <View style={styles.skillTop}>
        <View style={[styles.skillIconWrap, { backgroundColor: skillColor + "20" }]}>
          <Ionicons name={icon} size={18} color={skillColor} />
        </View>
        <Text style={[styles.skillLabel, { color: c.foreground }]}>{label}</Text>
        <Text style={{ color: trendColor, fontSize: fontSize.xs }}>{trendText}</Text>
        <Text style={[styles.skillScore, { color: c.foreground }]}>{score.toFixed(1)}</Text>
      </View>
      <View style={[styles.barBg, { backgroundColor: c.muted }]}>
        <View style={[styles.barFill, { backgroundColor: skillColor, width: `${pct}%` }]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: spacing["3xl"], gap: spacing.md },
  title: { fontSize: fontSize["2xl"], fontWeight: "700" },
  subtitle: { fontSize: fontSize.sm, marginBottom: spacing.sm },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing["2xl"] },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: "600" },
  emptySub: { fontSize: fontSize.sm, marginTop: spacing.sm },
  skillCard: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.base, gap: spacing.sm, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  skillTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  skillIconWrap: { width: 32, height: 32, borderRadius: radius.sm, justifyContent: "center", alignItems: "center" },
  skillLabel: { flex: 1, fontWeight: "600", fontSize: fontSize.sm },
  skillScore: { fontWeight: "700", fontSize: fontSize.sm },
  barBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3 },
  etaCard: { borderRadius: radius.lg, padding: spacing.base, gap: spacing.sm },
  etaHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  etaTitle: { fontWeight: "600", fontSize: fontSize.sm },
  etaValue: { fontSize: fontSize["2xl"], fontWeight: "700" },
  goalCard: { borderRadius: radius.lg, padding: spacing.base, gap: spacing.sm },
  goalRow: { flexDirection: "row", justifyContent: "space-between" },
});
