import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AppState, Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";

import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { GameIcon } from "@/components/GameIcon";
import { CourseEnrollSheet } from "@/features/course/CourseEnrollSheet";
import {
  fetchEnrollmentOrders,
  useCancelEnrollmentOrder,
  useCourse,
  useCreateEnrollmentOrder,
} from "@/features/course/queries";
import { useAuth } from "@/hooks/use-auth";
import { getApiErrorMessage } from "@/lib/api";
import { formatDate, formatVnd } from "@/lib/utils";
import { fontSize, fontFamily, radius, spacing, useThemeColors } from "@/theme";

const PENDING_COURSE_ORDER_KEY = "course.pendingEnrollmentOrder";
const DEFAULT_PAYOS_RETURN_URL = "https://vstepgo.com/khoa-hoc";

interface PendingCourseOrder {
  id: string;
  courseId: string;
  profileId: string;
}

export default function CourseDetailScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { data, isLoading } = useCourse(courseId ?? "");
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const createOrder = useCreateEnrollmentOrder();
  const cancelOrder = useCancelEnrollmentOrder();

  const [enrollOpen, setEnrollOpen] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<PendingCourseOrder | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const checkingPaymentRef = useRef(false);

  const setChecking = useCallback((value: boolean) => {
    checkingPaymentRef.current = value;
    setCheckingPayment(value);
  }, []);

  const checkOrderPayment = useCallback(async (orderToCheck: PendingCourseOrder, notifyPending: boolean) => {
    if (checkingPaymentRef.current) return;
    setChecking(true);
    try {
      const orders = await fetchEnrollmentOrders();
      const order = orders.find((item) => item.id === orderToCheck.id);
      if (!order) {
        if (notifyPending) Alert.alert("Không tìm thấy đơn", "Không tìm thấy đơn thanh toán khóa học hiện tại.");
        return;
      }

      if (order.status === "paid") {
        await clearPendingCourseOrder();
        setPendingOrder(null);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["courses"] }),
          queryClient.invalidateQueries({ queryKey: ["courses", courseId] }),
          queryClient.invalidateQueries({ queryKey: ["courses", "enrollment-orders"] }),
        ]);
        Alert.alert("Đăng ký thành công", "Khóa học đã được kích hoạt cho hồ sơ hiện tại.");
        return;
      }

      if (order.status === "failed" || order.status === "cancelled" || order.status === "expired") {
        await clearPendingCourseOrder();
        setPendingOrder(null);
        Alert.alert("Thanh toán chưa hoàn tất", "Giao dịch đã bị hủy, thất bại hoặc hết hạn. Bạn có thể tạo giao dịch mới.");
        return;
      }

      if (notifyPending) {
        Alert.alert("Đang chờ thanh toán", "Hệ thống chưa ghi nhận thanh toán. Nếu bạn vừa thanh toán xong, vui lòng chờ vài giây rồi kiểm tra lại.");
      }
    } catch (error) {
      if (notifyPending) Alert.alert("Chưa kiểm tra được thanh toán", getApiErrorMessage(error));
    } finally {
      setChecking(false);
    }
  }, [courseId, queryClient, setChecking]);

  useEffect(() => {
    let mounted = true;
    loadPendingCourseOrder().then((order) => {
      if (!mounted || !order) return;
      if (profile && order.profileId !== profile.id) {
        void clearPendingCourseOrder();
        return;
      }
      if (courseId && order.courseId === courseId) {
        setPendingOrder(order);
        void checkOrderPayment(order, false);
      }
    }).catch(() => undefined);
    return () => { mounted = false; };
  }, [checkOrderPayment, courseId, profile]);

  useEffect(() => {
    if (!pendingOrder) return;
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") void checkOrderPayment(pendingOrder, false);
    });
    return () => subscription.remove();
  }, [checkOrderPayment, pendingOrder]);

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

  async function handleEnroll(signatureSvg: string) {
    if (!profile || !courseId) {
      Alert.alert("Chưa chọn hồ sơ", "Vui lòng chọn hồ sơ học trước khi đăng ký khóa học.");
      return;
    }
    try {
      const order = await createOrder.mutateAsync({
        courseId,
        commitmentSignature: signatureSvg,
        paymentProvider: "payos",
        returnUrl: createCourseReturnUrl(courseId),
      });
      if (!order.paymentUrl) {
        Alert.alert("Chưa tạo được thanh toán", "Cổng thanh toán chưa trả về đường dẫn thanh toán. Vui lòng thử lại.");
        return;
      }

      const nextPendingOrder = { id: order.id, courseId: order.courseId, profileId: profile.id };
      await savePendingCourseOrder(nextPendingOrder);
      setPendingOrder(nextPendingOrder);
      setEnrollOpen(false);
      await Linking.openURL(order.paymentUrl);
    } catch (error) {
      Alert.alert("Không thể đăng ký", getApiErrorMessage(error));
    }
  }

  async function handleCancelPendingOrder() {
    if (!pendingOrder || cancelOrder.isPending) return;
    try {
      await cancelOrder.mutateAsync(pendingOrder.id);
      await clearPendingCourseOrder();
      setPendingOrder(null);
      Alert.alert("Đã hủy đơn", "Bạn có thể tạo giao dịch thanh toán mới khi sẵn sàng.");
    } catch (error) {
      Alert.alert("Không thể hủy đơn", getApiErrorMessage(error));
    }
  }

  async function openLivestream(url: string | null) {
    if (!url) return;
    const supported = await Linking.canOpenURL(url).catch(() => false);
    if (!supported) {
      Alert.alert("Không mở được liên kết", "Đường dẫn lớp học không hợp lệ.");
      return;
    }
    await Linking.openURL(url);
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
              <DepthButton size="lg" fullWidth onPress={() => { void openLivestream(course.livestreamUrl); }}>
                Vào lớp học
              </DepthButton>
            ) : (
              <Text style={[styles.enrolledMsg, { color: c.success }]}>✓ Bạn đã đăng ký khóa học này</Text>
            )
          ) : (
            <DepthButton
              size="lg"
              fullWidth
              onPress={() => setEnrollOpen(true)}
              disabled={createOrder.isPending || remaining <= 0 || !!pendingOrder}
            >
              {createOrder.isPending ? "Đang xử lý..." : remaining <= 0 ? "Hết chỗ" : `Đăng ký — ${formatVnd(course.priceVnd)}`}
            </DepthButton>
          )}
        </View>
        {!enrolled && pendingOrder ? (
          <View style={[styles.pendingCard, { backgroundColor: c.infoTint, borderColor: c.info }]}>
            <Text style={[styles.pendingTitle, { color: c.foreground }]}>Đã mở cổng thanh toán</Text>
            <Text style={[styles.pendingText, { color: c.subtle }]}>Sau khi thanh toán xong, quay lại app để khóa học được kích hoạt tự động.</Text>
            <View style={styles.pendingActions}>
              <View style={styles.pendingActionItem}>
                <DepthButton variant="info" fullWidth onPress={() => { void checkOrderPayment(pendingOrder, true); }} disabled={checkingPayment}>
                  {checkingPayment ? "Đang kiểm tra..." : "Kiểm tra"}
                </DepthButton>
              </View>
              <View style={styles.pendingActionItem}>
                <DepthButton variant="secondary" fullWidth onPress={handleCancelPendingOrder} disabled={cancelOrder.isPending}>
                  {cancelOrder.isPending ? "Đang hủy..." : "Hủy đơn"}
                </DepthButton>
              </View>
            </View>
          </View>
        ) : null}
        {enrolled && (
          <View style={styles.bookingAction}>
            <DepthButton
              variant="secondary"
              size="lg"
              fullWidth
              onPress={() => router.push(`/(app)/courses/${courseId}/booking` as never)}
            >
              Đặt lịch 1-1 với giảng viên
            </DepthButton>
          </View>
        )}
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
            <View key={item.id} style={[styles.scheduleItem, { borderBottomColor: c.border }]}>
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

      <CourseEnrollSheet
        visible={enrollOpen}
        course={course}
        profile={profile}
        submitting={createOrder.isPending}
        onClose={() => setEnrollOpen(false)}
        onConfirm={handleEnroll}
      />
    </ScrollView>
  );
}

