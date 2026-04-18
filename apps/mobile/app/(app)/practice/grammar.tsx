import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SegmentedTabs } from "@/components/SegmentedTabs";
import { HapticTouchable } from "@/components/HapticTouchable";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";
import { depthNeutral } from "@/theme/depth";

// ─── Types ────────────────────────────────────────────────────────

type VstepLevel = "B1" | "B2" | "C1";
type VstepTask = "WT1" | "WT2" | "SP1" | "SP2" | "SP3" | "READ";
type MasteryLevel = "new" | "learning" | "practicing" | "mastered";

const LEVEL_LABELS: Record<VstepLevel, string> = { B1: "Nền tảng B1", B2: "Nâng cao B2", C1: "Tinh chỉnh C1" };
const TASK_LABELS: Record<VstepTask, string> = { WT1: "Writing Task 1", WT2: "Writing Task 2", SP1: "Speaking Part 1", SP2: "Speaking Part 2", SP3: "Speaking Part 3", READ: "Reading" };

// ─── Mock data (aligned with frontend-v2 grammar) ────────────────

interface GrammarPointMock {
  id: string;
  name: string;
  vietnameseName: string;
  summary: string;
  levels: VstepLevel[];
  tasks: VstepTask[];
  exerciseCount: number;
  commonMistakeCount: number;
  mastery: MasteryLevel;
  accuracy: string;
}

const MOCK_POINTS: GrammarPointMock[] = [
  { id: "present-simple", name: "Present Simple", vietnameseName: "Thì hiện tại đơn", summary: "Diễn tả thói quen, sự thật hiển nhiên, lịch trình cố định.", levels: ["B1"], tasks: ["WT1", "SP1"], exerciseCount: 7, commonMistakeCount: 3, mastery: "learning", accuracy: "0/1 · 0%" },
  { id: "present-perfect", name: "Present Perfect", vietnameseName: "Thì hiện tại hoàn thành", summary: "Hành động xảy ra trong quá khứ nhưng còn ảnh hưởng đến hiện tại.", levels: ["B1"], tasks: ["WT1", "SP1", "READ"], exerciseCount: 8, commonMistakeCount: 2, mastery: "new", accuracy: "" },
  { id: "past-simple", name: "Past Simple", vietnameseName: "Thì quá khứ đơn", summary: "Hành động đã kết thúc hoàn toàn trong quá khứ, có thời điểm xác định.", levels: ["B1"], tasks: ["WT1", "SP1"], exerciseCount: 6, commonMistakeCount: 2, mastery: "new", accuracy: "" },
  { id: "first-conditional", name: "First Conditional", vietnameseName: "Câu điều kiện loại 1", summary: "Điều kiện có thật, có khả năng xảy ra ở hiện tại hoặc tương lai.", levels: ["B1"], tasks: ["SP2", "WT2"], exerciseCount: 5, commonMistakeCount: 1, mastery: "new", accuracy: "" },
  { id: "present-passive", name: "Passive Voice", vietnameseName: "Câu bị động", summary: "Câu bị động nhấn mạnh đối tượng chịu tác động thay vì chủ thể thực hiện.", levels: ["B1"], tasks: ["WT2", "READ"], exerciseCount: 6, commonMistakeCount: 2, mastery: "new", accuracy: "" },
  { id: "relative-clauses", name: "Relative Clauses", vietnameseName: "Mệnh đề quan hệ", summary: "Bổ nghĩa cho danh từ bằng who / which / that / whose / where.", levels: ["B1"], tasks: ["WT2", "SP2", "READ"], exerciseCount: 7, commonMistakeCount: 3, mastery: "new", accuracy: "" },
  { id: "second-conditional", name: "Second Conditional", vietnameseName: "Câu điều kiện loại 2", summary: "Điều kiện không có thật ở hiện tại hoặc giả định khó xảy ra.", levels: ["B2"], tasks: ["SP2", "SP3", "WT2"], exerciseCount: 6, commonMistakeCount: 2, mastery: "new", accuracy: "" },
  { id: "third-conditional", name: "Third Conditional", vietnameseName: "Câu điều kiện loại 3", summary: "Điều kiện không có thật trong quá khứ — tiếc nuối việc đã xảy ra.", levels: ["B2"], tasks: ["SP3", "WT2"], exerciseCount: 5, commonMistakeCount: 1, mastery: "new", accuracy: "" },
];

const MASTERY_INFO: Record<MasteryLevel, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  new: { label: "Chưa học", icon: "ellipse-outline", color: "#6B7280" },
  learning: { label: "Đang học", icon: "radio-button-on", color: "#F59E0B" },
  practicing: { label: "Đang luyện", icon: "sparkles", color: "#10B981" },
  mastered: { label: "Đã thuộc", icon: "checkmark-circle", color: "#1a6ef5" },
};

