import { StyleSheet, Text, View } from "react-native";
import { BouncyFlatList } from "@/components/BouncyScrollView";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { HapticTouchable } from "@/components/HapticTouchable";
import { EmptyState } from "@/components/EmptyState";
import { ErrorScreen } from "@/components/ErrorScreen";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SkillIcon, SKILL_LABELS } from "@/components/SkillIcon";
import { useSubmissions } from "@/hooks/use-submissions";
import { useThemeColors, spacing, radius, fontSize } from "@/theme";
import type { Submission, SubmissionStatus } from "@/types/api";

const statusConfig: Record<SubmissionStatus, { label: string; color: "muted" | "success" | "destructive" }> = {
  pending: { label: "Đang chờ", color: "muted" },
  processing: { label: "Đang xử lý", color: "muted" },
  completed: { label: "Hoàn thành", color: "success" },
  review_pending: { label: "Chờ chấm", color: "muted" },
  failed: { label: "Lỗi", color: "destructive" },
};

export default function SubmissionsScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useSubmissions();

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error.message} onRetry={refetch} />;

  const submissions = data?.data ?? [];

  return (
    <ScreenWrapper>
      <BouncyFlatList
        data={submissions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.title, { color: c.foreground }]}>Lịch sử bài nộp</Text>
            <Text style={[styles.subtitle, { color: c.mutedForeground }]}>Xem lại các bài làm và kết quả</Text>
          </View>
        }
        ListEmptyComponent={<EmptyState title="Chưa có bài nộp nào" subtitle="Hãy làm bài thi đầu tiên!" />}
        renderItem={({ item }) => {
          const status = statusConfig[item.status];
          const statusColor = status.color === "success" ? c.success : status.color === "destructive" ? c.destructive : c.mutedForeground;
          return (
            <HapticTouchable
              style={[styles.row, { backgroundColor: c.card, borderColor: c.border }]}
              onPress={() => router.push(`/(app)/submissions/${item.id}`)}
            >
              <SkillIcon skill={item.skill} />
              <View style={styles.rowInfo}>
                <Text style={[styles.rowTitle, { color: c.foreground }]}>{SKILL_LABELS[item.skill]}</Text>
                <Text style={{ color: c.mutedForeground, fontSize: fontSize.xs }}>
                  {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                </Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={[styles.score, { color: item.status === "completed" ? c.foreground : c.mutedForeground }]}>
                  {item.score != null ? `${item.score}/10` : "—"}
                </Text>
                <Text style={{ color: statusColor, fontSize: fontSize.xs, fontWeight: "600" }}>{status.label}</Text>
              </View>
            </HapticTouchable>
          );
        }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.xl, gap: spacing.sm, paddingBottom: spacing["3xl"], flexGrow: 1 },
  header: { marginBottom: spacing.md, paddingTop: spacing.sm },
  title: { fontSize: fontSize["2xl"], fontWeight: "700" },
  subtitle: { fontSize: fontSize.sm, marginTop: spacing.xs },
  row: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: radius.xl, padding: spacing.md, gap: spacing.md, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  rowInfo: { flex: 1 },
  rowTitle: { fontWeight: "600", fontSize: fontSize.sm },
  rowRight: { alignItems: "flex-end" },
  score: { fontWeight: "700", fontSize: fontSize.base, fontVariant: ["tabular-nums"] },
});
