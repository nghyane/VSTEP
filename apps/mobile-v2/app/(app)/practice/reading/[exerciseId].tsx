import { useState } from "react";
import {
  ActivityIndicator, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";

import { HapticTouchable } from "@/components/HapticTouchable";
import { DepthButton } from "@/components/DepthButton";
import { useReadingExerciseDetail, useMcqSession, startReadingSession, submitReadingSession } from "@/hooks/use-practice";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";
import type { McqQuestion, SubmitResult } from "@/hooks/use-practice";

const COLOR = "#7850C8";

export default function ReadingExerciseScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const { data: detail, isLoading } = useReadingExerciseDetail(exerciseId ?? "");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const startMutation = useMutation({
    mutationFn: () => startReadingSession(exerciseId ?? ""),
    onSuccess: (res) => setSessionId(res.id),
  });

  if (isLoading || !detail) {
    return (
      <View style={[s.fullCenter, { backgroundColor: c.background }]}>
        <ActivityIndicator color={COLOR} size="large" />
      </View>
    );
  }

  if (!sessionId) {
    return (
      <View style={[s.root, { backgroundColor: c.background }]}>
        <View style={[s.topBar, { paddingTop: insets.top + spacing.sm, borderBottomColor: c.borderLight }]}>
          <HapticTouchable onPress={() => router.back()} style={s.closeBtn}>
            <Ionicons name="arrow-back" size={22} color={c.foreground} />
          </HapticTouchable>
          <Text style={[s.topBarTitle, { color: c.foreground }]} numberOfLines={1}>{detail.exercise.title}</Text>
          <View style={[s.partChip, { backgroundColor: COLOR + "18" }]}>
            <Text style={[s.partChipText, { color: COLOR }]}>Part {detail.exercise.part}</Text>
          </View>
        </View>
        <View style={[s.fullCenter, { flex: 1 }]}>
          <View style={[s.previewIcon, { backgroundColor: COLOR + "18" }]}>
            <Ionicons name="book" size={40} color={COLOR} />
          </View>
          <Text style={[s.previewTitle, { color: c.foreground }]}>{detail.exercise.title}</Text>
          {detail.exercise.description && (
            <Text style={[s.previewDesc, { color: c.mutedForeground }]}>{detail.exercise.description}</Text>
          )}
          <Text style={[s.previewMeta, { color: c.subtle }]}>{detail.questions.length} câu hỏi</Text>
          <DepthButton
            onPress={() => startMutation.mutate()}
            disabled={startMutation.isPending}
            style={{ marginTop: spacing.xl, minWidth: 200, backgroundColor: COLOR, borderColor: COLOR }}
          >
            {startMutation.isPending ? "Đang bắt đầu..." : "Bắt đầu làm bài"}
          </DepthButton>
        </View>
      </View>
    );
  }

  return <InProgressScreen detail={detail} sessionId={sessionId} onBack={() => router.back()} insets={insets} c={c} />;
}

