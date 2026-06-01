import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import { HapticTouchable } from "@/components/HapticTouchable";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";
import { depthNeutral } from "@/theme/depth";
import { LinearGradient } from "expo-linear-gradient";

// ─── Types ────────────────────────────────────────────────────────

interface QuestionItem { no: number; answered: boolean; correct: boolean; userLetter: string; correctLetter: string; }
interface QuestionType { label: string; total: number; correct: number; wrong: number; accuracyPct: number; items: QuestionItem[]; }
interface ExamResult { examTitle: string; userName: string; score: number; totalCorrect: number; totalAnswered: number; totalQuestions: number; questionTypes: QuestionType[]; }

// ─── Mock grading ─────────────────────────────────────────────────

function mockCorrectLetter(sectionId: string, no: number): string {
  let seed = 0;
  for (let i = 0; i < sectionId.length; i++) seed = (seed * 31 + sectionId.charCodeAt(i)) >>> 0;
  return ["A", "B", "C", "D"][((seed ^ (no * 2654435761)) >>> 0) % 4];
}

function buildMockResult(examId: string): ExamResult {
  const sections = [
    { id: "listening", label: "Nghe", count: 3 },
    { id: "reading", label: "Đọc", count: 3 },
    { id: "writing", label: "Viết", count: 1 },
    { id: "speaking", label: "Nói", count: 2 },
  ];
  const questionTypes: QuestionType[] = [];
  let totalCorrect = 0, totalAnswered = 0, totalQuestions = 0;

  for (const sec of sections) {
    const items: QuestionItem[] = [];
    let correct = 0;
    for (let no = 1; no <= sec.count; no++) {
      const correctLetter = mockCorrectLetter(sec.id, no);
      // Simulate: ~60% answered, ~50% of answered correct
      const answered = Math.random() > 0.4;
      const userLetter = answered ? ["A", "B", "C", "D"][Math.floor(Math.random() * 4)] : "—";
      const isCorrect = answered && userLetter === correctLetter;
      if (isCorrect) correct++;
      items.push({ no, answered, correct: isCorrect, userLetter, correctLetter: sec.id === "writing" || sec.id === "speaking" ? "" : correctLetter });
    }
    const wrong = sec.count - correct;
    questionTypes.push({ label: sec.label, total: sec.count, correct, wrong, accuracyPct: sec.count > 0 ? Math.round((correct / sec.count) * 100) : 0, items });
    totalCorrect += correct;
    totalAnswered += items.filter((i) => i.answered).length;
    totalQuestions += sec.count;
  }

  const score = parseFloat(((totalCorrect / Math.max(totalQuestions, 1)) * 10).toFixed(1));
  return { examTitle: `Đề thi VSTEP #${examId}`, userName: "Nguyễn Phát", score, totalCorrect, totalAnswered, totalQuestions, questionTypes };
}

// ─── Screen ───────────────────────────────────────────────────────

type Tab = "summary" | "detail";

export default function ExamResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("summary");

  const result = buildMockResult(id ?? "1");

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      {/* Gradient header */}
      <LinearGradient colors={["#0029FF", "#1479F3", "#47B7F7"]} style={[styles.gradientHeader, { paddingTop: insets.top + spacing.base }]}>
        <Text style={styles.headerTitle}>Kết quả</Text>
        <HapticTouchable style={styles.doneBtn} onPress={() => router.replace("/(app)/(tabs)/exams")}>
          <Ionicons name="checkmark-circle" size={16} color="#fff" />
          <Text style={styles.doneBtnText}>Hoàn thành</Text>
        </HapticTouchable>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Score card */}
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.congrats, { color: c.subtle }]}>Chúc mừng!</Text>
          <Text style={[styles.userName, { color: c.foreground }]}>{result.userName}</Text>
          <Text style={[styles.examName, { color: c.subtle }]}>đã hoàn thành {result.examTitle}</Text>

          {/* Score circle */}
          <ScoreCircle score={result.score} />

          {/* Score pills */}
          <View style={styles.pillRow}>
            <ScorePill value={result.totalCorrect} total={result.totalQuestions} label="Câu đúng" color={c.success} />
            <ScorePill value={result.totalAnswered - result.totalCorrect} total={result.totalQuestions} label="Câu sai" color={c.destructive} />
          </View>
        </View>

        {/* Tab switcher */}
        <View style={[styles.tabRow, { backgroundColor: c.background }]}>
          <HapticTouchable style={[styles.tabBtn, tab === "summary" && { backgroundColor: c.surface }]} onPress={() => setTab("summary")}>
            <Text style={[styles.tabText, { color: tab === "summary" ? c.foreground : c.subtle }]}>Performance</Text>
          </HapticTouchable>
          <HapticTouchable style={[styles.tabBtn, tab === "detail" && { backgroundColor: c.surface }]} onPress={() => setTab("detail")}>
            <Text style={[styles.tabText, { color: tab === "detail" ? c.foreground : c.subtle }]}>Chi tiết</Text>
          </HapticTouchable>
        </View>

        {tab === "summary" ? (
          <PerformanceTable types={result.questionTypes} />
        ) : (
          <DetailView types={result.questionTypes} />
        )}

        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Score circle ─────────────────────────────────────────────────

