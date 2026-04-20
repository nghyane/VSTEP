import { StyleSheet, Text, View } from "react-native";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";
import { depthNeutral } from "@/theme/depth";
import { MOCK_ACTIVITY } from "@/lib/mock";

const DAYS = 90;
const COLS = 13; // ~13 weeks

export function ActivityHeatmap() {
  const c = useThemeColors();
  const data = MOCK_ACTIVITY.activityByDay ?? {};

  const cells: { date: string; count: number }[] = [];
  const today = new Date();
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    cells.push({ date: key, count: data[key] ?? 0 });
  }

  function cellColor(count: number): string {
    if (count === 0) return c.muted;
    if (count <= 2) return c.primary + "30";
    if (count <= 5) return c.primary + "60";
    if (count <= 8) return c.primary + "90";
    return c.primary;
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.foreground }]}>Hoạt động 90 ngày</Text>
        <Text style={[styles.streak, { color: c.primary }]}>🔥 {MOCK_ACTIVITY.streak} ngày liên tiếp</Text>
      </View>
      <View style={styles.grid}>
        {cells.map((cell) => (
          <View key={cell.date} style={[styles.cell, { backgroundColor: cellColor(cell.count) }]} />
        ))}
      </View>
      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: c.subtle }]}>Ít</Text>
        {[0, 2, 5, 8, 12].map((n) => (
          <View key={n} style={[styles.legendCell, { backgroundColor: cellColor(n) }]} />
        ))}
        <Text style={[styles.legendText, { color: c.subtle }]}>Nhiều</Text>
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