function InProgressScreen({ detail, sessionId, onBack, insets, c }: any) {
  const { exercise, questions } = detail;
  const session = useMcqSession(sessionId, submitReadingSession, "reading");
  const [showPassage, setShowPassage] = useState(true);

  return (
    <View style={[s.root, { backgroundColor: c.background }]}>
      {/* Top bar */}
      <View style={[s.topBar, { paddingTop: insets.top + spacing.sm, borderBottomColor: c.borderLight }]}>
        <HapticTouchable onPress={onBack} style={s.closeBtn}>
          <Ionicons name="close" size={22} color={c.foreground} />
        </HapticTouchable>
        <View style={[s.progressTrack, { backgroundColor: c.muted }]}>
          <View style={[s.progressFill, { backgroundColor: COLOR, width: `${(session.answeredCount / questions.length) * 100}%` }]} />
        </View>
        <Text style={[s.progressCount, { color: c.subtle }]}>{session.answeredCount}/{questions.length}</Text>
      </View>

      {/* Toggle passage/questions */}
      <View style={[s.toggleRow, { borderBottomColor: c.borderLight }]}>
        <TouchableOpacity
          style={[s.toggleBtn, showPassage && { borderBottomColor: COLOR, borderBottomWidth: 2 }]}
          onPress={() => setShowPassage(true)}
        >
          <Text style={[s.toggleText, { color: showPassage ? COLOR : c.mutedForeground }]}>Đoạn văn</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.toggleBtn, !showPassage && { borderBottomColor: COLOR, borderBottomWidth: 2 }]}
          onPress={() => setShowPassage(false)}
        >
          <Text style={[s.toggleText, { color: !showPassage ? COLOR : c.mutedForeground }]}>
            Câu hỏi ({session.answeredCount}/{questions.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
        {session.result && (
          <View style={[s.resultCard, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" }]}>
            <Text style={[s.resultScore, { color: c.foreground }]}>{session.result.score}/{session.result.total}</Text>
            <Text style={[s.resultSub, { color: c.mutedForeground }]}>câu đúng · {Math.round((session.result.score / session.result.total) * 100)}%</Text>
            <DepthButton variant="secondary" onPress={onBack} style={{ marginTop: spacing.md }}>Về danh sách</DepthButton>
          </View>
        )}

        {showPassage ? (
          <View style={[s.passageCard, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" }]}>
            <Text style={[s.passagePartLabel, { color: COLOR }]}>Part {exercise.part}</Text>
            <Text style={[s.passageTitle, { color: c.foreground }]}>{exercise.title}</Text>
            {exercise.passage.split(/\n\n+/).map((para: string, i: number) => (
              <Text key={i} style={[s.passagePara, { color: c.foreground }]}>{para}</Text>
            ))}
          </View>
        ) : (
          questions.map((q: McqQuestion, qi: number) => {
            const item = session.result?.items.find((it: any) => it.questionId === q.id);
            return (
              <View key={q.id} style={[s.questionCard, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" }]}>
                <Text style={[s.questionNum, { color: COLOR }]}>Câu {qi + 1}</Text>
                <Text style={[s.questionText, { color: c.foreground }]}>{q.question}</Text>
                <View style={s.options}>
                  {q.options.map((opt: string, i: number) => {
                    const isSelected = session.answers[q.id] === i;
                    const isCorrect = !!session.result && item?.correctIndex === i;
                    const isWrong = !!session.result && isSelected && !item?.isCorrect;
                    return (
                      <TouchableOpacity
                        key={i}
                        disabled={!!session.result}
                        onPress={() => session.select(q.id, i)}
                        style={[s.option, {
                          borderColor: isCorrect ? COLOR : isWrong ? "#EA4335" : isSelected ? COLOR : c.border,
                          backgroundColor: isCorrect ? COLOR + "18" : isWrong ? "#FFE6E4" : isSelected ? COLOR + "12" : c.background,
                        }]}
                      >
                        <View style={[s.optionDot, { borderColor: isCorrect ? COLOR : isWrong ? "#EA4335" : isSelected ? COLOR : c.border, backgroundColor: (isSelected || isCorrect) ? COLOR : "transparent" }]}>
                          {(isSelected || isCorrect) && <View style={s.optionDotInner} />}
                        </View>
                        <Text style={[s.optionText, { color: isWrong ? "#EA4335" : isCorrect || isSelected ? COLOR : c.foreground }]}>{opt}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {!!session.result && item?.explanation && (
                  <View style={[s.explanation, { backgroundColor: c.muted }]}>
                    <Text style={[s.explanationText, { color: c.mutedForeground }]}>{item.explanation}</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {!session.result && (
        <View style={[s.footer, { paddingBottom: insets.bottom + spacing.base, borderTopColor: c.borderLight }]}>
          <DepthButton
            fullWidth
            disabled={session.submitting || session.answeredCount < questions.length}
            onPress={session.submit}
            style={{ backgroundColor: COLOR, borderColor: COLOR }}
          >
            {session.submitting ? "Đang nộp..." : `Nộp bài (${session.answeredCount}/${questions.length})`}
          </DepthButton>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  fullCenter: { alignItems: "center", justifyContent: "center", padding: spacing.xl },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.xl, paddingBottom: spacing.md, gap: spacing.md, borderBottomWidth: 1 },
  closeBtn: { padding: 4 },
  topBarTitle: { flex: 1, fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  partChip: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full },
  partChipText: { fontSize: 11, fontFamily: fontFamily.bold },
  progressTrack: { flex: 1, height: 8, borderRadius: radius.full, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: radius.full },
  progressCount: { fontSize: fontSize.xs, fontFamily: fontFamily.bold, minWidth: 32, textAlign: "right" },
  toggleRow: { flexDirection: "row", borderBottomWidth: 1 },
  toggleBtn: { flex: 1, alignItems: "center", paddingVertical: spacing.md },
  toggleText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  scroll: { padding: spacing.xl, gap: spacing.lg },
  previewIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg },
  previewTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold, textAlign: "center" },
  previewDesc: { fontSize: fontSize.sm, textAlign: "center", marginTop: spacing.sm, lineHeight: 20, paddingHorizontal: spacing.xl },
  previewMeta: { fontSize: fontSize.sm, marginTop: spacing.sm },
  resultCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.xl, alignItems: "center" },
  resultScore: { fontSize: fontSize["3xl"], fontFamily: fontFamily.extraBold },
  resultSub: { fontSize: fontSize.sm, marginTop: 4 },
  passageCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  passagePartLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  passageTitle: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
  passagePara: { fontSize: fontSize.sm, lineHeight: 22 },
  questionCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  questionNum: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  questionText: { fontSize: fontSize.base, fontFamily: fontFamily.semiBold, lineHeight: 24 },
  options: { gap: spacing.sm },
  option: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 2, borderRadius: radius.lg, padding: spacing.md },
  optionDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  optionDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
  optionText: { flex: 1, fontSize: fontSize.sm, lineHeight: 20 },
  explanation: { borderRadius: radius.md, padding: spacing.md },
  explanationText: { fontSize: fontSize.xs, lineHeight: 18 },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, borderTopWidth: 1 },
});
