import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { HapticTouchable } from "@/components/HapticTouchable";
import { DepthButton } from "@/components/DepthButton";
import { MascotEmpty } from "@/components/MascotStates";
import { useSpeakingGradingResult } from "@/hooks/use-practice";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

const COLOR = "#FFC800";
const COLOR_DARK = "#DCAA00";
const COLOR_TEXT = "#A07800";

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
  const { data, isLoading, isError } = useSpeakingGradingResult(submissionId ?? "");

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
          <View style={s.center}>
            <ActivityIndicator color={COLOR} size="large" />
            <Text style={[s.pendingTitle, { color: c.foreground, marginTop: spacing.lg }]}>Đang tải kết quả...</Text>
          </View>
        )}

        {isError && (
          <View style={s.center}>
            <MascotEmpty mascot="think" title="Lỗi kết nối" subtitle="Không thể tải kết quả chấm. Vui lòng thử lại." />
            <DepthButton variant="secondary" onPress={() => router.back()} style={{ marginTop: spacing.xl }}>
              Quay lại
            </DepthButton>
          </View>
        )}

        {!isLoading && !isError && !data && (
          <View style={s.center}>
            <Ionicons name="hourglass-outline" size={56} color={COLOR_TEXT} />
            <Text style={[s.pendingTitle, { color: c.foreground }]}>AI đang chấm bài nói</Text>
            <Text style={[s.pendingSub, { color: c.mutedForeground }]}>Quá trình chấm có thể mất vài phút. Vui lòng đợi...</Text>
            <View style={s.statusBadge}>
              <ActivityIndicator color={COLOR_TEXT} size="small" />
              <Text style={[s.statusText, { color: COLOR_TEXT }]}>Đang xử lý...</Text>
            </View>
            <DepthButton variant="secondary" onPress={() => router.back()} style={{ marginTop: spacing.xl }}>
              Về danh sách
            </DepthButton>
          </View>
        )}

        {data && (
          <>
            <View style={[s.scoreCard, { backgroundColor: c.card, borderColor: COLOR + "50", borderBottomColor: COLOR_DARK }]}> 
              <Text style={[s.scoreLabel, { color: c.mutedForeground }]}>ĐIỂM TỔNG</Text>
              <Text style={[s.scoreValue, { color: COLOR_TEXT }]}>{data.overallBand.toFixed(1)}</Text>
              <Text style={[s.scoreMax, { color: c.subtle }]}>/ 10</Text>
            </View>

            {data.pronunciationReport ? (
              <View style={[s.card, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" }]}> 
                <Text style={[s.sectionLabel, { color: c.subtle }]}>PHÁT ÂM</Text>
                <Text style={[s.pronScore, { color: COLOR_TEXT }]}>{data.pronunciationReport.accuracyScore}%</Text>
                <Text style={[s.pendingSub, { color: c.mutedForeground }]}>Độ chính xác phát âm</Text>
              </View>
            ) : null}

            <View style={[s.card, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" }]}> 
              <Text style={[s.sectionLabel, { color: c.subtle }]}>RUBRIC CHI TIẾT</Text>
              {Object.entries(data.rubricScores).map(([key, score]) => (
                <RubricRow key={key} label={RUBRIC_LABELS[key] ?? key} score={score} max={4} color={COLOR_TEXT} c={c} />
              ))}
            </View>

            {data.transcript ? (
              <View style={[s.card, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" }]}> 
                <Text style={[s.sectionLabel, { color: c.subtle }]}>TRANSCRIPT</Text>
                <Text style={[s.feedText, { color: c.foreground }]}>{data.transcript}</Text>
              </View>
            ) : null}

            {data.strengths.length > 0 && (
              <View style={[s.card, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" }]}> 
                <Text style={[s.sectionLabel, { color: c.subtle }]}>ĐIỂM MẠNH</Text>
                {data.strengths.map((str, i) => (
                  <View key={i} style={s.feedRow}>
                    <Ionicons name="checkmark-circle" size={16} color={COLOR_TEXT} />
                    <Text style={[s.feedText, { color: c.foreground }]}>{str}</Text>
                  </View>
                ))}
              </View>
            )}

            {data.improvements.length > 0 && (
              <View style={[s.card, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: "#CACACA" }]}> 
                <Text style={[s.sectionLabel, { color: c.subtle }]}>CẦN CẢI THIỆN</Text>
                {data.improvements.map((imp, i) => (
                  <View key={i} style={s.impBlock}>
                    <Text style={[s.impMsg, { color: c.foreground }]}>{imp.message}</Text>
                    {imp.explanation ? <Text style={[s.impExp, { color: c.mutedForeground }]}>{imp.explanation}</Text> : null}
                  </View>
                ))}
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

function RubricRow({ label, score, max, color, c }: { label: string; score: number; max: number; color: string; c: { foreground: string; muted: string } }) {
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
  center: { alignItems: "center", justifyContent: "center", paddingVertical: spacing["3xl"], gap: spacing.md },
  pendingTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.bold },
  pendingSub: { fontSize: fontSize.sm, textAlign: "center" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.md },
  statusText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
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
