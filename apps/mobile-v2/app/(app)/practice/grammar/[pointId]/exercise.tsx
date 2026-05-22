import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { HapticTouchable } from "@/components/HapticTouchable";
import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { MascotEmpty } from "@/components/MascotStates";
import { useGrammarPointDetail, useGrammarExerciseSession } from "@/hooks/use-grammar";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

export default function GrammarExerciseScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { pointId } = useLocalSearchParams<{ pointId: string }>();
  const { data: detail, isLoading } = useGrammarPointDetail(pointId ?? "");
  const exercises = detail?.exercises ?? [];
  const s2 = useGrammarExerciseSession(exercises);

  if (isLoading) {
    return (
      <View style={[styles.fullCenter, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.primary} size="large" />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={[styles.fullCenter, { backgroundColor: c.background }]}>
        <MascotEmpty mascot="think" title="Không tìm thấy" subtitle="Không thể tải bài tập." />
      </View>
    );
  }

  if (exercises.length === 0) {
    return (
      <View style={[styles.fullCenter, { backgroundColor: c.background, paddingHorizontal: spacing.xl }]}>
        <MascotEmpty mascot="think" title="Chưa có bài tập" subtitle="Điểm ngữ pháp này chưa có bài tập." />
        <DepthButton variant="secondary" onPress={() => router.back()} style={{ marginTop: spacing.lg }}>
          Quay lại
        </DepthButton>
      </View>
    );
  }

  if (s2.done) {
    return (
      <View style={[styles.fullCenter, { backgroundColor: c.background, paddingHorizontal: spacing.xl }]}>
        <Text style={[styles.doneEmoji]}>🎉</Text>
        <Text style={[styles.doneTitle, { color: c.foreground }]}>Hoàn thành!</Text>
        <Text style={[styles.doneSub, { color: c.mutedForeground }]}>
          Bạn đã làm xong {s2.total} bài tập.
        </Text>
        <DepthButton
          fullWidth
          onPress={() => router.back()}
          style={{ marginTop: spacing.xl }}
        >
          Xong
        </DepthButton>
      </View>
    );
  }

  const ex = s2.current!;
  const canSubmit = ex.kind === "mcq" ? s2.selected !== null : s2.textAnswer.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: c.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm, borderBottomColor: c.borderLight }]}>
        <HapticTouchable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={22} color={c.foreground} />
        </HapticTouchable>
        <View style={[styles.progressTrack, { backgroundColor: c.muted }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: c.primary, width: `${((s2.index) / s2.total) * 100}%` },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: c.subtle }]}>
          {s2.index + 1}/{s2.total}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Question */}
        <DepthCard style={styles.questionCard}>
          <QuestionPrompt exercise={ex} />
        </DepthCard>

        {/* Input */}
        {ex.kind === "mcq" ? (
          <View style={styles.optionsWrap}>
            {ex.payload.options.map((opt, i) => {
              const isSelected = s2.selected === i;
              const answered = !!s2.result;
              const isCorrectChoice = answered && s2.result!.correct && isSelected;
              const isWrongChoice = answered && !s2.result!.correct && isSelected;
              return (
                <TouchableOpacity
                  key={opt}
                  activeOpacity={0.8}
                  disabled={answered}
                  onPress={() => s2.select(i)}
                  style={[
                    styles.optionBtn,
                    {
                      borderColor: isCorrectChoice
                        ? c.primary
                        : isWrongChoice
                        ? c.destructive
                        : isSelected
                        ? c.primary
                        : c.border,
                      backgroundColor: isCorrectChoice
                        ? c.primaryTint
                        : isWrongChoice
                        ? c.destructiveTint
                        : isSelected
                        ? c.primaryTint
                        : c.card,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: isCorrectChoice || isSelected
                          ? c.primary
                          : isWrongChoice
                          ? c.destructive
                          : c.foreground,
                      },
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <TextInput
            style={[
              styles.textInput,
              {
                borderColor: s2.result
                  ? s2.result.correct ? c.primary : c.destructive
                  : c.border,
                backgroundColor: c.card,
                color: c.foreground,
              },
            ]}
            value={s2.textAnswer}
            onChangeText={s2.setTextAnswer}
            editable={!s2.result}
            placeholder={
              ex.kind === "error_correction"
                ? "Nhập câu đã sửa..."
                : ex.kind === "rewrite"
                ? "Viết lại câu..."
                : "Điền từ..."
            }
            placeholderTextColor={c.placeholder}
            multiline={ex.kind === "error_correction" || ex.kind === "rewrite"}
            returnKeyType="done"
          />
        )}

        {/* Feedback */}
        {s2.result && (
          <DepthCard
            variant={s2.result.correct ? "success" : "destructive"}
            style={styles.feedbackCard}
          >
            <Text style={[styles.feedbackTitle, { color: s2.result.correct ? c.primary : c.destructive }]}>
              {s2.result.correct ? "Chính xác!" : "Chưa đúng"}
            </Text>
            <Text style={[styles.feedbackExplain, { color: c.mutedForeground }]}>
              {s2.result.explanation}
            </Text>
            <Text style={[styles.feedbackMastery, { color: c.subtle }]}>
              Mastery: {s2.result.mastery.computedLevel} · {s2.result.mastery.accuracyPercent}%
            </Text>
          </DepthCard>
        )}
      </ScrollView>

      {/* Bottom action */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.base, borderTopColor: c.borderLight }]}>
        {s2.result ? (
          <DepthButton fullWidth onPress={s2.next}>
            Tiếp tục
          </DepthButton>
        ) : (
          <DepthButton
            fullWidth
            disabled={!canSubmit || s2.submitting}
            onPress={s2.submit}
          >
            {s2.submitting ? "Đang kiểm tra..." : "Kiểm tra"}
          </DepthButton>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function QuestionPrompt({ exercise }: { exercise: ReturnType<typeof useGrammarExerciseSession>["current"] }) {
  const c = useThemeColors();
  if (!exercise) return null;
  switch (exercise.kind) {
    case "mcq":
      return <Text style={[styles.questionText, { color: c.foreground }]}>{exercise.payload.prompt}</Text>;
    case "error_correction":
      return (
        <>
          <Text style={[styles.questionHint, { color: c.mutedForeground }]}>Tìm và sửa lỗi sai trong câu:</Text>
          <Text style={[styles.questionText, { color: c.foreground }]}>{exercise.payload.sentence}</Text>
        </>
      );
    case "fill_blank":
      return (
        <>
          <Text style={[styles.questionHint, { color: c.mutedForeground }]}>Điền từ vào chỗ trống:</Text>
          <Text style={[styles.questionText, { color: c.foreground }]}>{exercise.payload.template}</Text>
        </>
      );
    case "rewrite":
      return (
        <>
          <Text style={[styles.questionHint, { color: c.mutedForeground }]}>{exercise.payload.instruction}</Text>
          <Text style={[styles.questionText, { color: c.foreground }]}>{exercise.payload.original}</Text>
        </>
      );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fullCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  // Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  progressTrack: { flex: 1, height: 8, borderRadius: radius.full, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: radius.full },
  progressText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold, minWidth: 32, textAlign: "right" },
  // Scroll
  scroll: { padding: spacing.xl, gap: spacing.lg },
  // Question
  questionCard: { gap: spacing.sm },
  questionHint: { fontSize: fontSize.sm },
  questionText: { fontSize: fontSize.lg, fontFamily: fontFamily.bold, lineHeight: 28 },
  // MCQ options
  optionsWrap: { gap: spacing.sm },
  optionBtn: {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.lg,
    padding: spacing.base,
  },
  optionText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  // Text input
  textInput: {
    borderWidth: 2,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    fontFamily: fontFamily.regular,
    minHeight: 52,
  },
  // Feedback
  feedbackCard: { gap: 4 },
  feedbackTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  feedbackExplain: { fontSize: fontSize.sm, lineHeight: 20 },
  feedbackMastery: { fontSize: fontSize.xs, marginTop: 4 },
  // Bottom bar
  bottomBar: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  // Done screen
  doneEmoji: { fontSize: 56, textAlign: "center", marginBottom: spacing.md },
  doneTitle: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold, textAlign: "center" },
  doneSub: { fontSize: fontSize.sm, textAlign: "center", marginTop: spacing.sm, lineHeight: 20 },
});
