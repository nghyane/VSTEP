import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { HapticTouchable } from "@/components/HapticTouchable";
import { DepthButton } from "@/components/DepthButton";
import { api } from "@/lib/api";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

const COLOR = "#FFC800";
const COLOR_DARK = "#DCAA00";
const COLOR_TEXT = "#A07800";

interface SpeakingResult {
  id: string;
  rubricScores: { fluency: number; pronunciation: number; content: number; vocab: number; grammar: number };
  overallBand: number;
  strengths: string[];
  improvements: { message: string; explanation: string }[];
  pronunciationReport: { accuracyScore: number } | null;
  transcript: string | null;
}

const RUBRIC_LABELS: Record<string, string> = {
  fluency: "Fluency & Coherence",
  pronunciation: "Pronunciation",
  content: "Content & Task Fulfillment",
  vocab: "Lexical Resource",
  grammar: "Grammar Range & Accuracy",
};

export default function SpeakingGradingScreen() {
  const { submissionId } = useLocalSearchParams<{ submissionId: string }>();
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data, isLoading } = useQuery({
    queryKey: ["grading", "speaking", submissionId],
    queryFn: () => api.get<SpeakingResult | null>(`/api/v1/grading/speaking/practice_speaking/${submissionId}`),
    retry: false,
    refetchInterval: (q) => (!q.state.data ? 5000 : false),
  });

  return (
    <View style={[s.root, { backgroundColor: c.background }]}>
      <View style={[s.topBar, { paddingTop: insets.top + spacing.sm, borderBottomColor: c.borderLight }]}>
        <HapticTouchable onPress={() => router.back()} style={s.closeBtn}>
          <Ionicons name="arrow-back" size={22} color={c.foreground} />
        </HapticTouchable>
        <Text style={[s.topBarTitle, { color: c.foreground }]}>Kết quả chấm bài nói</Text>
      </View>

      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        {isLoading && (
          <View style={s.center}><ActivityIndicator color={COLOR} size="large" /></View>
        )}

        {!isLoading && !data && (
          <View style={s.center}>
            <Ionicons name="time-outline" size={48} color={c.subtle} />
            <Text style={[s.pendingTitle, { color: c.foreground }]}>AI đang chấm bài</Text>
            <Text style={[s.pendingSub, { color: c.mutedForeground }]}>Vui lòng quay lại sau ít phút</Text>
            <DepthButton variant="secondary" onPress={() => router.back()} style={{ marginTop: spacing.xl }}>
              Về danh sách
            </DepthButton>
          </View>
        )}

        {data && (
          <>
            {/* Overall score */}
            <View style={[s.scoreCard, { backgroundColor: c.card, borderColor: COLOR + "40", borderBottomColor: COLOR_DARK }]}>
              <Text style={[s.scoreLabel, { color: c.mutedForeground }]}>ĐIỂM TỔNG</Text>
              <Text style={[s.scoreValue, { color: COLOR_TEXT }]}>{data.overallBand.toFixed(1)}</Text>
              <Text style={[s.scoreMax, { color: c.subtle }]}>/ 10</Text>
            </View>

            {/* Pronunciation accuracy */}
            {data.pronunciationReport && data.pronunciationReport.accuracyScore > 0 && (
              <View style={[s.pronCard, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" }]}>
                <View style={[s.pronBadge, { backgroundColor: COLOR + "25" }]}>
                  <Text style={[s.pronScore, { color: COLOR_TEXT }]}>{data.pronunciationReport.accuracyScore}</Text>
                </View>
                <View>
                  <Text style={[s.pronTitle, { color: c.foreground }]}>Pronunciation Accuracy</Text>
                  <Text style={[s.pronSub, { color: c.mutedForeground }]}>Đánh giá từ phân tích âm thanh</Text>
                </View>
              </View>
            )}

            {/* Rubric */}
            <View style={[s.card, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" }]}>
              <Text style={[s.sectionLabel, { color: c.subtle }]}>RUBRIC</Text>
              {Object.entries(data.rubricScores).map(([key, score]) => (
                <RubricRow key={key} label={RUBRIC_LABELS[key] ?? key} score={score} max={4} color={COLOR} c={c} />
              ))}
            </View>

            {/* Strengths */}
            {data.strengths.length > 0 && (
              <View style={[s.card, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" }]}>
                <Text style={[s.sectionLabel, { color: c.subtle }]}>ĐIỂM MẠNH</Text>
                {data.strengths.map((str, i) => (
                  <View key={i} style={s.feedRow}>
                    <Ionicons name="checkmark-circle" size={16} color={COLOR} />
                    <Text style={[s.feedText, { color: c.foreground }]}>{str}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Improvements */}
            {data.improvements.length > 0 && (
              <View style={[s.card, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" }]}>
                <Text style={[s.sectionLabel, { color: c.subtle }]}>CẦN CẢI THIỆN</Text>
                {data.improvements.map((imp, i) => (
                  <View key={i} style={s.impBlock}>
                    <Text style={[s.impMsg, { color: c.foreground }]}>{imp.message}</Text>
                    {imp.explanation && (
                      <Text style={[s.impExp, { color: c.mutedForeground }]}>{imp.explanation}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Transcript */}
            {data.transcript && (
              <View style={[s.card, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" }]}>
                <Text style={[s.sectionLabel, { color: c.subtle }]}>TRANSCRIPT</Text>
                <Text style={[s.transcript, { color: c.foreground }]}>{data.transcript}</Text>
              </View>
            )}

            <DepthButton variant="secondary" fullWidth onPress={() => router.back()}>
              Về danh sách
            </DepthButton>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function RubricRow({ label, score, max, color, c }: { label: string; score: number; max: number; color: string; c: any }) {
  return (
    <View style={s.rubricRow}>
      <Text style={[s.rubricLabel, { color: c.foreground }]}>{label}</Text>
      <View style={s.rubricRight}>
        <View style={[s.rubricTrack, { backgroundColor: c.muted }]}>
          <View style={[s.rubricFill, { backgroundColor: color, width: `${(score / max) * 100}%` as any }]} />
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
  center: { alignItems: "center", justifyContent: "center", paddingVertical: spacing["3xl"], gap: spacing.md },
  pendingTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.bold },
  pendingSub: { fontSize: fontSize.sm, textAlign: "center" },
  scoreCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.xl, alignItems: "center", gap: 4 },
  scoreLabel: { fontSize: 10, fontFamily: fontFamily.bold, letterSpacing: 1 },
  scoreValue: { fontSize: 56, fontFamily: fontFamily.extraBold, lineHeight: 64 },
  scoreMax: { fontSize: fontSize.sm },
  pronCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.lg },
  pronBadge: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  pronScore: { fontSize: fontSize.base, fontFamily: fontFamily.extraBold },
  pronTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  pronSub: { fontSize: fontSize.xs, marginTop: 2 },
  card: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  sectionLabel: { fontSize: 10, fontFamily: fontFamily.bold, letterSpacing: 1 },
  feedRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  feedText: { flex: 1, fontSize: fontSize.sm, lineHeight: 20 },
  impBlock: { gap: 4 },
  impMsg: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  impExp: { fontSize: fontSize.xs, lineHeight: 18 },
  transcript: { fontSize: fontSize.sm, lineHeight: 22 },
  rubricRow: { gap: spacing.xs },
  rubricLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },
  rubricRight: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  rubricTrack: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden" },
  rubricFill: { height: "100%", borderRadius: 4 },
  rubricScore: { fontSize: fontSize.xs, fontFamily: fontFamily.bold, minWidth: 28, textAlign: "right" },
});
