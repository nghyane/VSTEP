import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { AIFeedbackPanel } from "@/components/AIFeedbackPanel";
import { DepthButton } from "@/components/DepthButton";
import { GradingErrorState, GradingLoadingState, GradingPendingState } from "@/components/GradingStates";
import { HapticTouchable } from "@/components/HapticTouchable";
import { TeacherGradingPanel } from "@/components/TeacherGradingPanel";
import { requestTeacherGrading, requestWritingFeedback, useSpeakingGradingResult } from "@/hooks/use-practice";
import { getApiErrorMessage } from "@/lib/api";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

const RUBRIC_LABELS: Record<string, string> = {
  fluency: "Fluency & Coherence",
  pronunciation: "Pronunciation",
  content: "Content & Task Fulfillment",
  vocabulary: "Lexical Resource",
  vocab: "Lexical Resource",
  grammar: "Grammar Range & Accuracy",
  discourseManagement: "Discourse Management",
  discourse_management: "Discourse Management",
};

export default function SpeakingGradingScreen() {
  const { submissionId, attemptId, source } = useLocalSearchParams<{ submissionId: string; attemptId?: string; source?: string }>();
  const c = useThemeColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const gradingId = attemptId ?? submissionId ?? "";
  const gradingSource = attemptId || source === "attempt" ? "attempt" : "submission";
  const { data, isLoading, isError, isFetching, refetch } = useSpeakingGradingResult(gradingId, gradingSource);
  const accent = c.skillSpeaking;
  const accentText = c.coinDark;
  const resultReady = data?.overallBand != null;
  const teacherGrading = useMutation({
    mutationFn: () => requestTeacherGrading(data?.attemptId ?? ""),
    onSuccess: () => {
      if (data?.attemptId) queryClient.invalidateQueries({ queryKey: ["assessment-attempts"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      void refetch();
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: () => requestWritingFeedback(data?.attemptId ?? ""),
    onSuccess: () => {
      if (data?.attemptId) queryClient.invalidateQueries({ queryKey: ["assessment-attempts"] });
      void refetch();
    },
  });

  const feedbackGenerated = feedbackMutation.data?.feedback ?? null;

  return (
    <View style={[s.root, { backgroundColor: c.background }]}>
      <View style={[s.topBar, { paddingTop: insets.top + spacing.sm, borderBottomColor: c.borderLight }]}>
        <HapticTouchable onPress={() => router.back()} style={s.closeBtn}>
          <Ionicons name="arrow-back" size={22} color={c.foreground} />
        </HapticTouchable>
        <Text style={[s.topBarTitle, { color: c.foreground }]}>Kết quả chấm bài nói</Text>
      </View>

      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        {isLoading && !data ? (
          <GradingLoadingState label="Đang tải kết quả chấm bài nói..." accentColor={accent} />
        ) : null}

        {isError ? (
          <GradingErrorState
            title="Lỗi kết nối"
            subtitle="Không thể tải kết quả chấm bài nói. Thử lại ngay hoặc quay về danh sách."
            onRetry={() => void refetch()}
            onBack={() => router.back()}
            retrying={isFetching}
          />
        ) : null}

        {!isLoading && !isError && !resultReady ? (
          <GradingPendingState
            title="Hệ thống đang chấm bài nói"
            subtitle="Kết quả sẽ tự cập nhật vài giây một lần. Transcript và phát âm sẽ hiện khi chấm xong."
            accentColor={accentText}
            onBack={() => router.back()}
          />
        ) : null}

        {data && resultReady ? (
          <>
            <View style={[s.scoreCard, { backgroundColor: c.card, borderColor: c.coinTint, borderBottomColor: accentText }]}>
              <Text style={[s.scoreLabel, { color: c.mutedForeground }]}>ĐIỂM TỔNG</Text>
              <Text style={[s.scoreValue, { color: accentText }]}>{(data.overallBand ?? 0).toFixed(1)}</Text>
              <Text style={[s.scoreMax, { color: c.subtle }]}>/ 10</Text>
            </View>

            {data.pronunciationReport ? (
              <View style={[s.card, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: c.border }]}>
                <Text style={[s.sectionLabel, { color: c.subtle }]}>PHÁT ÂM</Text>
                <Text style={[s.pronScore, { color: accentText }]}>{data.pronunciationReport.accuracyScore}%</Text>
                <Text style={[s.pendingSub, { color: c.mutedForeground }]}>Độ chính xác phát âm</Text>
              </View>
            ) : null}

            <View style={[s.card, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: c.border }]}>
              <Text style={[s.sectionLabel, { color: c.subtle }]}>RUBRIC CHI TIẾT</Text>
              {data.criterionScores.map((criterion) => (
                <RubricRow
                  key={criterion.key}
                  label={RUBRIC_LABELS[criterion.key] ?? criterion.key}
                  score={criterion.score}
                  max={10}
                  color={accentText}
                />
              ))}
            </View>

            {data.strengths.length > 0 ? (
              <View style={[s.card, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: c.border }]}>
                <Text style={[s.sectionLabel, { color: c.subtle }]}>ĐIỂM MẠNH</Text>
                {data.strengths.map((item) => (
                  <View key={item} style={s.feedRow}>
                    <Ionicons name="checkmark-circle" size={16} color={accentText} />
                    <Text style={[s.feedText, { color: c.foreground }]}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {data.improvements.length > 0 ? (
              <View style={[s.card, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: c.border }]}>
                <Text style={[s.sectionLabel, { color: c.subtle }]}>CẦN CẢI THIỆN</Text>
                {data.improvements.map((item) => (
                  <View key={`${item.message}-${item.explanation}`} style={s.impBlock}>
                    <Text style={[s.impMsg, { color: c.foreground }]}>{item.message}</Text>
                    {item.explanation ? <Text style={[s.impExp, { color: c.mutedForeground }]}>{item.explanation}</Text> : null}
                  </View>
                ))}
              </View>
            ) : null}

            {data.transcript ? (
              <View style={[s.card, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: c.border }]}>
                <Text style={[s.sectionLabel, { color: c.subtle }]}>TRANSCRIPT</Text>
                <Text style={[s.feedText, { color: c.foreground }]}>{data.transcript}</Text>
              </View>
            ) : null}

            <AIFeedbackPanel
              attemptId={data.attemptId}
              feedbackRequest={data.feedbackRequest}
              feedbackBase={data.feedback}
              feedbackGenerated={feedbackGenerated}
              pending={feedbackMutation.isPending}
              error={feedbackMutation.error ? getApiErrorMessage(feedbackMutation.error) : null}
              accentColor={accentText}
              onRequest={() => feedbackMutation.mutate()}
              hasBaseFeedback={data.hasDetailedFeedback}
            />

            <TeacherGradingPanel
              attemptId={data.attemptId}
              state={data.teacherGradingRequest}
              pending={teacherGrading.isPending}
              error={teacherGrading.error ? getApiErrorMessage(teacherGrading.error) : null}
              accentColor={accentText}
              onRequest={() => teacherGrading.mutate()}
            />

            <DepthButton variant="secondary" fullWidth onPress={() => router.back()}>
              Về danh sách
            </DepthButton>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function RubricRow({ label, score, max, color }: { label: string; score: number; max: number; color: string }) {
  const c = useThemeColors();
  const pct = score / max;
  return (
    <View style={s.rubricRow}>
      <Text style={[s.rubricLabel, { color: c.foreground }]}>{label}</Text>
      <View style={s.rubricRight}>
        <View style={[s.rubricTrack, { backgroundColor: c.muted }]}>
          <View style={[s.rubricFill, { backgroundColor: color, width: `${pct * 100}%` }]} />
        </View>
        <Text style={[s.rubricScore, { color }]}>{score}/{max}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.xl, paddingBottom: spacing.md, gap: spacing.md, borderBottomWidth: 1 },
  closeBtn: { padding: 4 },
  topBarTitle: { flex: 1, fontSize: fontSize.base, fontFamily: fontFamily.bold },
  scroll: { padding: spacing.xl, gap: spacing.lg },
  pendingSub: { fontSize: fontSize.sm, textAlign: "center" },
  scoreCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.xl, alignItems: "center", gap: 4 },
  scoreLabel: { fontSize: 10, fontFamily: fontFamily.bold, letterSpacing: 1 },
  scoreValue: { fontSize: 56, fontFamily: fontFamily.extraBold, lineHeight: 64 },
  scoreMax: { fontSize: fontSize.sm },
  card: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  sectionLabel: { fontSize: 10, fontFamily: fontFamily.bold, letterSpacing: 1 },
  pronScore: { fontSize: 36, fontFamily: fontFamily.extraBold, textAlign: "center" },
  feedRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  feedText: { flex: 1, fontSize: fontSize.sm, lineHeight: 20 },
  impBlock: { gap: 4 },
  impMsg: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  impExp: { fontSize: fontSize.xs, lineHeight: 18 },
  rubricRow: { gap: spacing.xs },
  rubricLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },
  rubricRight: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  rubricTrack: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden" },
  rubricFill: { height: "100%", borderRadius: 4 },
  rubricScore: { fontSize: fontSize.xs, fontFamily: fontFamily.bold, minWidth: 28, textAlign: "right" },
});
