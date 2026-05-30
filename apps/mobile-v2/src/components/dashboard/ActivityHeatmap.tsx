import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { DepthCard } from "@/components/DepthCard";
import { useActivityHeatmap } from "@/hooks/use-progress";
import { heatmapLevels } from "@/lib/vstep";
import { useThemeColors, spacing, fontSize, fontFamily, radius } from "@/theme";
import type { SkillActivityDay } from "@/types/api";

const WEEKS = 12;
const DAYS = 7;
const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const CELL_SIZE = 12;
const GAP = 2;

type HeatmapCell = { level: number; future: boolean };

function levelColor(level: number, theme: { border: string; primary: string }): string {
  const colors = [theme.border, `${theme.primary}40`, `${theme.primary}80`, `${theme.primary}BF`, theme.primary];
  return colors[level] ?? theme.border;
}

function totalActivity(day?: SkillActivityDay): number {
  if (!day) return 0;
  return day.listening + day.reading + day.writing + day.speaking + day.vocab + day.exam;
}

function toLevel(total: number): number {
  if (total < heatmapLevels[0]) return 0;
  if (total >= heatmapLevels[3]) return 4;
  if (total >= heatmapLevels[2]) return 3;
  if (total >= heatmapLevels[1]) return 2;
  return 1;
}

function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildGrid(data: SkillActivityDay[]): HeatmapCell[][] {
  const map = new Map(data.map((d) => [d.date.slice(0, 10), d]));
  const today = new Date();
  const todayKey = isoDate(today);
  const end = new Date(today);
  const endDow = (end.getDay() + 6) % 7;
  end.setDate(end.getDate() + (DAYS - 1 - endDow));

  const start = new Date(end);
  start.setDate(start.getDate() - (WEEKS * DAYS - 1));

  const weeks: HeatmapCell[][] = [];
  const cursor = new Date(start);
  for (let w = 0; w < WEEKS; w++) {
    const week: HeatmapCell[] = [];
    for (let d = 0; d < DAYS; d++) {
      const key = isoDate(cursor);
      week.push({
        level: toLevel(totalActivity(map.get(key))),
        future: key > todayKey,
      });
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
    () => (data ? data.filter((d) => totalActivity(d) > 0).length : 0),
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
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.legendCell, { backgroundColor: levelColor(i, c) }]} />
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
              {week.map((cell, di) => (
                <View
                  key={di}
                  style={[
                    styles.cell,
                    {
                      backgroundColor: cell.future ? "transparent" : levelColor(cell.level, c),
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
