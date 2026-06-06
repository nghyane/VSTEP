import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { DepthButton } from "@/components/DepthButton";
import type { TeacherGradingRequestState, TeacherGradingRequestStatus, TeacherGradingResultState } from "@/hooks/use-practice";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

export function TeacherGradingPanel({
  attemptId,
  state,
  pending,
  error,
  accentColor,
  onRequest,
}: {
  attemptId: string | null;
  state: TeacherGradingRequestState | null;
  pending: boolean;
  error: string | null;
  accentColor: string;
  onRequest: () => void;
}) {
  const c = useThemeColors();
  const status = state?.status ?? "none";
  const result = state?.teacherResult ?? null;
  const requested = state?.requested === true || status !== "none";
  const teacherGraded = result !== null || status === "completed";
  const canRequest = attemptId !== null && state?.canRequest === true;

  if (!attemptId || (!canRequest && !result)) return null;

  return (
    <View style={[s.card, { backgroundColor: c.card, borderColor: c.border, borderLeftColor: accentColor }]}>
      <View style={s.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[s.overline, { color: c.subtle }]}>TEACHER REVIEW</Text>
          <Text style={[s.title, { color: c.foreground }]}>{teacherGraded ? "Giáo viên đã chấm" : "Yêu cầu giáo viên chấm"}</Text>
          <Text style={[s.description, { color: c.mutedForeground }]}>{teacherGradingText(status, result !== null, requested)}</Text>
        </View>
        <Text style={[s.badge, { backgroundColor: c.infoTint, color: c.info }]}>{teacherGradingLabel(status, teacherGraded, requested)}</Text>
      </View>

      {state?.assignedTeacher ? (
        <View style={[s.assigned, { backgroundColor: c.surfaceTint }]}>
          <Ionicons name="person-circle" size={16} color={accentColor} />
          <Text style={[s.assignedText, { color: c.mutedForeground }]}>Giáo viên: <Text style={{ color: c.foreground }}>{state.assignedTeacher.fullName ?? state.assignedTeacher.email ?? "Đã gán"}</Text></Text>
        </View>
      ) : null}

      {result ? <TeacherResultSummary result={result} accentColor={accentColor} /> : null}

      {!teacherGraded && !requested ? (
        <DepthButton variant="secondary" fullWidth onPress={onRequest} disabled={pending}>
          {pending ? "Đang gửi..." : "Gửi yêu cầu"}
        </DepthButton>
      ) : null}

      {error ? <Text style={[s.error, { color: c.destructive }]}>{error}</Text> : null}
    </View>
  );
}

function TeacherResultSummary({ result, accentColor }: { result: TeacherGradingResultState; accentColor: string }) {
  const c = useThemeColors();
  const strengths = normalizeStrengths(result.feedback?.strengths);
  const improvements = normalizeImprovements(result.feedback?.improvements);

  return (
    <View style={[s.resultBox, { backgroundColor: c.surfaceTint }]}>
      <View style={s.resultHeader}>
        <View>
          <Text style={[s.overline, { color: c.subtle }]}>ĐIỂM GIÁO VIÊN</Text>
          <Text style={[s.teacherScore, { color: accentColor }]}>{result.overallBand.toFixed(1)}</Text>
        </View>
        <Text style={[s.badge, { backgroundColor: c.infoTint, color: c.info }]}>Giáo viên</Text>
      </View>
      {strengths.length > 0 ? <FeedbackLines title="Điểm mạnh" items={strengths} color={c.primary} /> : null}
      {improvements.length > 0 ? <FeedbackLines title="Cần cải thiện" items={improvements} color={c.warning} /> : null}
    </View>
  );
}

function FeedbackLines({ title, items, color }: { title: string; items: string[]; color: string }) {
  const c = useThemeColors();
  return (
    <View style={s.feedbackBlock}>
      <Text style={[s.feedbackTitle, { color }]}>{title.toUpperCase()}</Text>
      {items.map((item) => (
        <Text key={item} style={[s.feedbackText, { color: c.foreground }]}>• {item}</Text>
      ))}
    </View>
  );
}

function teacherGradingLabel(status: TeacherGradingRequestStatus, teacherGraded: boolean, requested: boolean): string {
  if (teacherGraded) return "Đã chấm";
  switch (status) {
    case "pending_assignment": return "Chờ gán";
    case "assigned": return "Đã gán";
    case "in_progress": return "Đang chấm";
    case "rejected": return "Từ chối";
    case "cancelled": return "Đã hủy";
    default: return requested ? "Đã gửi" : "Chưa gửi";
  }
}

function teacherGradingText(status: TeacherGradingRequestStatus, hasTeacherResult: boolean, requested: boolean): string {
  if (hasTeacherResult) return "Điểm giáo viên hiển thị riêng với điểm AI phía trên.";
  switch (status) {
    case "pending_assignment": return "Yêu cầu đã gửi. Staff sẽ kiểm tra và gán giáo viên phù hợp.";
    case "assigned": return "Yêu cầu đã được gán cho giáo viên. Bạn sẽ nhận thông báo khi có kết quả.";
    case "in_progress": return "Giáo viên đang chấm bài. Bạn sẽ nhận thông báo khi hoàn tất.";
    case "rejected": return "Yêu cầu chưa được duyệt. Vui lòng liên hệ trung tâm nếu cần hỗ trợ.";
    case "cancelled": return "Yêu cầu đã được hủy.";
    default: return requested ? "Yêu cầu đã gửi. Staff sẽ kiểm tra và gán giáo viên phù hợp." : "Gửi bài cho staff để gán giáo viên chấm thủ công.";
  }
}

function normalizeStrengths(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) => (typeof item === "string" ? item : textMessage(item))).filter((item) => item.length > 0);
}

function normalizeImprovements(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) => (typeof item === "string" ? item : textMessage(item))).filter((item) => item.length > 0);
}

function textMessage(item: unknown): string {
  if (item && typeof item === "object" && "message" in item) {
    const message = (item as { message?: unknown }).message;
    return typeof message === "string" ? message : "";
  }
  return "";
}

const s = StyleSheet.create({
  card: { borderWidth: 2, borderLeftWidth: 4, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  headerRow: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  overline: { fontSize: 10, fontFamily: fontFamily.bold, letterSpacing: 1 },
  title: { fontSize: fontSize.base, fontFamily: fontFamily.extraBold, marginTop: 2 },
  description: { fontSize: fontSize.xs, lineHeight: 18, marginTop: spacing.xs },
  badge: { overflow: "hidden", borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 4, fontSize: 10, fontFamily: fontFamily.extraBold, textTransform: "uppercase" },
  assigned: { flexDirection: "row", alignItems: "center", gap: spacing.xs, borderRadius: radius.lg, padding: spacing.sm },
  assignedText: { flex: 1, fontSize: fontSize.xs, fontFamily: fontFamily.medium },
  resultBox: { borderRadius: radius.lg, padding: spacing.md, gap: spacing.md },
  resultHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md },
  teacherScore: { fontSize: 36, lineHeight: 42, fontFamily: fontFamily.extraBold },
  feedbackBlock: { gap: spacing.xs },
  feedbackTitle: { fontSize: 10, fontFamily: fontFamily.bold, letterSpacing: 0.8 },
  feedbackText: { fontSize: fontSize.xs, lineHeight: 18 },
  error: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
});
