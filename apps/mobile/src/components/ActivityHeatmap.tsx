import { StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";
import { depthNeutral } from "@/theme/depth";
import { activityHeatmapQuery } from "@/features/dashboard/queries";

const DAYS = 90;

export function ActivityHeatmap() {
  const c = useThemeColors();
  const { data: res } = useQuery(activityHeatmapQuery);
  const activityDays = res?.data ?? [];

  // Build lookup: date → minutes
  const lookup: Record<string, number> = {};
  for (const d of activityDays) lookup[d.date] = d.minutes;

  const cells: { date: string; count: number }[] = [];
  const today = new Date();
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    cells.push({ date: key, count: lookup[key] ?? 0 });
  }

  function cellColor(count: number): string {
    if (count === 0) return c.background;
    if (count <= 30) return c.primary + "30";
    if (count <= 60) return c.primary + "60";
    if (count <= 90) return c.primary + "90";
    return c.primary;
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.foreground }]}>Hoạt động 90 ngày</Text>
      </View>
      <View style={styles.grid}>
        {cells.map((cell) => (
          <View key={cell.date} style={[styles.cell, { backgroundColor: cellColor(cell.count) }]} />
        ))}
      </View>
      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: c.subtle }]}>Ít</Text>
        {[0, 30, 60, 90, 120].map((n) => (
          <View key={n} style={[styles.legendCell, { backgroundColor: cellColor(n) }]} />
        ))}
        <Text style={[styles.legendText, { color: c.subtle }]}>Nhiều</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { ...depthNeutral, borderRadius: radius.card, padding: spacing.lg, gap: spacing.sm, backgroundColor: "#FFF" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: fontSize.base, fontFamily: fontFamily.semiBold },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 3 },
  cell: { width: 10, height: 10, borderRadius: 2 },
  legend: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 3, marginTop: spacing.xs },
  legendCell: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontSize: 10 },
});