const CIRCLE_SIZE = 100;
const STROKE = 8;
const R = (CIRCLE_SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

function ScoreCircle({ score }: { score: number }) {
  const c = useThemeColors();
  const pct = score / 10;
  const offset = CIRC - pct * CIRC;
  const color = pct >= 0.7 ? c.success : pct >= 0.4 ? c.warning : c.destructive;

  return (
    <View style={styles.circleWrap}>
      <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
        <Circle cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={R} stroke={c.border} strokeWidth={STROKE} fill="none" />
        <Circle cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={R} stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={offset} rotation={-90} origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`} />
      </Svg>
      <View style={styles.circleInner}>
        <Text style={[styles.scoreNum, { color }]}>{score.toFixed(1)}</Text>
        <Text style={[styles.scoreMax, { color: c.subtle }]}>/10</Text>
      </View>
    </View>
  );
}

// ─── Score pill ───────────────────────────────────────────────────

function ScorePill({ value, total, label, color }: { value: number; total: number; label: string; color: string }) {
  const c = useThemeColors();
  return (
    <View style={styles.pill}>
      <View style={[styles.pillBox, { borderColor: color + "40", backgroundColor: color + "0D" }]}>
        <Text style={[styles.pillValue, { color }]}>{value}/{total}</Text>
      </View>
      <Text style={[styles.pillLabel, { color: c.subtle }]}>{label}</Text>
    </View>
  );
}

// ─── Performance table ────────────────────────────────────────────

function PerformanceTable({ types }: { types: QuestionType[] }) {
  const c = useThemeColors();
  return (
    <View style={[styles.table, { borderColor: c.border }]}>
      <View style={[styles.tableHeader, { backgroundColor: c.background }]}>
        <Text style={[styles.th, styles.thLabel, { color: c.subtle }]}>Loại</Text>
        <Text style={[styles.th, styles.thNum, { color: c.subtle }]}>Tổng</Text>
        <Text style={[styles.th, styles.thNum, { color: c.subtle }]}>Đúng</Text>
        <Text style={[styles.th, styles.thNum, { color: c.subtle }]}>Sai</Text>
        <Text style={[styles.th, styles.thNum, { color: c.subtle }]}>Tỷ lệ</Text>
      </View>
      {types.map((qt, idx) => (
        <View key={qt.label} style={[styles.tableRow, idx % 2 === 0 ? { backgroundColor: c.surface } : { backgroundColor: c.muted + "30" }, idx < types.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border + "66" }]}>
          <Text style={[styles.td, styles.thLabel, { color: c.foreground, fontFamily: fontFamily.medium }]}>{qt.label}</Text>
          <Text style={[styles.td, styles.thNum, { color: c.subtle }]}>{qt.total}</Text>
          <Text style={[styles.td, styles.thNum, { color: qt.correct > 0 ? c.success : c.subtle, fontFamily: fontFamily.semiBold }]}>{qt.correct}</Text>
          <Text style={[styles.td, styles.thNum, { color: qt.wrong > 0 ? c.destructive : c.subtle }]}>{qt.wrong}</Text>
          <AccuracyBadge pct={qt.accuracyPct} />
        </View>
      ))}
    </View>
  );
}

function AccuracyBadge({ pct }: { pct: number }) {
  const c = useThemeColors();
  const color = pct >= 70 ? c.success : pct >= 40 ? c.warning : c.destructive;
  return (
    <View style={[styles.badge, { borderColor: color + "40", backgroundColor: color + "0D" }]}>
      <Text style={[styles.badgeText, { color }]}>{pct}%</Text>
    </View>
  );
}

// ─── Detail view ──────────────────────────────────────────────────

function DetailView({ types }: { types: QuestionType[] }) {
  const c = useThemeColors();
  return (
    <View style={{ gap: spacing.base }}>
      {types.map((qt) => (
        <View key={qt.label} style={[styles.detailSection, { borderColor: c.border, backgroundColor: c.surface }]}>
          <View style={styles.detailHeader}>
            <Text style={[styles.detailLabel, { color: c.foreground }]}>{qt.label}</Text>
            <Text style={[styles.detailCount, { color: c.subtle }]}>{qt.correct}/{qt.total} đúng</Text>
          </View>
          {qt.items.map((item) => {
            const isMcq = item.correctLetter !== "";
            return (
              <View key={item.no} style={[styles.itemRow, { borderTopColor: c.border + "40", backgroundColor: item.correct ? c.success + "08" : item.answered ? c.destructive + "08" : c.muted + "30" }]}>
                <Ionicons name={item.correct ? "checkmark-circle" : "close-circle"} size={16} color={item.correct ? c.success : item.answered ? c.destructive : c.subtle} />
                <Text style={[styles.itemNo, { color: c.foreground }]}>{isMcq ? `Câu ${item.no}` : `Phần ${item.no}`}</Text>
                {isMcq ? (
                  <View style={styles.itemAnswers}>
                    <View style={[styles.letterBox, { borderColor: item.correct ? c.success + "40" : !item.answered ? c.border : c.destructive + "40", backgroundColor: item.correct ? c.success + "15" : !item.answered ? c.muted : c.destructive + "15" }]}>
                      <Text style={[styles.letterText, { color: item.correct ? c.success : !item.answered ? c.subtle : c.destructive }]}>{item.userLetter}</Text>
                    </View>
                    {!item.correct && (
                      <>
                        <Text style={{ color: c.subtle, fontSize: 10 }}>→</Text>
                        <View style={[styles.letterBox, { borderColor: c.success + "40", backgroundColor: c.success + "15" }]}>
                          <Text style={[styles.letterText, { color: c.success }]}>{item.correctLetter}</Text>
                        </View>
                      </>
                    )}
                  </View>
                ) : (
                  <Text style={[styles.itemStatus, { color: item.correct ? c.success : c.subtle }]}>{item.correct ? "Hoàn thành" : "Chưa làm"}</Text>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  gradientHeader: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.bold, color: "#fff", flex: 1, textAlign: "center" },
  doneBtn: { position: "absolute", right: spacing.xl, top: 0, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.sm, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  doneBtnText: { color: "#fff", fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },
  scroll: { padding: spacing.xl },
  // Card
  card: { ...depthNeutral, borderRadius: radius["2xl"], padding: spacing.xl, alignItems: "center", gap: spacing.sm, marginTop: -spacing.xl, backgroundColor: "#FFF" },
  congrats: { fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  userName: { fontSize: fontSize["2xl"], fontFamily: fontFamily.bold },
  examName: { fontSize: fontSize.sm, textAlign: "center" },
  // Circle
  circleWrap: { width: CIRCLE_SIZE, height: CIRCLE_SIZE, alignItems: "center", justifyContent: "center", marginVertical: spacing.base },
  circleInner: { position: "absolute", alignItems: "center" },
  scoreNum: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  scoreMax: { fontSize: fontSize.xs },
  // Pills
  pillRow: { flexDirection: "row", gap: spacing.xl, marginTop: spacing.sm },
  pill: { alignItems: "center", gap: 4 },
  pillBox: { borderWidth: 2, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 4 },
  pillValue: { fontSize: fontSize.lg, fontFamily: fontFamily.extraBold },
  pillLabel: { fontSize: fontSize.xs },
  // Tabs
  tabRow: { flexDirection: "row", borderRadius: radius.md, padding: 4, marginTop: spacing.xl, marginBottom: spacing.base },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: spacing.sm, borderRadius: radius.sm },
  tabText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  // Table
  table: { ...depthNeutral, borderRadius: radius.xl, overflow: "hidden", backgroundColor: "#FFF" },
  tableHeader: { flexDirection: "row", paddingVertical: spacing.md, paddingHorizontal: spacing.md },
  tableRow: { flexDirection: "row", paddingVertical: spacing.md, paddingHorizontal: spacing.md, alignItems: "center" },
  th: { fontSize: 11, fontFamily: fontFamily.semiBold, textTransform: "uppercase" },
  td: { fontSize: fontSize.sm },
  thLabel: { flex: 2 },
  thNum: { flex: 1, textAlign: "center" },
  badge: { flex: 1, alignItems: "center", borderWidth: 1, borderRadius: radius.sm, paddingVertical: 2, marginLeft: 4 },
  badgeText: { fontSize: 11, fontFamily: fontFamily.bold },
  // Detail
  detailSection: { ...depthNeutral, borderRadius: radius.xl, overflow: "hidden", backgroundColor: "#FFF" },
  detailHeader: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  detailLabel: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  detailCount: { fontSize: fontSize.xs },
  itemRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.base, paddingVertical: spacing.sm, borderTopWidth: 1 },
  itemNo: { flex: 1, fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  itemAnswers: { flexDirection: "row", alignItems: "center", gap: 4 },
  letterBox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  letterText: { fontSize: 11, fontFamily: fontFamily.bold },
  itemStatus: { fontSize: fontSize.xs },
});
