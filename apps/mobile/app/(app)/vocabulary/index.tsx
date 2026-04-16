import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SegmentedTabs } from "@/components/SegmentedTabs";
import { HapticTouchable } from "@/components/HapticTouchable";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

// ─── VSTEP types ──────────────────────────────────────────────────

type VstepLevel = "B1" | "B2" | "C1";
type VstepTask = "WT1" | "WT2" | "SP1" | "SP2" | "SP3" | "READ";

const LEVEL_LABELS: Record<VstepLevel, string> = { B1: "Nền tảng B1", B2: "Nâng cao B2", C1: "Tinh chỉnh C1" };
const TASK_LABELS: Record<VstepTask, string> = { WT1: "Writing Task 1", WT2: "Writing Task 2", SP1: "Speaking Part 1", SP2: "Speaking Part 2", SP3: "Speaking Part 3", READ: "Reading" };

// ─── Mock topics (aligned with frontend-v2 commit 1e120e7) ───────

interface VocabTopicMock {
  id: string;
  name: string;
  description: string;
  level: VstepLevel;
  tasks: VstepTask[];
  wordCount: number;
  dueCount: number;
  masteredCount: number;
}

const MOCK_TOPICS: VocabTopicMock[] = [
  { id: "family-relationships", name: "Gia đình & Mối quan hệ", description: "Từ vựng về thành viên gia đình và các mối quan hệ thường ngày.", level: "B1", tasks: ["SP1", "WT1"], wordCount: 10, dueCount: 10, masteredCount: 0 },
  { id: "daily-life", name: "Sinh hoạt hằng ngày", description: "Các hoạt động và thói quen trong ngày.", level: "B1", tasks: ["SP1", "WT1"], wordCount: 10, dueCount: 10, masteredCount: 0 },
  { id: "work-career", name: "Công việc & Sự nghiệp", description: "Thuật ngữ cơ bản về công việc, nghề nghiệp và môi trường văn phòng.", level: "B2", tasks: ["WT2", "SP2", "READ"], wordCount: 10, dueCount: 10, masteredCount: 0 },
  { id: "health-fitness", name: "Sức khỏe & Thể chất", description: "Từ vựng về rèn luyện sức khỏe, dinh dưỡng và lối sống.", level: "B2", tasks: ["SP2", "READ"], wordCount: 10, dueCount: 10, masteredCount: 0 },
  { id: "environment-climate", name: "Môi trường & Khí hậu", description: "Từ vựng học thuật về môi trường, biến đổi khí hậu và phát triển bền vững.", level: "C1", tasks: ["WT2", "SP3", "READ"], wordCount: 10, dueCount: 10, masteredCount: 0 },
  { id: "education-academic", name: "Giáo dục & Học thuật", description: "Từ vựng học thuật dùng trong bài thi, báo cáo và luận văn.", level: "C1", tasks: ["WT2", "SP3", "READ"], wordCount: 10, dueCount: 10, masteredCount: 0 },
];

// ─── Screen ───────────────────────────────────────────────────────

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

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <ScreenHeader title="Luyện từ vựng" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.desc, { color: c.mutedForeground }]}>
          Học từ theo chủ đề với hệ thống lặp lại cách quãng (SRS) và bài tập vận dụng gắn với VSTEP.
        </Text>

        <SegmentedTabs tabs={VIEWS} activeKey={view} onTabChange={(k) => setView(k as ViewMode)} />

        {view === "level" && <LevelView onPress={(id) => router.push(`/(app)/vocabulary/${id}`)} />}
        {view === "task" && <TaskView onPress={(id) => router.push(`/(app)/vocabulary/${id}`)} />}
        {view === "all" && <AllView onPress={(id) => router.push(`/(app)/vocabulary/${id}`)} />}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Views ────────────────────────────────────────────────────────

