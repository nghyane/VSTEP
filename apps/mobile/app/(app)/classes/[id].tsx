import { Alert, StyleSheet, Text, View } from "react-native";
import { BouncyFlatList } from "@/components/BouncyScrollView";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { HapticTouchable } from "@/components/HapticTouchable";
import { ErrorScreen } from "@/components/ErrorScreen";
import { LoadingScreen } from "@/components/LoadingScreen";
import { EmptyState } from "@/components/EmptyState";
import { SKILL_LABELS } from "@/components/SkillIcon";
import { useClassDetail, useClassFeedback, useLeaveClass } from "@/hooks/use-classes";
import { useThemeColors, spacing, radius, fontSize } from "@/theme";
import type { ClassFeedback, Skill } from "@/types/api";

export default function ClassDetailScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: classData, isLoading, error, refetch } = useClassDetail(id!);
  const feedback = useClassFeedback(id!);
  const leaveClass = useLeaveClass();

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error.message} onRetry={refetch} />;
  if (!classData) return <ErrorScreen message="Không tìm thấy lớp học" />;

  const feedbackItems = feedback.data?.data ?? [];

  const handleLeave = () => {
    Alert.alert("Rời lớp", `Bạn có chắc muốn rời khỏi lớp "${classData.name}"?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Rời lớp",
        style: "destructive",
        onPress: async () => {
          try {
            await leaveClass.mutateAsync(id!);
            router.back();
          } catch {
            Alert.alert("Lỗi", "Không thể rời lớp. Vui lòng thử lại.");
          }
        },
      },
    ]);
  };

  const renderFeedback = ({ item }: { item: ClassFeedback }) => (
    <View style={[styles.feedbackCard, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={styles.feedbackHeader}>
        <Ionicons name="person-circle" size={20} color={c.mutedForeground} />
        <Text style={[styles.feedbackName, { color: c.foreground }]}>
          {(item as any).fromUser?.fullName ?? (item as any).fromUser?.email ?? "Giảng viên"}
        </Text>
        {(item as any).skill && (
          <View style={[styles.skillTag, { backgroundColor: c.primary + "20" }]}>
            <Text style={[styles.skillTagText, { color: c.primary }]}>
              {SKILL_LABELS[(item as any).skill as Skill]}
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.feedbackContent, { color: c.foreground }]}>{item.content}</Text>
      <Text style={[styles.feedbackDate, { color: c.mutedForeground }]}>
        {new Date(item.createdAt).toLocaleDateString("vi-VN")}
      </Text>
    </View>
  );

  return (
    <ScreenWrapper noPadding>
      <BouncyFlatList
        data={feedbackItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            {/* Class info */}
            <View style={[styles.infoCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[styles.className, { color: c.foreground }]}>{classData.name}</Text>
              {classData.description ? (
                <Text style={[styles.classDesc, { color: c.mutedForeground }]}>
                  {classData.description}
                </Text>
              ) : null}
              {classData.members && (
                <View style={styles.memberRow}>
                  <Ionicons name="people" size={14} color={c.mutedForeground} />
                  <Text style={[styles.memberCount, { color: c.mutedForeground }]}>
                    {classData.members.length} thành viên
                  </Text>
                </View>
              )}
            </View>

            <Text style={[styles.sectionTitle, { color: c.foreground }]}>Phản hồi từ giảng viên</Text>
          </View>
        }
        ListEmptyComponent={
          feedback.isLoading ? (
            <LoadingScreen />
          ) : (
            <EmptyState
              icon="chatbubble-ellipses-outline"
              title="Chưa có phản hồi"
              subtitle="Phản hồi từ giảng viên sẽ hiện ở đây"
            />
          )
        }
        renderItem={renderFeedback}
        ListFooterComponent={
          <HapticTouchable
            style={[styles.leaveBtn, { borderColor: c.destructive }]}
            onPress={handleLeave}
            disabled={leaveClass.isPending}
          >
            <Ionicons name="log-out-outline" size={18} color={c.destructive} />
            <Text style={[styles.leaveBtnText, { color: c.destructive }]}>Rời lớp</Text>
          </HapticTouchable>
        }
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.xl, paddingBottom: spacing["3xl"], flexGrow: 1 },
  infoCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.base,
    marginBottom: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  className: { fontSize: fontSize.xl, fontWeight: "700" },
  classDesc: { fontSize: fontSize.sm, marginTop: spacing.sm },
  memberRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.sm },
  memberCount: { fontSize: fontSize.xs },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: "700", marginBottom: spacing.md },
  feedbackCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  feedbackHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  feedbackName: { fontSize: fontSize.sm, fontWeight: "600", flex: 1 },
  skillTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.md,
  },
  skillTagText: { fontSize: fontSize.xs, fontWeight: "600" },
  feedbackContent: { fontSize: fontSize.sm, lineHeight: 20 },
  feedbackDate: { fontSize: fontSize.xs, marginTop: spacing.sm },
  leaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.xl,
  },
  leaveBtnText: { fontSize: fontSize.sm, fontWeight: "600" },
});
