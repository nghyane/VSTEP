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
import { McqQuestionCard } from "@/components/McqQuestionCard";
import { McqResultCard } from "@/components/McqResultCard";
import { SubmitFooter } from "@/components/SubmitFooter";
import { PassageWordView } from "@/components/PassageWordView";
import {
  useReadingExerciseDetail, useMcqSession,
  startReadingSession, submitReadingSession,
} from "@/hooks/use-practice";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";
import type { McqQuestion } from "@/hooks/use-practice";

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
  const [wordTapMode, setWordTapMode] = useState(false);

  return (
    <View style={[s.root, { backgroundColor: c.background }]}>
      {/* Focus header */}
      <FocusHeader
        current={session.answeredCount}
        total={questions.length}
        accentColor={COLOR}
        onClose={onBack}
        c={c}
        topInset={insets.top}
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
            <View style={s.passageHeader}>
              <Text style={[s.passageTitle, { color: COLOR }]}>Part {exercise.part} · {exercise.title}</Text>
              <HapticTouchable onPress={() => setWordTapMode(!wordTapMode)} style={s.wtapToggle}>
                <Text style={[s.wtapBtn, {
                  color: wordTapMode ? "#FFF" : c.subtle,
                  backgroundColor: wordTapMode ? COLOR : "transparent",
                  borderColor: wordTapMode ? COLOR : c.muted,
                }]}>Từ điển</Text>
              </HapticTouchable>
            </View>
            <PassageWordView
              passage={exercise.passage}
              wordTapMode={wordTapMode}
              accentColor={COLOR}
              c={c}
            />
          </View>
        )}

        {/* Result — mirrors FE v3 ReadingInProgress celebration card */}
        {session.result && (
          <McqResultCard result={session.result} accentColor={COLOR} onBack={onBack} />
        )}

        {/* Questions — McqQuestionCard mirrors FE v3 QuestionList */}
        {!showPassage && questions.map((q: McqQuestion, qi: number) => (
          <McqQuestionCard
            key={q.id}
            question={q}
            index={qi}
            selected={session.answers[q.id] ?? null}
            onSelect={(idx: number) => session.select(q.id, idx)}
            result={session.result}
            accentColor={COLOR}
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
  passageHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  passageTitle: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
  wtapToggle: { padding: spacing.xs },
  wtapBtn: {
    fontSize: 10,
    fontFamily: fontFamily.extraBold,
    borderWidth: 2,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: "hidden",
  },
  footer: { backgroundColor: "#FFFFFF" },
});
