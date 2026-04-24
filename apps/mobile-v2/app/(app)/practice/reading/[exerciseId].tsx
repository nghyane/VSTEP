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
import { FocusHeader } from "@/components/FocusHeader";
import { SubmitFooter } from "@/components/SubmitFooter";
import { SupportPanel } from "@/components/SupportPanel";
import {
  useReadingExerciseDetail, useMcqSession,
  startReadingSession, submitReadingSession,
} from "@/hooks/use-practice";
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
      <PreviewScreen
        detail={detail}
        starting={startMutation.isPending}
        onStart={() => startMutation.mutate()}
        onBack={() => router.back()}
        insets={insets}
        c={c}
      />
    );
  }

  return (
    <InProgressScreen
      detail={detail}
      sessionId={sessionId}
      onBack={() => router.back()}
      insets={insets}
      c={c}
    />
  );
}

function PreviewScreen({ detail, starting, onStart, onBack, insets, c }: any) {
  const { exercise, questions } = detail;
  return (
    <View style={[s.root, { backgroundColor: c.background }]}>
      <View style={[s.topBar, { paddingTop: insets.top + spacing.sm, borderBottomColor: c.borderLight }]}>
        <HapticTouchable onPress={onBack} style={s.closeBtn}>
          <Ionicons name="arrow-back" size={22} color={c.foreground} />
        </HapticTouchable>
        <Text style={[s.topBarTitle, { color: c.foreground }]} numberOfLines={1}>{exercise.title}</Text>
        <View style={[s.partChip, { backgroundColor: COLOR + "18" }]}>
          <Text style={[s.partChipText, { color: COLOR }]}>Part {exercise.part}</Text>
        </View>
      </View>
      <View style={[s.fullCenter, { flex: 1 }]}>
        <View style={[s.previewIcon, { backgroundColor: COLOR + "18" }]}>
          <Ionicons name="book-outline" size={40} color={COLOR} />
        </View>
        <Text style={[s.previewTitle, { color: c.foreground }]}>{exercise.title}</Text>
        {exercise.description && (
          <Text style={[s.previewDesc, { color: c.mutedForeground }]}>{exercise.description}</Text>
        )}
        <Text style={[s.previewMeta, { color: c.subtle }]}>{questions.length} câu hỏi</Text>
        <DepthButton
          onPress={onStart}
          disabled={starting}
          style={{ marginTop: spacing.xl, minWidth: 200, backgroundColor: COLOR, borderColor: COLOR }}
        >
          {starting ? "Đang bắt đầu..." : "Bắt đầu làm bài"}
        </DepthButton>
      </View>
    </View>
  );
}

function InProgressScreen({ detail, sessionId, onBack, insets, c }: any) {
  const { exercise, questions } = detail;
  const session = useMcqSession(sessionId, submitReadingSession, "reading");
  const [showPassage, setShowPassage] = useState(true);
  const hasTranslation = !!exercise.vietnameseTranslation;

  return (
    <View style={[s.root, { backgroundColor: c.background }]}>
      {/* Focus header */}
      <FocusHeader
        current={session.answeredCount}
        total={questions.length}
        accentColor={COLOR}
        onClose={onBack}
        c={c}
      />

      {/* Passage toggle */}
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
          <Text style={[s.toggleText, { color: !showPassage ? COLOR : c.mutedForeground }]}>Câu hỏi</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[s.panelScroll, { paddingBottom: insets.bottom + 80 }]}>
        {/* Passage card */}
        {showPassage && (
          <View style={[s.passageCard, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" }]}>
            <Text style={[s.passageTitle, { color: COLOR }]}>Part {exercise.part} · {exercise.title}</Text>
            {exercise.passage.split(/\n\n+/).map((para: string, i: number) => (
              <Text key={i} style={[s.passagePara, { color: c.foreground }]}>{para}</Text>
            ))}
            {hasTranslation && (
              <View style={s.translationWrap}>
                <Ionicons name="chatbubble-ellipses-outline" size={14} color={COLOR} />
                <Text style={[s.translationText, { color: c.mutedForeground }]}>{exercise.vietnameseTranslation}</Text>
              </View>
            )}
          </View>
        )}

        {/* Result */}
        {session.result && (
          <ResultCard result={session.result} onBack={onBack} c={c} />
        )}

        {/* Support panel */}
        {!session.result && (
          <SupportPanel
            skill="reading"
            sessionId={sessionId}
            hasTranscript={hasTranslation}
            hasKeywords={(exercise.keywords ?? []).length > 0}
            accentColor={COLOR}
          />
        )}

        {/* Questions */}
        {!showPassage && questions.map((q: McqQuestion, qi: number) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={qi}
            selected={session.answers[q.id] ?? null}
            onSelect={(idx: number) => session.select(q.id, idx)}
            result={session.result}
            color={COLOR}
            c={c}
          />
        ))}
      </ScrollView>

      {/* Submit footer */}
      {!session.result && (
        <View style={[s.footer, { borderTopColor: c.borderLight }]}>
          <SubmitFooter
            answeredCount={session.answeredCount}
            total={questions.length}
            submitting={session.submitting}
            accentColor={COLOR}
            onSubmit={() => session.submit()}
            c={c}
          />
        </View>
      )}
    </View>
  );
}

