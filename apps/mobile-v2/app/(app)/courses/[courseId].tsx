import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { GameIcon } from "@/components/GameIcon";
import {
  useConfirmEnrollmentOrder,
  useCourse,
  useCreateEnrollmentOrder,
} from "@/features/course/queries";
import { useWalletBalance } from "@/features/wallet/queries";
import { fontSize, fontFamily, radius, spacing, useThemeColors } from "@/theme";

export default function CourseDetailScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { data, isLoading } = useCourse(courseId ?? "");
  const { data: balanceData } = useWalletBalance();
  const createOrder = useCreateEnrollmentOrder();
  const confirmOrder = useConfirmEnrollmentOrder();

  const [enrolling, setEnrolling] = useState(false);

  if (!courseId) {
    return (
      <View style={[styles.root, { backgroundColor: c.background }]}>
        <Text style={[styles.errorText, { color: c.subtle }]}>Không tìm thấy khóa học</Text>
      </View>
    );
  }

  if (isLoading || !data) {
    return (
      <View style={[styles.root, { backgroundColor: c.background }]}>
        <Text style={[styles.loadingText, { color: c.subtle }]}>Đang tải...</Text>
      </View>
    );
  }

  const { course, soldSlots, commitment } = data;
  const enrolled = commitment !== null && commitment.phase !== "not_enrolled";
  const remaining = course.maxSlots - soldSlots;
  const balance = balanceData?.balance ?? 0;

  async function handleEnroll() {
    if (enrolling) return;
    setEnrolling(true);
    try {
      const order = await createOrder.mutateAsync(courseId);
      if (order) {
        await confirmOrder.mutateAsync(order.id);
        Alert.alert("Thành công", "Bạn đã đăng ký khóa học thành công!");
        router.back();
      }
    } catch {
      if (balance < course.priceVnd) {
        Alert.alert(
          "Số dư không đủ",
          `Bạn cần ${formatVnd(course.priceVnd)} để đăng ký. Số dư hiện tại: ${balance.toLocaleString("vi-VN")} xu.`,
          [
            { text: "Hủy", style: "cancel" },
            { text: "Nạp xu", onPress: () => router.push("/(app)/topup" as any) },
          ],
        );
      } else {
        Alert.alert("Lỗi", "Không thể đăng ký khóa học. Vui lòng thử lại.");
      }
    } finally {
      setEnrolling(false);
    }
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: c.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing["3xl"] }]}
    >
      <View style={styles.header}>
        <DepthButton variant="secondary" size="sm" onPress={() => router.back()}>
          ← Quay lại
        </DepthButton>
      </View>

      <DepthCard style={styles.mainCard}>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: c.border }]}>
            <Text style={[styles.badgeText, { color: c.foreground }]}>{course.targetLevel}</Text>
          </View>
          {enrolled && (
            <View style={[styles.badge, { backgroundColor: c.primaryTint }]}>
              <Text style={[styles.badgeText, { color: c.primaryDark }]}>Đã đăng ký</Text>
            </View>
          )}
          {!enrolled && remaining <= 5 && remaining > 0 && (
            <View style={[styles.badge, { backgroundColor: c.warningTint }]}>
              <Text style={[styles.badgeText, { color: c.warning }]}>Còn {remaining} chỗ</Text>
            </View>
          )}
        </View>

        <Text style={[styles.courseTitle, { color: c.foreground }]}>{course.title}</Text>
        {course.targetExamSchool && (
          <Text style={[styles.schoolText, { color: c.subtle }]}>{course.targetExamSchool}</Text>
        )}

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <GameIcon name="calendar" size={16} />
            <Text style={[styles.metaText, { color: c.mutedForeground }]}>
              {formatDate(course.startDate)} — {formatDate(course.endDate)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <GameIcon name="users" size={16} />
            <Text style={[styles.metaText, { color: c.mutedForeground }]}>
              {soldSlots}/{course.maxSlots} học viên
            </Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          {enrolled ? (
            course.livestreamUrl ? (
              <DepthButton size="lg" fullWidth onPress={() => {}}>
                Vào lớp học
              </DepthButton>
            ) : (
              <Text style={[styles.enrolledMsg, { color: c.success }]}>✓ Bạn đã đăng ký khóa học này</Text>
            )
          ) : (
            <DepthButton
              size="lg"
              fullWidth
              onPress={handleEnroll}
              disabled={enrolling || remaining <= 0}
            >
              {enrolling ? "Đang xử lý..." : remaining <= 0 ? "Hết chỗ" : `Đăng ký — ${formatVnd(course.priceVnd)}`}
            </DepthButton>
          )}
        </View>
      </DepthCard>

      {course.description && (
        <DepthCard style={styles.descCard}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Mô tả</Text>
          <Text style={[styles.descText, { color: c.mutedForeground }]}>{course.description}</Text>
        </DepthCard>
      )}

      {course.scheduleItems.length > 0 && (
        <DepthCard style={styles.scheduleCard}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Lịch học</Text>
          {course.scheduleItems.map((item: { id: string; sessionNumber: number; date: string; startTime: string; endTime: string; topic: string }) => (
            <View key={item.id} style={styles.scheduleItem}>
              <View style={styles.scheduleTime}>
                <Text style={[styles.timeText, { color: c.foreground }]}>Buổi {item.sessionNumber}</Text>
                <Text style={[styles.timeSub, { color: c.subtle }]}>
                  {formatDate(item.date)} · {item.startTime} - {item.endTime}
                </Text>
              </View>
              <Text style={[styles.topicText, { color: c.mutedForeground }]}>{item.topic}</Text>
            </View>
          ))}
        </DepthCard>
      )}

      {commitment && commitment.phase !== "not_enrolled" && (
        <DepthCard style={styles.commitCard}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Tiến độ cam kết</Text>
          <View style={styles.commitRow}>
            <Text style={[styles.commitLabel, { color: c.subtle }]}>Trạng thái</Text>
            <Text style={[styles.commitValue, { color: c.foreground }]}>
              {commitment.phase === "met" ? "✓ Đã hoàn thành" : "Đang tiến hành"}
            </Text>
          </View>
          <View style={styles.commitRow}>
            <Text style={[styles.commitLabel, { color: c.subtle }]}>Buổi đã học</Text>
            <Text style={[styles.commitValue, { color: c.foreground }]}>
              {commitment.completed}/{commitment.required}
            </Text>
          </View>
        </DepthCard>
      )}
    </ScrollView>
  );
}

