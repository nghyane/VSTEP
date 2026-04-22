import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { HapticTouchable } from "@/components/HapticTouchable";
import { LoadingScreen } from "@/components/LoadingScreen";
import { MascotResult } from "@/components/MascotStates";
import { useReadingExerciseDetail } from "@/features/practice/queries";
import { startMcqSession } from "@/features/practice/actions";
import { useMcqSession } from "@/features/practice/use-mcq-session";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";
import { depthNeutral } from "@/theme/depth";
import type { McqQuestion } from "@/features/practice/types";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ReadingExerciseScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useReadingExerciseDetail(exerciseId);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [showPassage, setShowPassage] = useState(true);

  const session = useMcqSession("reading", sessionId, data?.questions ?? []);

  async function handleStart() {
    if (!data || starting) return;
    setStarting(true);
    try {
      const s = await startMcqSession("reading", exerciseId);
      setSessionId(s.id);
    } catch { /* handled */ } finally {
      setStarting(false);
    }
  }

  if (isLoading) return <LoadingScreen />;
  if (!data) return null;

  const { exercise, questions } = data;

  // Result
  if (session.result) {
    return (
      <View style={[s.root, { backgroundColor: c.background, paddingBottom: insets.bottom }]}>
        <FocusBar title="Đọc" onClose={() => router.back()} />
        <MascotResult score={session.result.score} total={session.result.total} onBack={() => router.back()} backLabel="Quay lại danh sách" />
      </View>
    );
  }

  // Preview
  if (!sessionId) {
    return (
      <View style={[s.root, { backgroundColor: c.background }]}>
        <FocusBar title="Đọc" onClose={() => router.back()} />
        <View style={s.preview}>
          <View style={[s.partBadge, { backgroundColor: c.primaryTint }]}>
            <Text style={[s.partBadgeText, { color: c.primaryDark }]}>Part {exercise.part}</Text>
          </View>
          <Text style={[s.previewTitle, { color: c.foreground }]}>{exercise.title}</Text>
          {exercise.description && <Text style={[s.previewDesc, { color: c.subtle }]}>{exercise.description}</Text>}
          <Text style={[s.previewMeta, { color: c.subtle }]}>{questions.length} câu hỏi</Text>
          <HapticTouchable
            style={[s.startBtn, { backgroundColor: c.primary, opacity: starting ? 0.7 : 1 }]}
            onPress={handleStart}
            disabled={starting}
          >
            {starting
              ? <ActivityIndicator color="#FFF" size="small" />
              : <Text style={s.startBtnText}>Bắt đầu làm bài</Text>}
          </HapticTouchable>
        </View>
      </View>
    );
  }

  // In-progress
  return (
    <View style={[s.root, { backgroundColor: c.background }]}>
      <View style={[s.inHeader, { borderBottomColor: c.border }]}>
        <View>
          <Text style={[s.inTitle, { color: c.foreground }]}>{exercise.title}</Text>
          <Text style={[s.inMeta, { color: c.subtle }]}>Part {exercise.part} · {questions.length} câu</Text>
        </View>
        <HapticTouchable
          style={[s.passageToggle, { backgroundColor: showPassage ? c.primaryTint : c.muted }]}
          onPress={() => setShowPassage(!showPassage)}
        >
          <Text style={[s.passageToggleText, { color: showPassage ? c.primaryDark : c.mutedForeground }]}>
            {showPassage ? "Ẩn đoạn văn" : "Hiện đoạn văn"}
          </Text>
        </HapticTouchable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
        {/* Passage */}
        {showPassage && (
          <View style={[s.passageBox, { backgroundColor: c.background, borderColor: c.border }]}>
            <Text style={[s.passageText, { color: c.foreground }]}>{exercise.passage}</Text>
          </View>
        )}

        {/* Questions */}
        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={i}
            selected={session.answers[q.id] ?? null}
            result={session.result}
            onSelect={(idx) => session.select(q.id, idx)}
          />
        ))}
        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Submit */}
      <View style={[s.bottom, { borderTopColor: c.border, paddingBottom: insets.bottom || spacing.base }]}>
        <Text style={[s.progressText, { color: c.subtle }]}>{session.answeredCount}/{questions.length} câu đã trả lời</Text>
        <HapticTouchable
          style={[s.submitBtn, { backgroundColor: session.answeredCount < questions.length ? c.muted : c.primary, opacity: session.submitting ? 0.7 : 1 }]}
          onPress={session.submit}
          disabled={session.submitting || session.answeredCount < questions.length}
        >
          {session.submitting
            ? <ActivityIndicator color="#FFF" size="small" />
            : <Text style={[s.submitText, { color: session.answeredCount < questions.length ? c.mutedForeground : "#FFF" }]}>
                Nộp bài
              </Text>}
        </HapticTouchable>
      </View>
    </View>
  );
}