function ResultCard({ result, onBack, c }: { result: SubmitResult; onBack: () => void; c: any }) {
  const pct = Math.round((result.score / result.total) * 100);
  return (
    <View style={[s.resultCard, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" }]}>
      <Text style={[s.resultScore, { color: c.foreground }]}>{result.score}/{result.total}</Text>
      <Text style={[s.resultPct, { color: c.mutedForeground }]}>{pct}% đúng</Text>
      <DepthButton
        onPress={onBack}
        style={{ marginTop: spacing.md, backgroundColor: COLOR, borderColor: COLOR }}
      >
        Về danh sách
      </DepthButton>
    </View>
  );
}

function QuestionCard({ question, index, selected, onSelect, result, color, c }: any) {
  const itemResult = result?.items.find((i: any) => i.questionId === question.id);
  const isCorrect = itemResult?.isCorrect;
  const hasResult = !!result;

  return (
    <View style={[s.questionCard, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" }]}>
      <Text style={[s.questionLabel, { color: color }]}>Câu {index + 1}</Text>
      <Text style={[s.questionText, { color: c.foreground }]}>{question.question}</Text>
      {question.options.map((opt: string, oi: number) => {
        const isSelected = selected === oi;
        let borderColor = c.border;
        let bgColor = c.surface;
        let textColor = c.foreground;

        if (hasResult) {
          if (oi === itemResult?.correctIndex) {
            borderColor = "#58CC02";
            bgColor = "#E6F8D4";
            textColor = "#478700";
          } else if (isSelected && !isCorrect) {
            borderColor = "#EA4335";
            bgColor = "#FFE6E4";
            textColor = "#C03B2F";
          }
        } else if (isSelected) {
          borderColor = color;
          bgColor = color + "18";
          textColor = color;
        }

        return (
          <HapticTouchable
            key={oi}
            onPress={() => !hasResult && onSelect(oi)}
            disabled={hasResult}
            style={[s.option, { borderColor, backgroundColor: bgColor }]}
          >
            <Text style={[s.optionText, { color: textColor }]}>{opt}</Text>
            {hasResult && oi === itemResult?.correctIndex && (
              <Ionicons name="checkmark-circle" size={18} color="#58CC02" />
            )}
          </HapticTouchable>
        );
      })}
      {hasResult && itemResult?.explanation && (
        <Text style={[s.explanation, { color: c.mutedForeground }]}>{itemResult.explanation}</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  fullCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  topBar: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm },
  closeBtn: { padding: spacing.xs },
  topBarTitle: { fontSize: fontSize.base, fontFamily: fontFamily.bold, flex: 1 },
  partChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  partChipText: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  previewIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: spacing.xl },
  previewTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold, textAlign: "center" },
  previewDesc: { fontSize: fontSize.sm, textAlign: "center", marginTop: spacing.xs },
  previewMeta: { fontSize: fontSize.xs, marginTop: spacing.xs, marginBottom: spacing.xl },
  toggleRow: { flexDirection: "row", borderBottomWidth: 2, paddingHorizontal: spacing.xl },
  toggleBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: "center" },
  toggleText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  panelScroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.md },
  passageCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm },
  passageTitle: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
  passagePara: { fontSize: fontSize.sm, lineHeight: 22 },
  translationWrap: { flexDirection: "row", alignItems: "flex-start", gap: spacing.xs, marginTop: spacing.sm, padding: spacing.sm, backgroundColor: "#F7F6F3", borderRadius: radius.md },
  translationText: { flex: 1, fontSize: fontSize.xs, lineHeight: 18, fontStyle: "italic" },
  resultCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.xl, alignItems: "center", gap: spacing.xs },
  resultScore: { fontSize: fontSize["3xl"], fontFamily: fontFamily.extraBold },
  resultPct: { fontSize: fontSize.sm },
  questionCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm },
  questionLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  questionText: { fontSize: fontSize.base, fontFamily: fontFamily.bold, lineHeight: 22 },
  option: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  optionText: { flex: 1, fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  explanation: { fontSize: fontSize.xs, fontFamily: fontFamily.medium, lineHeight: 18, marginTop: spacing.xs, paddingHorizontal: spacing.sm },
  footer: { backgroundColor: "#FFFFFF" },
});