function LevelView({ onPress }: { onPress: (id: string) => void }) {
  const c = useThemeColors();
  const levels: VstepLevel[] = ["B1", "B2", "C1"];
  return (
    <View style={styles.sections}>
      {levels.map((level) => {
        const topics = MOCK_TOPICS.filter((t) => t.level === level);
        if (topics.length === 0) return null;
        return (
          <View key={level}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: c.foreground }]}>{LEVEL_LABELS[level]}</Text>
              <Text style={[styles.sectionCount, { color: c.mutedForeground }]}>{topics.length} chủ đề</Text>
            </View>
            <View style={styles.grid}>
              {topics.map((t) => <TopicCard key={t.id} topic={t} onPress={() => onPress(t.id)} />)}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function TaskView({ onPress }: { onPress: (id: string) => void }) {
  const c = useThemeColors();
  const tasks: VstepTask[] = ["WT1", "WT2", "SP1", "SP2", "SP3", "READ"];
  return (
    <View style={styles.sections}>
      {tasks.map((task) => {
        const topics = MOCK_TOPICS.filter((t) => t.tasks.includes(task));
        if (topics.length === 0) return null;
        return (
          <View key={task}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: c.foreground }]}>{TASK_LABELS[task]}</Text>
              <Text style={[styles.sectionCount, { color: c.mutedForeground }]}>{topics.length} chủ đề</Text>
            </View>
            <View style={styles.grid}>
              {topics.map((t) => <TopicCard key={t.id} topic={t} onPress={() => onPress(t.id)} />)}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function AllView({ onPress }: { onPress: (id: string) => void }) {
  return (
    <View style={[styles.sections, { marginTop: spacing.xl }]}>
      <View style={styles.grid}>
        {MOCK_TOPICS.map((t) => <TopicCard key={t.id} topic={t} onPress={() => onPress(t.id)} />)}
      </View>
    </View>
  );
}

// ─── Topic Card ───────────────────────────────────────────────────

function TopicCard({ topic, onPress }: { topic: VocabTopicMock; onPress: () => void }) {
  const c = useThemeColors();
  const pct = Math.round((topic.masteredCount / topic.wordCount) * 100);

  return (
    <HapticTouchable style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardTop}>
        <Ionicons name="book-outline" size={20} color={c.primary} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardName, { color: c.foreground }]} numberOfLines={1}>{topic.name}</Text>
          <Text style={[styles.cardWordCount, { color: c.mutedForeground }]}>{topic.wordCount} từ</Text>
        </View>
        {topic.dueCount > 0 && (
          <View style={[styles.dueBadge, { backgroundColor: c.primary + "15" }]}>
            <Text style={[styles.dueText, { color: c.primary }]}>{topic.dueCount} đến hạn</Text>
          </View>
        )}
      </View>
      <Text style={[styles.cardDesc, { color: c.mutedForeground }]} numberOfLines={2}>{topic.description}</Text>
      <View style={styles.cardBottom}>
        <Text style={[styles.masteredText, { color: c.mutedForeground }]}>{topic.masteredCount}/{topic.wordCount} đã thuộc</Text>
        <Text style={[styles.masteredPct, { color: pct > 0 ? c.primary : c.mutedForeground }]}>{pct}%</Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: c.muted }]}>
        <View style={[styles.progressFill, { backgroundColor: c.primary, width: `${pct}%` }]} />
      </View>
    </HapticTouchable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: spacing.xl, paddingBottom: spacing["3xl"] },
  desc: { fontSize: fontSize.sm, lineHeight: 20, marginBottom: spacing.base },
  sections: { gap: spacing["2xl"], marginTop: spacing.xl },
  sectionHeader: { flexDirection: "row", alignItems: "baseline", gap: spacing.sm, marginBottom: spacing.base },
  sectionTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.bold },
  sectionCount: { fontSize: fontSize.xs },
  grid: { gap: spacing.sm },
  // Card
  card: { borderWidth: 1, borderRadius: radius["2xl"], padding: spacing.lg, gap: spacing.sm },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  cardName: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
  cardWordCount: { fontSize: fontSize.xs },
  dueBadge: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  dueText: { fontSize: 11, fontFamily: fontFamily.semiBold },
  cardDesc: { fontSize: fontSize.xs, lineHeight: 18 },
  cardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  masteredText: { fontSize: fontSize.xs },
  masteredPct: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },
  progressTrack: { height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: 4, borderRadius: 2 },
});
