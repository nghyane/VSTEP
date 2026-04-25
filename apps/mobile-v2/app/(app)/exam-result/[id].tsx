import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { DepthButton } from "@/components/DepthButton";
import { HapticTouchable } from "@/components/HapticTouchable";
import { MascotEmpty } from "@/components/MascotStates";
import { useExamSessionResults, useGradingStatus } from "@/hooks/use-exam-results";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

const GRADING_LABEL: Record<string, string> = {
  pending: "Đang chờ chấm",
  processing: "AI đang chấm",
  completed: "Đã chấm xong",
  failed: "Lỗi chấm bài",
};

const GRADING_COLOR: Record<string, string> = {
  pending: "#FF9B00",
  processing: "#1CB0F6",
  completed: "#58CC02",
  failed: "#EA4335",
};

export default function ExamResultScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id: sessionId } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading, isError } = useExamSessionResults(sessionId ?? "");
  const gradingStatus = useGradingStatus(sessionId ?? "");

  if (!sessionId) {
    return (
      <View style={[s.center, { backgroundColor: c.background }]}>
        <MascotEmpty mascot="think" title="Không tìm thấy phiên thi" subtitle="" />
        <DepthButton fullWidth onPress={() => router.replace("/(app)/(tabs)/exams")} style={{ marginTop: spacing.xl }}>
          Về danh sách đề thi
        </DepthButton>
      </View>
    );
  }

  if (isLoading && !data) {
    return (
      <View style={[s.center, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.primary} size="large" />
        <Text style={[s.loadingText, { color: c.mutedForeground }]}>Đang tải kết quả...</Text>
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={[s.center, { backgroundColor: c.background }]}>
        <MascotEmpty mascot="sad" title="Không thể tải kết quả" subtitle="Vui lòng thử lại sau." />
        <DepthButton fullWidth onPress={() => router.replace("/(app)/(tabs)/exams")} style={{ marginTop: spacing.xl }}>
          Về danh sách đề thi
        </DepthButton>
      </View>
    );
  }

  const mcqListening = data.mcqDetail?.listening;
  const mcqReading = data.mcqDetail?.reading;
  const mcqTotal = (mcqListening?.total ?? 0) + (mcqReading?.total ?? 0);
  const mcqCorrect = (mcqListening?.correct ?? 0) + (mcqReading?.correct ?? 0);
  const mcqPct = mcqTotal > 0 ? Math.round((mcqCorrect / mcqTotal) * 100) : 0;

  return (
    <ScrollView style={[s.root, { backgroundColor: c.background }]} contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing["3xl"] }]}>
      {/* Header */}
      <HapticTouchable onPress={() => router.replace("/(app)/(tabs)/exams")} style={s.backRow}>
        <Ionicons name="arrow-back" size={20} color={c.foreground} />
        <Text style={[s.backText, { color: c.foreground }]}>Thi thử</Text>
      </HapticTouchable>

      <Text style={[s.title, { color: c.foreground }]}>Kết quả bài thi</Text>

      {/* MCQ Score Card */}
      <View style={[s.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={s.cardHeader}>
          <View style={[s.badge, { backgroundColor: c.primaryTint }]}>
            <Ionicons name="checkmark-circle" size={18} color={c.primary} />
          </View>
          <Text style={[s.cardTitle, { color: c.foreground }]}>Nghe + Đọc</Text>
        </View>
        <Text style={[s.bigScore, { color: c.primary }]}>{mcqCorrect}/{mcqTotal}</Text>
        <View style={[s.bar, { backgroundColor: c.muted }]}>
          <View style={[s.fill, { backgroundColor: c.primary, width: `${mcqPct}%` as any }]} />
        </View>
        <Text style={[s.note, { color: c.subtle }]}>Câu trả lời đúng</Text>
      </View>

      {/* Listening breakdown */}
      {mcqListening != null && (
        <View style={[s.subCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={s.subCardRow}>
            <Ionicons name="headset" size={16} color={c.skillListening} />
            <Text style={[s.subCardLabel, { color: c.foreground }]}>Nghe</Text>
            <Text style={[s.subCardValue, { color: c.mutedForeground }]}>{mcqListening.correct}/{mcqListening.total}</Text>
          </View>
        </View>
      )}

      {/* Reading breakdown */}
      {mcqReading != null && (
        <View style={[s.subCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={s.subCardRow}>
            <Ionicons name="book" size={16} color={c.skillReading} />
            <Text style={[s.subCardLabel, { color: c.foreground }]}>Đọc</Text>
            <Text style={[s.subCardValue, { color: c.mutedForeground }]}>{mcqReading.correct}/{mcqReading.total}</Text>
          </View>
        </View>
      )}

      {/* Writing grading status */}
      {data.writingFeedback.length > 0 && (
        <GradingCard label="Viết" icon="create" status={gradingStatus.writing} data={data.writingFeedback} c={c} />
      )}

      {/* Speaking grading status */}
      {data.speakingFeedback.length > 0 && (
        <GradingCard label="Nói" icon="mic" status={gradingStatus.speaking} data={data.speakingFeedback} c={c} />
      )}

      <DepthButton fullWidth onPress={() => router.replace("/(app)/(tabs)/exams")} style={{ marginTop: spacing.xl }}>
        Về danh sách đề thi
      </DepthButton>
    </ScrollView>
  );
}

// ── Grading Status Card ──

function GradingCard({ label, icon, status, data, c }: { label: string; icon: string; status: string; data: { submissionId: string; overallBand: number | null }[]; c: ReturnType<typeof useThemeColors> }) {
  const color = GRADING_COLOR[status] ?? c.subtle;
  const tint = `${color}20`;
  const labelStatus = GRADING_LABEL[status] ?? status;
  const router = useRouter();

  const allDone = data.every((d) => d.overallBand != null);
  const anyDone = data.some((d) => d.overallBand != null);

  return (
    <View style={[s.card, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={s.cardHeader}>
        <View style={[s.badge, { backgroundColor: tint }]}>
          <Ionicons name={icon as any} size={18} color={color} />
        </View>
        <Text style={[s.cardTitle, { color: c.foreground }]}>{label}</Text>
        <View style={[s.statusPill, { backgroundColor: tint }]}>
          <Text style={[s.statusText, { color }]}>{labelStatus}</Text>
        </View>
      </View>

      {allDone && anyDone && (
        <View style={{ gap: spacing.sm }}>
          {data.map((item) => (
            <HapticTouchable key={item.submissionId} onPress={() => router.push(`/grading/${label.toLowerCase()}/${item.submissionId}` as any)} style={[s.resultRow, { borderColor: c.border }]}>
              <Text style={[s.resultRowLabel, { color: c.foreground }]}>Bài {item.submissionId.slice(0, 8)}</Text>
              <Text style={[s.resultRowBand, { color }]}>{item.overallBand}</Text>
            </HapticTouchable>
          ))}
        </View>
      )}

      {!anyDone && (
        <Text style={[s.note, { color: c.subtle }]}>
          {status === "processing" ? "AI đang chấm bài..." : "Bài chờ chấm điểm"}
        </Text>
      )}
    </View>
  );
}

// ── Styles ──

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: spacing.xl, gap: spacing.lg },
  backRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  backText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  title: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold, textAlign: "center" },
  loadingText: { fontSize: fontSize.sm, marginTop: spacing.md, fontFamily: fontFamily.medium },
  card: { borderWidth: 2, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  badge: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
  bigScore: { fontSize: 48, fontFamily: fontFamily.extraBold, textAlign: "center" },
  bar: { width: "100%", height: 8, borderRadius: 4, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 4 },
  note: { fontSize: fontSize.xs, textAlign: "center" },
  subCard: { borderWidth: 2, borderRadius: radius.lg, padding: spacing.md },
  subCardRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  subCardLabel: { flex: 1, fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  subCardValue: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  statusPill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  statusText: { fontSize: 10, fontFamily: fontFamily.bold },
  resultRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.sm, borderBottomWidth: 1 },
  resultRowLabel: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  resultRowBand: { fontSize: fontSize.base, fontFamily: fontFamily.extraBold },
});
