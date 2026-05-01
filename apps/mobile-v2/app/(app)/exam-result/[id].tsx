import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { DepthButton } from "@/components/DepthButton";
import { GradingErrorState, GradingLoadingState } from "@/components/GradingStates";
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

export default function ExamResultScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id: sessionId } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isError, isFetching, refetch } = useExamSessionResults(sessionId ?? "");
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
        <GradingLoadingState label="Đang tải kết quả bài thi..." accentColor={c.primary} />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={[s.center, { backgroundColor: c.background }]}>
        <GradingErrorState
          title="Không thể tải kết quả"
          subtitle="Kết nối chưa ổn hoặc kết quả chưa sẵn sàng. Thử lại ngay hoặc quay về danh sách đề."
          onRetry={() => void refetch()}
          onBack={() => router.replace("/(app)/(tabs)/exams")}
          retrying={isFetching}
        />
      </View>
    );
  }

  const mcqListening = summarizeMcq(data.mcqDetail, "exam_listening_item");
  const mcqReading = summarizeMcq(data.mcqDetail, "exam_reading_item");
  const mcqTotal = data.mcq?.total ?? (mcqListening.total + mcqReading.total);
  const mcqCorrect = data.mcq?.score ?? (mcqListening.correct + mcqReading.correct);
  const mcqPct = mcqTotal > 0 ? Math.round((mcqCorrect / mcqTotal) * 100) : 0;

  return (
    <ScrollView
      style={[s.root, { backgroundColor: c.background }]}
      contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing["3xl"] }]}
      showsVerticalScrollIndicator={false}
    >
      <HapticTouchable onPress={() => router.replace("/(app)/(tabs)/exams")} style={s.backRow}>
        <Ionicons name="arrow-back" size={20} color={c.foreground} />
        <Text style={[s.backText, { color: c.foreground }]}>Thi thử</Text>
      </HapticTouchable>

      <Text style={[s.title, { color: c.foreground }]}>Kết quả bài thi</Text>

      <View style={[s.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={s.cardHeader}>
          <View style={[s.badge, { backgroundColor: c.primaryTint }]}>
            <Ionicons name="checkmark-circle" size={18} color={c.primary} />
          </View>
          <Text style={[s.cardTitle, { color: c.foreground }]}>Nghe + Đọc</Text>
        </View>
        <Text style={[s.bigScore, { color: c.primary }]}>{mcqCorrect}/{mcqTotal}</Text>
        <View style={[s.bar, { backgroundColor: c.muted }]}>
          <View style={[s.fill, { backgroundColor: c.primary, width: `${mcqPct}%` }]} />
        </View>
        <Text style={[s.note, { color: c.subtle }]}>Câu trả lời đúng</Text>
      </View>

      {mcqListening.total > 0 ? (
        <View style={[s.subCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={s.subCardRow}>
            <Ionicons name="headset" size={16} color={c.skillListening} />
            <Text style={[s.subCardLabel, { color: c.foreground }]}>Nghe</Text>
            <Text style={[s.subCardValue, { color: c.mutedForeground }]}>{mcqListening.correct}/{mcqListening.total}</Text>
          </View>
        </View>
      ) : null}

      {mcqReading.total > 0 ? (
        <View style={[s.subCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={s.subCardRow}>
            <Ionicons name="book" size={16} color={c.skillReading} />
            <Text style={[s.subCardLabel, { color: c.foreground }]}>Đọc</Text>
            <Text style={[s.subCardValue, { color: c.mutedForeground }]}>{mcqReading.correct}/{mcqReading.total}</Text>
          </View>
        </View>
      ) : null}

      {data.writingFeedback.length > 0 ? (
        <GradingCard skill="writing" label="Viết" icon="create" status={gradingStatus.writing} data={data.writingFeedback} />
      ) : null}

      {data.speakingFeedback.length > 0 ? (
        <GradingCard skill="speaking" label="Nói" icon="mic" status={gradingStatus.speaking} data={data.speakingFeedback} />
      ) : null}

      <DepthButton fullWidth onPress={() => router.replace("/(app)/(tabs)/exams")} style={{ marginTop: spacing.xl }}>
        Về danh sách đề thi
      </DepthButton>
    </ScrollView>
  );
}

type McqDetailItem = NonNullable<ReturnType<typeof useExamSessionResults>["data"]>["mcqDetail"] extends (infer T)[] | null ? T : never;

function summarizeMcq(items: McqDetailItem[] | null | undefined, itemRefType: string) {
  const scoped = items?.filter((item) => item.itemRefType === itemRefType) ?? [];
  return {
    correct: scoped.filter((item) => item.isCorrect).length,
    total: scoped.length,
  };
}

function GradingCard({
  skill,
  label,
  icon,
  status,
  data,
}: {
  skill: "writing" | "speaking";
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  status: string;
  data: { submissionId: string; overallBand: number | null }[];
}) {
  const c = useThemeColors();
  const router = useRouter();
  const statusColor = status === "pending"
    ? c.warning
    : status === "processing"
      ? c.info
      : status === "completed"
        ? c.success
        : status === "failed"
          ? c.destructive
          : c.subtle;
  const color = skill === "speaking" && status === "completed" ? c.coinDark : statusColor;
  const tint = `${color}20`;
  const labelStatus = GRADING_LABEL[status] ?? status;
  const completedItems = data.filter((item) => item.overallBand != null);
  const pendingCount = data.length - completedItems.length;

  return (
    <View style={[s.card, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={s.cardHeader}>
        <View style={[s.badge, { backgroundColor: tint }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <Text style={[s.cardTitle, { color: c.foreground }]}>{label}</Text>
        <View style={[s.statusPill, { backgroundColor: tint }]}>
          <Text style={[s.statusText, { color }]}>{labelStatus}</Text>
        </View>
      </View>

      {completedItems.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          {completedItems.map((item) => (
            <HapticTouchable
              key={item.submissionId}
              onPress={() => router.push(`/(app)/grading/${skill}/${item.submissionId}` as never)}
              style={[s.resultRow, { borderColor: c.border }]}
            >
              <Text style={[s.resultRowLabel, { color: c.foreground }]}>Bài {item.submissionId.slice(0, 8)}</Text>
              <Text style={[s.resultRowBand, { color }]}>{item.overallBand}</Text>
            </HapticTouchable>
          ))}
        </View>
      ) : null}

      {pendingCount > 0 ? (
        <View style={[s.pendingStrip, { backgroundColor: c.surfaceTint, borderColor: c.borderLight }]}>
          <ActivityIndicator color={color} size="small" />
          <Text style={[s.pendingStripText, { color: c.mutedForeground }]}>
            {pendingCount} bài đang chấm, màn này sẽ tự cập nhật.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl },
  scroll: { paddingHorizontal: spacing.xl, gap: spacing.lg },
  backRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  backText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  title: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold, textAlign: "center" },
  card: { borderWidth: 2, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  badge: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  cardTitle: { flex: 1, fontSize: fontSize.base, fontFamily: fontFamily.bold },
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
  pendingStrip: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderWidth: 1, borderRadius: radius.lg, padding: spacing.md },
  pendingStripText: { flex: 1, fontSize: fontSize.xs, lineHeight: 18 },
});
