import { StyleSheet, Text, View } from "react-native";
import { BouncyScrollView } from "@/components/BouncyScrollView";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { ErrorScreen } from "@/components/ErrorScreen";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SkillIcon, SKILL_LABELS } from "@/components/SkillIcon";
import { useSubmission } from "@/hooks/use-submissions";
import { useThemeColors, spacing, radius, fontSize } from "@/theme";
import type { SubmissionStatus } from "@/types/api";

const statusConfig: Record<SubmissionStatus, { label: string }> = {
  pending: { label: "Đang chờ" },
  processing: { label: "Đang xử lý" },
  completed: { label: "Hoàn thành" },
  review_pending: { label: "Chờ chấm" },
  failed: { label: "Lỗi" },
};

export default function SubmissionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useThemeColors();
  const { data, isLoading, error } = useSubmission(id!);

  if (isLoading) return <LoadingScreen />;
  if (error || !data) return <ErrorScreen message={error?.message ?? "Không tìm thấy bài nộp"} />;

  const status = statusConfig[data.status];

  return (
    <BouncyScrollView style={[styles.container, { backgroundColor: c.background }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={styles.headerRow}>
          <SkillIcon skill={data.skill} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.skillName, { color: c.foreground }]}>{SKILL_LABELS[data.skill]}</Text>
            {data.band && (
              <View style={[styles.bandBadge, { borderColor: c.border }]}>
                <Text style={{ color: c.foreground, fontSize: fontSize.xs, fontWeight: "600" }}>{data.band}</Text>
              </View>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: c.muted }]}>
            <Text style={{ color: c.mutedForeground, fontSize: fontSize.xs, fontWeight: "600" }}>{status.label}</Text>
          </View>
        </View>
      </View>

      {/* Score */}
      <View style={[styles.scoreBox, { backgroundColor: c.muted }]}>
        {data.score != null ? (
          <Text style={[styles.scoreBig, { color: c.foreground }]}>{data.score}/10</Text>
        ) : (
          <Text style={{ color: c.mutedForeground, fontSize: fontSize.lg }}>Đang chấm</Text>
        )}
      </View>

      {/* Dates */}
      <View style={styles.dateRow}>
        <Ionicons name="time-outline" size={16} color={c.mutedForeground} />
        <Text style={{ color: c.mutedForeground, fontSize: fontSize.sm }}>
          Nộp: {new Date(data.createdAt).toLocaleString("vi-VN")}
        </Text>
      </View>
      {(data as any).completedAt && (
        <View style={styles.dateRow}>
          <Ionicons name="checkmark-circle-outline" size={16} color={c.mutedForeground} />
          <Text style={{ color: c.mutedForeground, fontSize: fontSize.sm }}>
            Hoàn thành: {new Date((data as any).completedAt).toLocaleString("vi-VN")}
          </Text>
        </View>
      )}

      {/* Feedback */}
      {data.feedback && (
        <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Nhận xét</Text>
          <Text style={{ color: c.foreground, fontSize: fontSize.sm, lineHeight: 22 }}>{data.feedback}</Text>
        </View>
      )}

      {/* Answer */}
      {data.answer && (
        <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Câu trả lời đã nộp</Text>
          {data.answer && typeof data.answer === "object" && "text" in (data.answer as Record<string, unknown>) ? (
            <Text style={{ color: c.foreground, fontSize: fontSize.sm, lineHeight: 22 }}>{String((data.answer as any).text)}</Text>
          ) : data.answer && typeof data.answer === "object" && "audioUrl" in (data.answer as Record<string, unknown>) ? (
            <Text style={{ color: c.mutedForeground, fontSize: fontSize.sm }}>Audio: {(data.answer as any).durationSeconds}s</Text>
          ) : data.answer && typeof data.answer === "object" && "answers" in (data.answer as Record<string, unknown>) ? (
            <View style={{ gap: spacing.xs }}>
              {Object.entries((data.answer as any).answers).map(([key, val]: [string, any]) => (
                <Text key={key} style={{ color: c.foreground, fontSize: fontSize.sm }}>
                  <Text style={{ fontWeight: "600" }}>{key}:</Text> {String(val)}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      )}
    </BouncyScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.base, paddingBottom: spacing["3xl"] },
  card: { borderWidth: 1, borderRadius: radius.xl, padding: spacing.base },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  skillName: { fontWeight: "600", fontSize: fontSize.base },
  bandBadge: { borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2, alignSelf: "flex-start", marginTop: 4 },
  statusBadge: { borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  scoreBox: { borderRadius: radius.xl, padding: spacing.xl, alignItems: "center" },
  scoreBig: { fontSize: fontSize["3xl"], fontWeight: "800", fontVariant: ["tabular-nums"] },
  dateRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  section: { borderWidth: 1, borderRadius: radius.xl, padding: spacing.base, gap: spacing.sm },
  sectionTitle: { fontWeight: "700", fontSize: fontSize.base },
});