// ─── Screen ───────────────────────────────────────────────────────

type ViewMode = "level" | "task" | "errors";
const VIEWS = [
  { key: "level" as ViewMode, label: "Theo trình độ" },
  { key: "task" as ViewMode, label: "Theo bài thi" },
  { key: "errors" as ViewMode, label: "Lỗi hay gặp" },
];

export default function GrammarScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("level");

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <ScreenHeader title="Luyện ngữ pháp" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.desc, { color: c.mutedForeground }]}>
          Học lý thuyết, luyện bài tập đa dạng, và nắm mẹo dùng ngữ pháp đúng trong từng phần thi VSTEP.
        </Text>
        <SegmentedTabs tabs={VIEWS} activeKey={view} onTabChange={(k) => setView(k as ViewMode)} />

        {view === "level" && <LevelView onPress={(id) => router.push(`/(app)/practice/grammar-detail/${id}`)} />}
        {view === "task" && <TaskView onPress={(id) => router.push(`/(app)/practice/grammar-detail/${id}`)} />}
        {view === "errors" && <ErrorsView onPress={(id) => router.push(`/(app)/practice/grammar-detail/${id}`)} />}

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
        const points = MOCK_POINTS.filter((p) => p.levels[0] === level);
        if (points.length === 0) return null;
        return (
          <View key={level}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: c.foreground }]}>{LEVEL_LABELS[level]}</Text>
              <Text style={[styles.sectionCount, { color: c.mutedForeground }]}>{points.length} điểm ngữ pháp</Text>
            </View>
            <PointGrid points={points} onPress={onPress} />
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
        const points = MOCK_POINTS.filter((p) => p.tasks.includes(task));
        if (points.length === 0) return null;
        return (
          <View key={task}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: c.foreground }]}>{TASK_LABELS[task]}</Text>
              <Text style={[styles.sectionCount, { color: c.mutedForeground }]}>{points.length} điểm ngữ pháp</Text>
            </View>
            <PointGrid points={points} onPress={onPress} />
          </View>
        );
      })}
    </View>
  );
}

function ErrorsView({ onPress }: { onPress: (id: string) => void }) {
  const points = MOCK_POINTS.filter((p) => p.commonMistakeCount > 0);
  return (
    <View style={[styles.sections, { marginTop: spacing.xl }]}>
      <PointGrid points={points} onPress={onPress} showMistakes />
    </View>
  );
}

// ─── Point Grid + Card ────────────────────────────────────────────

function PointGrid({ points, onPress, showMistakes }: { points: GrammarPointMock[]; onPress: (id: string) => void; showMistakes?: boolean }) {
  return (
    <View style={styles.grid}>
      {points.map((p) => <PointCard key={p.id} point={p} onPress={() => onPress(p.id)} showMistakes={showMistakes} />)}
    </View>
  );
}

function PointCard({ point, onPress, showMistakes }: { point: GrammarPointMock; onPress: () => void; showMistakes?: boolean }) {
  const c = useThemeColors();
  const info = MASTERY_INFO[point.mastery];

  return (
    <HapticTouchable style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardName, { color: c.foreground }]} numberOfLines={1}>{point.name}</Text>
          <Text style={[styles.cardVn, { color: c.mutedForeground }]}>{point.vietnameseName}</Text>
        </View>
        <View style={styles.masteryBadge}>
          <Ionicons name={info.icon} size={14} color={info.color} />
          <Text style={[styles.masteryLabel, { color: info.color }]}>{info.label}</Text>
        </View>
      </View>
      <Text style={[styles.cardSummary, { color: c.mutedForeground }]} numberOfLines={2}>{point.summary}</Text>
      <View style={styles.cardBottom}>
        <Text style={[styles.cardMeta, { color: c.mutedForeground }]}>
          {showMistakes ? `${point.commonMistakeCount} lỗi thường gặp` : `${point.exerciseCount} bài tập`}
        </Text>
        {point.accuracy ? <Text style={[styles.cardMeta, { color: c.mutedForeground }]}>{point.accuracy}</Text> : null}
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
  card: { ...depthNeutral, borderRadius: radius["2xl"], padding: spacing.lg, gap: spacing.sm },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.sm },
  cardName: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
  cardVn: { fontSize: fontSize.xs, marginTop: 1 },
  masteryBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  masteryLabel: { fontSize: 11, fontFamily: fontFamily.medium },
  cardSummary: { fontSize: fontSize.xs, lineHeight: 18 },
  cardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
  cardMeta: { fontSize: fontSize.xs },
});
