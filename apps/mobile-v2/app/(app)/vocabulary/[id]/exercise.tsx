import { StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { HapticTouchable } from "@/components/HapticTouchable";
import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { MascotEmpty, MascotResult } from "@/components/MascotStates";
import {
  useVocabTopicDetail,
  useVocabExerciseSession,
  type VocabExercise,
} from "@/hooks/use-vocab";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

export default function ExerciseScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, kind: kindParam } = useLocalSearchParams<{ id: string; kind: string }>();
  const kind = (["mcq", "fill_blank", "word_form"].includes(kindParam ?? "")
    ? kindParam
    : "mcq") as VocabExercise["kind"];

  const { data } = useVocabTopicDetail(id ?? "");
  const allExercises = data?.exercises ?? [];
  const exercises = allExercises.filter((e) => e.kind === kind);
  const session = useVocabExerciseSession(exercises);

  const total = session.total;
  const done = session.done;
  const current = session.current;
  const progress = total > 0 ? session.index / total : 0;

  const kindLabel =
    kind === "mcq"
      ? "Trắc nghiệm"
      : kind === "fill_blank"
        ? "Điền từ"
        : "Biến đổi từ";
  const kindColor =
    kind === "mcq" ? c.info : kind === "fill_blank" ? c.warning : c.skillWriting;

  const canSubmit = kind === "mcq" ? session.selected !== null : session.textAnswer.trim().length > 0;

  if (total === 0) {
    return (
      <View style={[s.center, { backgroundColor: c.background }]}>
        <MascotEmpty
          mascot="think"
          title="Chưa có bài tập"
          subtitle="Chủ đề này chưa có bài tập loại này."
        />
        <DepthButton
          variant="secondary"
          onPress={() => router.back()}
          style={{ marginTop: spacing.lg }}
        >
          Quay lại
        </DepthButton>
      </View>
    );
  }

  if (done) {
    const correctCount = exercises.reduce(
      (acc, ex) => acc + (ex.payload.correct ? 1 : 0),
      0,
    );
    return (
      <MascotResult
        score={correctCount}
        total={total}
        onBack={() => router.back()}
        backLabel="Quay lại"
      />
    );
  }

  if (!current) return null;

  return (
    <View style={[s.root, { backgroundColor: c.background }]}>
      {/* Focus bar */}
      <View style={[s.focusBar, { paddingTop: insets.top + spacing.sm }]}>
        <HapticTouchable onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={c.foreground} />
        </HapticTouchable>
        <View style={[s.barTrack, { backgroundColor: c.muted }]}>
          <View
            style={[s.barFill, { backgroundColor: c.primary, width: `${progress * 100}%` }]}
          />
        </View>
        <Text style={[s.barCount, { color: c.subtle }]}>
          {session.index + 1}/{total}
        </Text>
      </View>

      {/* Content */}
      <View style={s.content}>
        <DepthCard style={s.exerciseCard}>
          {/* Kind badge */}
          <View style={[s.kindBadge, { backgroundColor: kindColor + "15" }]}>
            <Text style={[s.kindBadgeText, { color: kindColor }]}>{kindLabel}</Text>
          </View>

          {/* MCQ */}
          {kind === "mcq" && current.payload.prompt ? (
            <View style={{ gap: spacing.md }}>
              <Text style={[s.prompt, { color: c.foreground }]}>
                {current.payload.prompt as string}
              </Text>
              {(current.payload.options as string[]).map((opt: string, i: number) => {
                const sel = session.selected === i;
                const ok = session.result?.isCorrect && sel;
                const wrong = session.result && !session.result.isCorrect && sel;
                return (
                  <HapticTouchable
                    key={opt}
                    style={[
                      s.optionBtn,
                      {
                        borderColor: ok
                          ? c.success
                          : wrong
                            ? c.destructive
                            : sel
                              ? c.primary
                              : c.border,
                        backgroundColor: ok
                          ? c.success + "10"
                          : wrong
                            ? c.destructive + "10"
                            : sel
                              ? c.primary + "10"
                              : "transparent",
                      },
                    ]}
                    onPress={() => !session.result && session.select(i)}
                    disabled={!!session.result}
                  >
                    <View
                      style={[
                        s.optionLetter,
                        {
                          backgroundColor: ok
                            ? c.success
                            : wrong
                              ? c.destructive
                              : sel
                                ? c.primary
                                : c.muted,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: sel || ok || wrong ? "#fff" : c.mutedForeground,
                          fontSize: 12,
                          fontFamily: fontFamily.bold,
                        }}
                      >
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
              <Text style={[s.prompt, { color: c.foreground }]}>
                {current.payload.sentence as string}
              </Text>
              <TextInput
                style={[
                  s.fillInput,
                  {
                    borderColor: session.result
                      ? session.result.isCorrect
                        ? c.success
                        : c.destructive
                      : c.border,
                    color: c.foreground,
                  },
                ]}
                placeholder="Nhập đáp án..."
                placeholderTextColor={c.placeholder}
                value={session.textAnswer}
                onChangeText={(v) => session.setTextAnswer(v)}
                editable={!session.result}
                autoCapitalize="none"
              />
            </View>
          ) : null}

          {/* Word form */}
          {kind === "word_form" && current.payload.sentence ? (
            <View style={{ gap: spacing.md }}>
              {current.payload.instruction ? (
                <Text style={[s.promptSub, { color: c.mutedForeground }]}>
                  {current.payload.instruction as string}
                </Text>
              ) : null}
              <Text style={[s.prompt, { color: c.foreground }]}>
                {current.payload.sentence as string}
              </Text>
              <Text
                style={{
                  color: c.primary,
                  fontSize: fontSize.xs,
                  fontFamily: fontFamily.semiBold,
                }}
              >
                {`Từ gốc: ${(current.payload.rootWord ?? current.payload.root_word ?? "") as string}`}
              </Text>
              <TextInput
                style={[
                  s.fillInput,
                  {
                    borderColor: session.result
                      ? session.result.isCorrect
                        ? c.success
                        : c.destructive
                      : c.border,
                    color: c.foreground,
                  },
                ]}
                placeholder="Nhập dạng đúng..."
                placeholderTextColor={c.placeholder}
                value={session.textAnswer}
                onChangeText={(v) => session.setTextAnswer(v)}
                editable={!session.result}
                autoCapitalize="none"
              />
            </View>
          ) : null}

          {/* Feedback */}
          {session.result ? (
            <View
              style={[
                s.feedback,
                {
                  backgroundColor: session.result.isCorrect
                    ? c.success + "10"
                    : c.destructive + "10",
                },
              ]}
            >
              <Ionicons
                name={session.result.isCorrect ? "checkmark-circle" : "close-circle"}
                size={16}
                color={session.result.isCorrect ? c.success : c.destructive}
              />
              <Text style={[s.feedbackText, { color: c.foreground }]}>
                {session.result.explanation ??
                  (session.result.isCorrect ? "Chính xác!" : "Chưa đúng.")}
              </Text>
            </View>
          ) : null}
        </DepthCard>

        {!session.result ? (
          <DepthButton
            fullWidth
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              session.submit();
            }}
            disabled={!canSubmit || session.submitting}
          >
            {session.submitting ? "Đang kiểm tra..." : "Kiểm tra"}
          </DepthButton>
        ) : (
          <DepthButton
            fullWidth
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              session.next();
            }}
          >
            Tiếp tục
          </DepthButton>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  focusBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  barTrack: { flex: 1, height: 8, borderRadius: radius.full, overflow: "hidden" },
  barFill: { height: 8, borderRadius: radius.full },
  barCount: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.bold,
    minWidth: 36,
    textAlign: "right",
  },

  content: { flex: 1, paddingHorizontal: spacing.xl, gap: spacing.lg, paddingBottom: spacing["2xl"] },

  exerciseCard: { gap: spacing.base },
  kindBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  kindBadgeText: { fontSize: 11, fontFamily: fontFamily.semiBold },
  prompt: { fontSize: fontSize.base, fontFamily: fontFamily.medium, lineHeight: 24 },
  promptSub: { fontSize: fontSize.sm, lineHeight: 20 },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 2,
    borderBottomWidth: 3,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  optionLetter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: { flex: 1, fontSize: fontSize.sm },
  fillInput: {
    borderWidth: 2,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    fontFamily: fontFamily.regular,
  },
  feedback: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  feedbackText: { flex: 1, fontSize: fontSize.sm, lineHeight: 20 },
});
