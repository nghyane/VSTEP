import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SegmentedTabs } from "@/components/SegmentedTabs";
import { HapticTouchable } from "@/components/HapticTouchable";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";
import { depthNeutral } from "@/theme/depth";
import { useGrammarPoints } from "@/features/grammar/queries";
import { MascotEmpty } from "@/components/MascotStates";
import type { GrammarPoint } from "@/features/grammar/types";

const LEVEL_LABELS: Record<string, string> = { B1: "Nền tảng B1", B2: "Nâng cao B2", C1: "Tinh chỉnh C1" };
const TASK_LABELS: Record<string, string> = { WT1: "Writing Task 1", WT2: "Writing Task 2", SP1: "Speaking Part 1", SP2: "Speaking Part 2", SP3: "Speaking Part 3", READ: "Reading" };

type ViewMode = "level" | "task";
const VIEWS = [
  { key: "level" as ViewMode, label: "Theo trình độ" },
  { key: "task" as ViewMode, label: "Theo bài thi" },
];

export default function GrammarScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("level");
  const { data: points, isLoading } = useGrammarPoints();

  const navigate = (id: string) => router.push(`/(app)/practice/grammar-detail/${id}`);

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <ScreenHeader title="Luyện ngữ pháp" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.desc, { color: c.mutedForeground }]}>
          Học lý thuyết, luyện bài tập đa dạng, và nắm mẹo dùng ngữ pháp đúng trong từng phần thi VSTEP.
        </Text>
        <SegmentedTabs tabs={VIEWS} activeKey={view} onTabChange={(k) => setView(k as ViewMode)} />

        {isLoading && <ActivityIndicator style={{ marginTop: spacing["2xl"] }} />}

        {!isLoading && points && points.length === 0 && (
          <MascotEmpty mascot="think" title="Chưa có điểm ngữ pháp" subtitle="Nội dung đang được cập nhật" />
        )}

        {!isLoading && points && view === "level" && (
          <View style={styles.sections}>
            {["B1", "B2", "C1"].map((level) => {
              const filtered = points.filter((p) => p.levels.includes(level));
              if (!filtered.length) return null;
              return (
                <View key={level}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: c.foreground }]}>{LEVEL_LABELS[level]}</Text>
                    <Text style={[styles.sectionCount, { color: c.mutedForeground }]}>{filtered.length} điểm ngữ pháp</Text>
                  </View>
                  <View style={styles.grid}>
                    {filtered.map((p) => <PointCard key={p.id} point={p} onPress={() => navigate(p.id)} />)}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {!isLoading && points && view === "task" && (
          <View style={styles.sections}>
            {Object.keys(TASK_LABELS).map((task) => {
              const filtered = points.filter((p) => p.tasks.includes(task));
              if (!filtered.length) return null;
              return (
                <View key={task}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: c.foreground }]}>{TASK_LABELS[task]}</Text>
                    <Text style={[styles.sectionCount, { color: c.mutedForeground }]}>{filtered.length} điểm ngữ pháp</Text>
                  </View>
                  <View style={styles.grid}>
                    {filtered.map((p) => <PointCard key={p.id} point={p} onPress={() => navigate(p.id)} />)}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function PointCard({ point, onPress }: { point: GrammarPoint; onPress: () => void }) {
  const c = useThemeColors();
  return (
    <HapticTouchable style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardName, { color: c.foreground }]} numberOfLines={1}>{point.name}</Text>
          {point.vietnameseName && <Text style={[styles.cardVn, { color: c.mutedForeground }]}>{point.vietnameseName}</Text>}
        </View>
        <View style={styles.levelBadge}>
          {point.levels.slice(0, 1).map((l) => (
            <Text key={l} style={[styles.levelText, { color: c.primary }]}>{l}</Text>
          ))}
        </View>
      </View>
      {point.summary && <Text style={[styles.cardSummary, { color: c.mutedForeground }]} numberOfLines={2}>{point.summary}</Text>}
    </HapticTouchable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: spacing.xl, paddingBottom: spacing["3xl"] },
  desc: { fontSize: fontSize.sm, lineHeight: 20, marginBottom: spacing.base },
  sections: { gap: spacing["2xl"], marginTop: spacing.xl },
  sectionHeader: { flexDirection: "row", alignItems: "baseline", gap: spacing.sm, marginBottom: spacing.base },
  sectionTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.bold },
  sectionCount: { fontSize: fontSize.xs },
  grid: { gap: spacing.sm },
  card: { ...depthNeutral, borderRadius: radius["2xl"], padding: spacing.lg, gap: spacing.sm },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.sm },
  cardName: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
  cardVn: { fontSize: fontSize.xs, marginTop: 1 },
  levelBadge: { flexDirection: "row", gap: 4 },
  levelText: { fontSize: fontSize.xs, fontWeight: "700" },
  cardSummary: { fontSize: fontSize.xs, lineHeight: 18 },
});