function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.xl },
  header: { marginBottom: spacing.base },
  loadingText: { fontSize: fontSize.sm, textAlign: "center", marginTop: spacing["3xl"] },
  errorText: { fontSize: fontSize.sm, textAlign: "center", marginTop: spacing["3xl"] },
  mainCard: { padding: spacing.lg, gap: spacing.md, marginBottom: spacing.base },
  badgeRow: { flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full },
  badgeText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  courseTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold },
  schoolText: { fontSize: fontSize.sm, marginTop: 2 },
  metaRow: { flexDirection: "row", gap: spacing.lg, flexWrap: "wrap", marginTop: spacing.xs },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: fontSize.xs, fontFamily: fontFamily.medium },
  actionRow: { marginTop: spacing.md },
  enrolledMsg: { fontSize: fontSize.sm, fontFamily: fontFamily.bold, textAlign: "center" },
  descCard: { padding: spacing.lg, gap: spacing.sm, marginBottom: spacing.base },
  descText: { fontSize: fontSize.sm, lineHeight: 22 },
  sectionTitle: { fontSize: fontSize.base, fontFamily: fontFamily.bold, marginBottom: spacing.sm },
  scheduleCard: { padding: spacing.lg, gap: spacing.sm, marginBottom: spacing.base },
  scheduleItem: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: "#E5E5E5" },
  scheduleTime: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  timeText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  timeSub: { fontSize: fontSize.xs },
  topicText: { fontSize: fontSize.xs, marginTop: 4 },
  commitCard: { padding: spacing.lg, gap: spacing.sm, marginBottom: spacing.base },
  commitRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.xs },
  commitLabel: { fontSize: fontSize.sm },
  commitValue: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
});
