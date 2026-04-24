import { useCallback, useReducer } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { HapticTouchable } from "@/components/HapticTouchable";
import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { useVocabTopicDetail } from "@/hooks/use-vocab";
import { api } from "@/lib/api";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

type ExerciseKind = "mcq" | "fill_blank" | "word_form";

interface VocabExercise {
  id: string;
  kind: ExerciseKind;
  payload: Record<string, any>;
}

interface ExerciseResult { correct: boolean; explanation: string | null }

interface State {
  index: number;
  selected: number | null;
  textAnswer: string;
  result: ExerciseResult | null;
  submitting: boolean;
}

type Action =
  | { type: "select"; index: number }
  | { type: "text"; value: string }
  | { type: "submitting" }
  | { type: "answered"; result: ExerciseResult }
  | { type: "next" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "select": return { ...state, selected: action.index };
    case "text": return { ...state, textAnswer: action.value };
    case "submitting": return { ...state, submitting: true };
    case "answered": return { ...state, result: action.result, submitting: false };
    case "next": return { index: state.index + 1, selected: null, textAnswer: "", result: null, submitting: false };
  }
}

export default function ExerciseScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, kind: kindParam } = useLocalSearchParams<{ id: string; kind: string }>();
  const kind = (["mcq", "fill_blank", "word_form"].includes(kindParam ?? "") ? kindParam : "mcq") as ExerciseKind;

  const { data } = useVocabTopicDetail(id ?? "");
  const allExercises = ((data as any)?.exercises ?? []) as VocabExercise[];
  const exercises = allExercises.filter((e) => e.kind === kind);

  const [state, dispatch] = useReducer(reducer, { index: 0, selected: null, textAnswer: "", result: null, submitting: false });
  const { index, selected, textAnswer, result, submitting } = state;

  const total = exercises.length;
  const done = index >= total;
  const current = exercises[index] ?? null;
  const progress = total > 0 ? index / total : 0;

  const kindLabel = kind === "mcq" ? "Trắc nghiệm" : kind === "fill_blank" ? "Điền từ" : "Biến đổi từ";
  const kindColor = kind === "mcq" ? c.info : kind === "fill_blank" ? c.warning : c.skillWriting;

  const canSubmit = kind === "mcq" ? selected !== null : textAnswer.trim().length > 0;

  const handleSubmit = useCallback(async () => {
    if (!current || submitting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch({ type: "submitting" });
    const answer = kind === "mcq" ? { selectedIndex: selected } : { text: textAnswer.trim() };
    try {
      const res = await api.post<{ isCorrect: boolean; explanation: string | null }>(
        `/api/v1/vocab/exercises/${current.id}/attempt`,
        { answer },
      );
      dispatch({ type: "answered", result: { correct: res.isCorrect, explanation: res.explanation } });
    } catch {
      dispatch({ type: "answered", result: { correct: false, explanation: "Không thể kiểm tra. Vui lòng thử lại." } });
    }
  }, [current, submitting, kind, selected, textAnswer]);

  return (
    <View style={[s.root, { backgroundColor: c.background }]}>
      {/* Focus bar */}
      <View style={[s.focusBar, { paddingTop: insets.top + spacing.sm }]}>
        <HapticTouchable onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={c.foreground} />
        </HapticTouchable>
        <View style={[s.barTrack, { backgroundColor: c.muted }]}>
          <View style={[s.barFill, { backgroundColor: c.primary, width: `${progress * 100}%` }]} />
        </View>
        <Text style={[s.barCount, { color: c.subtle }]}>{index}/{total}</Text>
      </View>

      {/* Content */}
      <View style={s.content}>
        {total === 0 ? (
          <View style={s.doneWrap}>
            <Ionicons name="document-text-outline" size={48} color={c.subtle} />
            <Text style={[s.doneTitle, { color: c.foreground }]}>Chưa có bài tập</Text>
            <Text style={[s.doneSub, { color: c.mutedForeground }]}>Chủ đề này chưa có bài tập loại này.</Text>
            <DepthButton variant="secondary" onPress={() => router.back()}>Quay lại</DepthButton>
          </View>
        ) : done ? (
          <View style={s.doneWrap}>
            <Ionicons name="trophy" size={56} color="#FFC800" />
            <Text style={[s.doneTitle, { color: c.foreground }]}>{`Đã làm xong ${total} bài tập!`}</Text>
            <DepthButton onPress={() => router.back()}>Quay lại</DepthButton>
          </View>
        ) : current ? (
          <View style={s.exerciseWrap}>
            <DepthCard style={s.exerciseCard}>
              {/* Kind badge */}
              <View style={[s.kindBadge, { backgroundColor: kindColor + "15" }]}>
                <Text style={[s.kindBadgeText, { color: kindColor }]}>{kindLabel}</Text>
              </View>

              {/* MCQ */}
              {kind === "mcq" && current.payload.prompt ? (
                <View style={{ gap: spacing.md }}>
                  <Text style={[s.prompt, { color: c.foreground }]}>{current.payload.prompt}</Text>
                  {(current.payload.options as string[]).map((opt: string, i: number) => {
                    const sel = selected === i;
                    const ok = result?.correct && sel;
                    const wrong = result && !result.correct && sel;
                    return (
                      <HapticTouchable
                        key={opt}
                        style={[s.optionBtn, {
                          borderColor: ok ? c.success : wrong ? c.destructive : sel ? c.primary : c.border,
                          backgroundColor: ok ? c.success + "10" : wrong ? c.destructive + "10" : sel ? c.primary + "10" : "transparent",
                        }]}
                        onPress={() => !result && dispatch({ type: "select", index: i })}
                        disabled={!!result}
                      >
                        <View style={[s.optionLetter, { backgroundColor: ok ? c.success : wrong ? c.destructive : sel ? c.primary : c.muted }]}>
                          <Text style={{ color: (sel || ok || wrong) ? "#fff" : c.mutedForeground, fontSize: 12, fontFamily: fontFamily.bold }}>
                            {String.fromCharCode(65 + i)}
                          </Text>
                        </View>
                        <Text style={[s.optionText, { color: c.foreground }]}>{opt}</Text>
                      </HapticTouchable>
                    );
                  })}
                </View>
              ) : null}

              {/* Fill blank */}
              {kind === "fill_blank" && current.payload.sentence ? (
                <View style={{ gap: spacing.md }}>
                  <Text style={[s.prompt, { color: c.foreground }]}>{current.payload.sentence}</Text>
                  <TextInput
                    style={[s.fillInput, { borderColor: result ? (result.correct ? c.success : c.destructive) : c.border, color: c.foreground }]}
                    placeholder="Nhập đáp án..."
                    placeholderTextColor={c.placeholder}
                    value={textAnswer}
                    onChangeText={(v) => dispatch({ type: "text", value: v })}
                    editable={!result}
                    autoCapitalize="none"
                  />
                </View>
              ) : null}

              {/* Word form */}
              {kind === "word_form" && current.payload.sentence ? (
                <View style={{ gap: spacing.md }}>
                  {current.payload.instruction ? <Text style={[s.promptSub, { color: c.mutedForeground }]}>{current.payload.instruction}</Text> : null}
                  <Text style={[s.prompt, { color: c.foreground }]}>{current.payload.sentence}</Text>
                  <Text style={{ color: c.primary, fontSize: fontSize.xs, fontFamily: fontFamily.semiBold }}>
                    {`Từ gốc: ${current.payload.root_word ?? current.payload.rootWord ?? ""}`}
                  </Text>
                  <TextInput
                    style={[s.fillInput, { borderColor: result ? (result.correct ? c.success : c.destructive) : c.border, color: c.foreground }]}
                    placeholder="Nhập dạng đúng..."
                    placeholderTextColor={c.placeholder}
                    value={textAnswer}
                    onChangeText={(v) => dispatch({ type: "text", value: v })}
                    editable={!result}
                    autoCapitalize="none"
                  />
                </View>
              ) : null}

              {/* Feedback */}
              {result ? (
                <View style={[s.feedback, { backgroundColor: result.correct ? c.success + "10" : c.destructive + "10" }]}>
                  <Ionicons name={result.correct ? "checkmark-circle" : "close-circle"} size={16} color={result.correct ? c.success : c.destructive} />
                  <Text style={[s.feedbackText, { color: c.foreground }]}>
                    {result.explanation ?? (result.correct ? "Chính xác!" : "Chưa đúng.")}
                  </Text>
                </View>
              ) : null}
            </DepthCard>

            {!result ? (
              <DepthButton fullWidth onPress={handleSubmit} disabled={!canSubmit || submitting}>
                {submitting ? "Đang kiểm tra..." : "Kiểm tra"}
              </DepthButton>
            ) : (
              <DepthButton fullWidth onPress={() => dispatch({ type: "next" })}>
                Tiếp tục
              </DepthButton>
            )}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  focusBar: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  barTrack: { flex: 1, height: 8, borderRadius: radius.full, overflow: "hidden" },
  barFill: { height: 8, borderRadius: radius.full },
  barCount: { fontSize: fontSize.xs, fontFamily: fontFamily.bold, minWidth: 36, textAlign: "right" },

  content: { flex: 1, justifyContent: "center", paddingHorizontal: spacing.xl, paddingBottom: spacing["2xl"] },

  exerciseWrap: { gap: spacing.lg },
  exerciseCard: { gap: spacing.base },
  kindBadge: { alignSelf: "flex-start", paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  kindBadgeText: { fontSize: 11, fontFamily: fontFamily.semiBold },
  prompt: { fontSize: fontSize.base, fontFamily: fontFamily.medium, lineHeight: 24 },
  promptSub: { fontSize: fontSize.sm, lineHeight: 20 },
  optionBtn: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 2, borderBottomWidth: 3, borderRadius: radius.lg, padding: spacing.md },
  optionLetter: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  optionText: { flex: 1, fontSize: fontSize.sm },
  fillInput: { borderWidth: 2, borderRadius: radius.lg, paddingHorizontal: spacing.base, paddingVertical: spacing.md, fontSize: fontSize.base, fontFamily: fontFamily.regular },
  feedback: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg },
  feedbackText: { flex: 1, fontSize: fontSize.sm, lineHeight: 20 },

  doneWrap: { alignItems: "center", gap: spacing.lg },
  doneTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.bold, textAlign: "center" },
  doneSub: { fontSize: fontSize.sm, textAlign: "center" },
});