function createCourseReturnUrl(courseId: string): string {
  const configured = process.env.EXPO_PUBLIC_PAYOS_RETURN_URL?.trim();
  if (configured) return configured;
  return `${DEFAULT_PAYOS_RETURN_URL}/${courseId}`;
}

function isPendingCourseOrder(value: unknown): value is PendingCourseOrder {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === "string" && typeof record.courseId === "string" && typeof record.profileId === "string";
}

async function loadPendingCourseOrder(): Promise<PendingCourseOrder | null> {
  const raw = await SecureStore.getItemAsync(PENDING_COURSE_ORDER_KEY);
  if (!raw) return null;
  const parsed = JSON.parse(raw) as unknown;
  return isPendingCourseOrder(parsed) ? parsed : null;
}

async function savePendingCourseOrder(order: PendingCourseOrder): Promise<void> {
  await SecureStore.setItemAsync(PENDING_COURSE_ORDER_KEY, JSON.stringify(order));
}

async function clearPendingCourseOrder(): Promise<void> {
  await SecureStore.deleteItemAsync(PENDING_COURSE_ORDER_KEY);
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
  pendingCard: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm, marginTop: spacing.sm },
  pendingTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.extraBold },
  pendingText: { fontSize: fontSize.xs, fontFamily: fontFamily.medium, lineHeight: 18 },
  pendingActions: { flexDirection: "row", gap: spacing.sm },
  pendingActionItem: { flex: 1 },
  bookingAction: { marginTop: spacing.xs },
  enrolledMsg: { fontSize: fontSize.sm, fontFamily: fontFamily.bold, textAlign: "center" },
  descCard: { padding: spacing.lg, gap: spacing.sm, marginBottom: spacing.base },
  descText: { fontSize: fontSize.sm, lineHeight: 22 },
  sectionTitle: { fontSize: fontSize.base, fontFamily: fontFamily.bold, marginBottom: spacing.sm },
  scheduleCard: { padding: spacing.lg, gap: spacing.sm, marginBottom: spacing.base },
  scheduleItem: { paddingVertical: spacing.sm, borderBottomWidth: 1 },
  scheduleTime: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  timeText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  timeSub: { fontSize: fontSize.xs },
  topicText: { fontSize: fontSize.xs, marginTop: 4 },
  commitCard: { padding: spacing.lg, gap: spacing.sm, marginBottom: spacing.base },
  commitRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.xs },
  commitLabel: { fontSize: fontSize.sm },
  commitValue: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
});
