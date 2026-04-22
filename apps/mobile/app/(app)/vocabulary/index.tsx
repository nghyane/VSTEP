import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SegmentedTabs } from "@/components/SegmentedTabs";
import { HapticTouchable } from "@/components/HapticTouchable";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";
import { depthNeutral } from "@/theme/depth";
import { useVocabTopics } from "@/features/vocab/queries";
import { MascotEmpty } from "@/components/MascotStates";
import type { VocabTopic } from "@/features/vocab/types";

const LEVEL_LABELS: Record<string, string> = { B1: "Nền tảng B1", B2: "Nâng cao B2", C1: "Tinh chỉnh C1" };
const TASK_LABELS: Record<string, string> = { WT1: "Writing Task 1", WT2: "Writing Task 2", SP1: "Speaking Part 1", SP2: "Speaking Part 2", SP3: "Speaking Part 3", READ: "Reading" };

type ViewMode = "level" | "task" | "all";
const VIEWS = [
  { key: "level" as ViewMode, label: "Theo trình độ" },
  { key: "task" as ViewMode, label: "Theo bài thi" },
  { key: "all" as ViewMode, label: "Tất cả" },
];

export default function VocabularyScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("level");
  const { data: topics, isLoading } = useVocabTopics();

  const navigate = (id: string) => router.push(`/(app)/vocabulary/${id}`);

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <ScreenHeader title="Luyện từ vựng" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.desc, { color: c.mutedForeground }]}>
          Học từ theo chủ đề với hệ thống lặp lại cách quãng (SRS) và bài tập vận dụng gắn với VSTEP.
        </Text>
        <SegmentedTabs tabs={VIEWS} activeKey={view} onTabChange={(k) => setView(k as ViewMode)} />

        {isLoading && <ActivityIndicator style={{ marginTop: spacing["2xl"] }} />}

        {!isLoading && topics && topics.length === 0 && (
          <MascotEmpty mascot="vocabulary" title="Chưa có chủ đề từ vựng" subtitle="Nội dung đang được cập nhật" />
        )}

        {!isLoading && topics && view === "level" && (
          <View style={styles.sections}>
            {["B1", "B2", "C1"].map((level) => {
              const filtered = topics.filter((t) => t.level === level);
              if (!filtered.length) return null;
              return (
                <View key={level}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: c.foreground }]}>{LEVEL_LABELS[level]}</Text>
                    <Text style={[styles.sectionCount, { color: c.mutedForeground }]}>{filtered.length} chủ đề</Text>
                  </View>
                  <View style={styles.grid}>
                    {filtered.map((t) => <TopicCard key={t.id} topic={t} onPress={() => navigate(t.id)} />)}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {!isLoading && topics && view === "task" && (
          <View style={styles.sections}>
            {Object.keys(TASK_LABELS).map((task) => {
              const filtered = topics.filter((t) => t.tasks.includes(task));
              if (!filtered.length) return null;
              return (
                <View key={task}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: c.foreground }]}>{TASK_LABELS[task]}</Text>
                    <Text style={[styles.sectionCount, { color: c.mutedForeground }]}>{filtered.length} chủ đề</Text>
                  </View>
                  <View style={styles.grid}>
                    {filtered.map((t) => <TopicCard key={t.id} topic={t} onPress={() => navigate(t.id)} />)}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {!isLoading && topics && view === "all" && (
          <View style={[styles.sections, { marginTop: spacing.xl }]}>
            <View style={styles.grid}>
              {topics.map((t) => <TopicCard key={t.id} topic={t} onPress={() => navigate(t.id)} />)}
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function TopicCard({ topic, onPress }: { topic: VocabTopic; onPress: () => void }) {
  const c = useThemeColors();
  return (
    <HapticTouchable style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardTop}>
        <Text style={[styles.cardName, { color: c.foreground }]} numberOfLines={1}>{topic.name}</Text>
        <Text style={[styles.levelText, { color: c.primary }]}>{topic.level}</Text>
      </View>
      {topic.description && <Text style={[styles.cardDesc, { color: c.mutedForeground }]} numberOfLines={2}>{topic.description}</Text>}
      {topic.wordCount != null && (
        <Text style={[styles.cardMeta, { color: c.mutedForeground }]}>{topic.wordCount} từ</Text>
      )}
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
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardName: { fontSize: fontSize.base, fontFamily: fontFamily.bold, flex: 1 },
  levelText: { fontSize: fontSize.xs, fontWeight: "700" },
  cardDesc: { fontSize: fontSize.xs, lineHeight: 18 },
  cardMeta: { fontSize: fontSize.xs },
});
