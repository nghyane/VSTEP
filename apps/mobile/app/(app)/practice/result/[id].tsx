import { StyleSheet, Text, View } from "react-native";
import { ActivityIndicator } from "react-native";
import { BouncyScrollView } from "@/components/BouncyScrollView";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { HapticTouchable } from "@/components/HapticTouchable";
import { useQuery } from "@tanstack/react-query";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { ErrorScreen } from "@/components/ErrorScreen";
import { SkillIcon, SKILL_LABELS } from "@/components/SkillIcon";
import { useThemeColors, spacing, radius, fontSize } from "@/theme";
import type { Submission, SubmissionStatus } from "@/types/api";

const statusConfig: Record<SubmissionStatus, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  pending: { label: "Đang chờ", icon: "time-outline" },
  processing: { label: "Đang chấm bài...", icon: "hourglass-outline" },
  completed: { label: "Hoàn thành", icon: "checkmark-circle" },
  review_pending: { label: "Chờ duyệt", icon: "eye-outline" },
  failed: { label: "Lỗi", icon: "alert-circle-outline" },
};

export default function PracticeResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useThemeColors();
  const router = useRouter();

  const { data, isLoading, error } = useQuery({
    queryKey: ["submissions", id],
    queryFn: () => (Promise.resolve({} as any)),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "pending" || status === "processing" ? 3000 : false;
    },
  });

  if (isLoading) {
    return (
      <ScreenWrapper noPadding>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  if (error || !data) {
    return <ErrorScreen message={error?.message ?? "Không tìm thấy kết quả"} />;
  }

  const isGrading = data.status === "pending" || data.status === "processing";
  const status = statusConfig[data.status];

  return (
    <ScreenWrapper noPadding>
      <BouncyScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={styles.headerRow}>
            <SkillIcon skill={data.skill} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.skillName, { color: c.foreground }]}>
                {SKILL_LABELS[data.skill]}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: c.muted }]}>
              <Ionicons name={status.icon} size={14} color={c.mutedForeground} />
              <Text style={{ color: c.mutedForeground, fontSize: fontSize.xs, fontWeight: "600" }}>
                {status.label}
              </Text>
            </View>
          </View>
        </View>

        {/* Score */}
        <View style={[styles.scoreBox, { backgroundColor: c.muted }]}>
          {isGrading && (
            <View style={styles.gradingContainer}>
              <ActivityIndicator size="large" color={c.primary} />
              <Text style={[styles.gradingText, { color: c.mutedForeground }]}>
                Đang chấm bài...
              </Text>
              <Text style={[styles.gradingHint, { color: c.mutedForeground }]}>
                Kết quả sẽ tự động cập nhật
              </Text>
            </View>
          )}
          {!isGrading && data.score != null && (
            <>
              <Text style={[styles.scoreBig, { color: c.foreground }]}>{String(data.score)}/10</Text>
              {data.band != null && (
                <View style={[styles.bandBadge, { borderColor: c.primary }]}>
                  <Text style={{ color: c.primary, fontSize: fontSize.base, fontWeight: "700" }}>
                    {String(data.band)}
                  </Text>
                </View>
              )}
            </>
          )}
          {!isGrading && data.score == null && (
            <Text style={{ color: c.mutedForeground, fontSize: fontSize.lg }}>Chưa có điểm</Text>
          )}
        </View>

        {/* Feedback */}
        {data.feedback && (
          <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[styles.sectionTitle, { color: c.foreground }]}>Nhận xét</Text>
            <Text style={{ color: c.foreground, fontSize: fontSize.sm, lineHeight: 22 }}>
              {data.feedback}
            </Text>
          </View>
        )}

        {/* Result details */}
        {data.result != null && typeof data.result === "object" && Object.keys(data.result as Record<string, unknown>).length > 0 ? (
          <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[styles.sectionTitle, { color: c.foreground }]}>Chi tiết kết quả</Text>
            {Object.entries(data.result as Record<string, unknown>).map(([key, value]) => (
              <View key={key} style={styles.resultRow}>
                <Text style={[styles.resultKey, { color: c.mutedForeground }]}>{key}</Text>
                <Text style={[styles.resultValue, { color: c.foreground }]}>
                  {String(value)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Actions */}
        <View style={styles.actions}>
          <HapticTouchable
            style={[styles.primaryBtn, { backgroundColor: c.primary }]}
            onPress={() => router.replace("/(app)/practice")}
          >
            <Ionicons name="refresh" size={18} color={c.primaryForeground} />
            <Text style={[styles.btnText, { color: c.primaryForeground }]}>
              Tiếp tục luyện tập
            </Text>
          </HapticTouchable>

          <HapticTouchable
            style={[styles.outlineBtn, { borderColor: c.border }]}
            onPress={() => router.push(`/(app)/submissions/${id}`)}
          >
            <Ionicons name="document-text-outline" size={18} color={c.foreground} />
            <Text style={[styles.btnText, { color: c.foreground }]}>Xem chi tiết</Text>
          </HapticTouchable>
        </View>
      </BouncyScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.base, paddingBottom: spacing["3xl"] },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: { borderWidth: 1, borderRadius: radius.xl, padding: spacing.base },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  skillName: { fontWeight: "600", fontSize: fontSize.base },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  scoreBox: { borderRadius: radius.xl, padding: spacing.xl, alignItems: "center", gap: spacing.md },
  scoreBig: { fontSize: fontSize["3xl"], fontWeight: "800", fontVariant: ["tabular-nums"] },
  bandBadge: {
    borderWidth: 2,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  gradingContainer: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.base },
  gradingText: { fontSize: fontSize.lg, fontWeight: "600" },
  gradingHint: { fontSize: fontSize.xs },
  section: { borderWidth: 1, borderRadius: radius.xl, padding: spacing.base, gap: spacing.sm },
  sectionTitle: { fontWeight: "700", fontSize: fontSize.base },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  resultKey: { fontSize: fontSize.sm, textTransform: "capitalize" },
  resultValue: { fontSize: fontSize.sm, fontWeight: "600" },
  actions: { gap: spacing.md, marginTop: spacing.sm },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  outlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  btnText: { fontSize: fontSize.sm, fontWeight: "600" },
});
