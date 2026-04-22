import { StyleSheet, Text, View } from "react-native";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";
import { depthNeutral } from "@/theme/depth";
import { useActivityHeatmap, useStreak } from "@/hooks/use-progress";

const DAYS = 90;

export function ActivityHeatmap() {
  const c = useThemeColors();
  const { data: heatmap } = useActivityHeatmap();
  const { data: streakData } = useStreak();

  // Convert array [{date, minutes}] → Record<string, number>
  const activityByDay: Record<string, number> = {};
  if (heatmap) {
    for (const entry of heatmap) {
      activityByDay[entry.date] = entry.minutes;
    }
  }

  const streak = streakData?.currentStreak ?? 0;

  const cells: { date: string; count: number }[] = [];
  const today = new Date();
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    cells.push({ date: key, count: activityByDay[key] ?? 0 });
  }

  function cellColor(count: number): string {
    if (count === 0) return c.muted;
    if (count <= 5) return c.primary + "30";
    if (count <= 15) return c.primary + "60";
    if (count <= 30) return c.primary + "90";
    return c.primary;
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.foreground }]}>Hoạt động 90 ngày</Text>
        <Text style={[styles.streak, { color: c.primary }]}>🔥 {streak} ngày liên tiếp</Text>
      </View>
      <View style={styles.grid}>
        {cells.map((cell) => (
          <View key={cell.date} style={[styles.cell, { backgroundColor: cellColor(cell.count) }]} />
        ))}
      </View>
      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: c.mutedForeground }]}>Ít</Text>
        {[0, 5, 15, 30, 60].map((n) => (
          <View key={n} style={[styles.legendCell, { backgroundColor: cellColor(n) }]} />
        ))}
        <Text style={[styles.legendText, { color: c.mutedForeground }]}>Nhiều</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { ...depthNeutral, borderRadius: radius["2xl"], padding: spacing.lg, gap: spacing.sm, backgroundColor: "#FFF" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: fontSize.base, fontFamily: fontFamily.semiBold },
  streak: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 3 },
  cell: { width: 10, height: 10, borderRadius: 2 },
  legend: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 3, marginTop: spacing.xs },
  legendCell: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontSize: 10 },
});
