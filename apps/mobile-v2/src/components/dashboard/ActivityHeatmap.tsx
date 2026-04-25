import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { DepthCard } from "@/components/DepthCard";
import { useActivityHeatmap } from "@/hooks/use-progress";
import { useThemeColors, spacing, fontSize, fontFamily, radius } from "@/theme";
import type { HeatmapEntry } from "@/types/api";

const WEEKS = 12;
const DAYS = 7;
const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const CELL_SIZE = 12;
const GAP = 2;

const LEVEL_COLORS = ["#E5E5E5", "#58CC0240", "#58CC0280", "#58CC02BF", "#58CC02"];

function toLevel(minutes: number): number {
  if (minutes <= 0) return 0;
  if (minutes >= 120) return 4;
  if (minutes >= 60) return 3;
  if (minutes >= 30) return 2;
  if (minutes >= 10) return 1;
  return 0;
}

function buildGrid(data: HeatmapEntry[]): number[][] {
  const map = new Map(data.map((d) => [d.date.slice(0, 10), d.minutes]));
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - WEEKS * DAYS);

  const dow = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - dow);

  const weeks: number[][] = [];
  const cursor = new Date(start);
  for (let w = 0; w < WEEKS; w++) {
    const week: number[] = [];
    for (let d = 0; d < DAYS; d++) {
      const key = cursor.toISOString().slice(0, 10);
      week.push(toLevel(map.get(key) ?? 0));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export function ActivityHeatmap() {
  const c = useThemeColors();
  const { data, isLoading } = useActivityHeatmap();

  const grid = useMemo(() => (data ? buildGrid(data) : []), [data]);
  const totalActiveDays = useMemo(
    () => (data ? data.filter((d) => d.minutes > 0).length : 0),
    [data],
  );

  if (isLoading || !data || grid.length === 0) return null;

  return (
    <DepthCard style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: c.foreground }]}>Hoạt động luyện tập</Text>
          <Text style={[styles.subtitle, { color: c.subtle }]}>
            {totalActiveDays} ngày có luyện tập trong {WEEKS} tuần qua
          </Text>
        </View>
        <View style={styles.legend}>
          <Text style={[styles.legendText, { color: c.subtle }]}>Ít</Text>
          {LEVEL_COLORS.map((color, i) => (
            <View key={i} style={[styles.legendCell, { backgroundColor: color }]} />
          ))}
          <Text style={[styles.legendText, { color: c.subtle }]}>Nhiều</Text>
        </View>
      </View>

      <View style={styles.gridContainer}>
        <View style={styles.dayLabels}>
          {DAY_LABELS.map((label) => (
            <Text key={label} style={[styles.dayLabel, { color: c.subtle }]}>
              {label}
            </Text>
          ))}
        </View>

        <View style={styles.weeks}>
          {grid.map((week, wi) => (
            <View key={wi} style={styles.weekColumn}>
              {week.map((level, di) => (
                <View
                  key={di}
                  style={[
                    styles.cell,
                    {
                      backgroundColor: LEVEL_COLORS[level],
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      borderRadius: radius.sm,
                    },
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
    </DepthCard>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.extraBold,
  },
  subtitle: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  legendText: {
    fontSize: 10,
    fontFamily: fontFamily.semiBold,
  },
  legendCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  gridContainer: {
    flexDirection: "row",
    gap: 4,
  },
  dayLabels: {
    justifyContent: "space-between",
    paddingTop: 2,
  },
  dayLabel: {
    fontSize: 9,
    fontFamily: fontFamily.semiBold,
    lineHeight: CELL_SIZE + GAP,
    height: CELL_SIZE,
  },
  weeks: {
    flexDirection: "row",
    gap: GAP,
    flex: 1,
  },
  weekColumn: {
    gap: GAP,
    flex: 1,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
  },
});