function FocusBar({ title, onClose }: { title: string; onClose: () => void }) {
  const c = useThemeColors();
  return (
    <View style={[s.focusBar, { borderBottomColor: c.border }]}>
      <HapticTouchable onPress={onClose}>
        <Ionicons name="arrow-back" size={22} color={c.mutedForeground} />
      </HapticTouchable>
      <Text style={[s.focusTitle, { color: c.foreground }]}>{title}</Text>
      <View style={{ width: 22 }} />
    </View>
  );
}

function QuestionCard({ question, index, selected, result, onSelect }: {
  question: McqQuestion;
  index: number;
  selected: number | null;
  result: ReturnType<typeof useMcqSession>["result"];
  onSelect: (i: number) => void;
}) {
  const c = useThemeColors();
  return (
    <View>
      <Text style={[s.qNum, { color: c.subtle }]}>Câu {index + 1}</Text>
      <Text style={[s.qText, { color: c.foreground }]}>{question.question}</Text>
      <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
        {question.options.map((opt, i) => {
          const isSel = selected === i;
          const isCorrect = result && question.correctIndex === i;
          const isWrong = result && isSel && question.correctIndex !== i;
          const bg = isCorrect ? c.primaryTint : isWrong ? c.destructiveTint : isSel ? c.primaryTint : c.card;
          const border = isCorrect ? c.primary : isWrong ? c.destructive : isSel ? c.primary : c.border;
          return (
            <HapticTouchable
              key={i}
              style={[s.option, { backgroundColor: bg, borderColor: border }]}
              onPress={() => !result && onSelect(i)}
              disabled={!!result}
            >
              <Text style={[s.optionLetter, { color: isSel || isCorrect ? c.primary : c.subtle }]}>
                {["A","B","C","D"][i]}.
              </Text>
              <Text style={[s.optionText, { color: c.foreground }]}>{opt}</Text>
              {isCorrect && <Ionicons name="checkmark-circle" size={18} color={c.primary} />}
              {isWrong && <Ionicons name="close-circle" size={18} color={c.destructive} />}
            </HapticTouchable>
          );
        })}
      </View>
      {result && question.explanation && (
        <Text style={[s.explanation, { color: c.subtle }]}>💡 {question.explanation}</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  focusBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderBottomWidth: 1 },
  focusTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  preview: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing["2xl"], gap: spacing.sm },
  partBadge: { borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 4 },
  partBadgeText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  previewTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold, textAlign: "center" },
  previewDesc: { fontSize: fontSize.sm, textAlign: "center", lineHeight: 20 },
  previewMeta: { fontSize: fontSize.sm },
  startBtn: { borderRadius: radius.button, paddingHorizontal: spacing["2xl"], paddingVertical: spacing.md, marginTop: spacing.lg },
  startBtnText: { color: "#FFF", fontSize: fontSize.base, fontFamily: fontFamily.bold, textTransform: "uppercase" },
  inHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderBottomWidth: 1 },
  inTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  inMeta: { fontSize: fontSize.xs, marginTop: 2 },
  passageToggle: { borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  passageToggleText: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },
  passageBox: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.base },
  passageText: { fontSize: fontSize.sm, lineHeight: 22 },
  bottom: { borderTopWidth: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.sm, gap: spacing.sm },
  progressText: { fontSize: fontSize.xs, textAlign: "center" },
  submitBtn: { borderRadius: radius.button, paddingVertical: spacing.md, alignItems: "center" },
  submitText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold, textTransform: "uppercase" },
  qNum: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold, marginBottom: 4 },
  qText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold, lineHeight: 20 },
  option: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderWidth: 2, borderRadius: radius.lg, padding: spacing.md },
  optionLetter: { fontSize: fontSize.sm, fontFamily: fontFamily.bold, minWidth: 20 },
  optionText: { flex: 1, fontSize: fontSize.sm, lineHeight: 18 },
  explanation: { fontSize: fontSize.xs, lineHeight: 18, marginTop: spacing.sm, fontStyle: "italic" },
});
