import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AppState, Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";

import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { GameIcon } from "@/components/GameIcon";
import { HapticTouchable } from "@/components/HapticTouchable";
import { CourseEnrollSheet } from "@/features/course/CourseEnrollSheet";
import type { CommitmentStatus, CourseScheduleItem, CourseTeacher, EnrollmentOrder } from "@/features/course/types";
import {
  fetchEnrollmentOrders,
  reportEnrollmentPaymentReturn,
  useCancelEnrollmentOrder,
  useCourse,
  useCreateEnrollmentOrder,
} from "@/features/course/queries";
import { useAuth } from "@/hooks/use-auth";
import { getApiErrorMessage } from "@/lib/api";
import { formatDate, formatVnd, getInitials } from "@/lib/utils";
import { fontSize, fontFamily, radius, spacing, useThemeColors } from "@/theme";

const PENDING_COURSE_ORDER_KEY = "course.pendingEnrollmentOrder";
const DEFAULT_PAYOS_RETURN_URL = "https://vstepgo.com/wallet";
const COURSE_COMMITMENTS = [
  "Tỉ lệ đạt trên 98% với học viên học đúng lộ trình.",
  "Miễn phí học lại nếu chưa đạt mục tiêu sau khóa.",
  "Giảng viên dạy sát định dạng đề và tiêu chí chấm điểm VSTEP.",
] as const;

interface PendingCourseOrder {
  id: string;
  courseId: string;
  profileId: string;
  orderCode?: number | null;
  providerRef?: string | null;
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
      let order = orders.find((item) => item.id === orderToCheck.id);
      if (!order) {
        if (notifyPending) Alert.alert("Không tìm thấy đơn", "Không tìm thấy đơn thanh toán khóa học hiện tại.");
        return;
      }

      if (order.status === "pending") {
        for (const paymentReturnId of getPaymentReturnIds(orderToCheck, order)) {
          const checkedOrder = await reportEnrollmentPaymentReturn(paymentReturnId).catch(() => null);
          if (checkedOrder) order = checkedOrder;
          if (order.status !== "pending") break;
        }
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
        returnUrl: createCourseReturnUrl(),
        cancelUrl: createCourseReturnUrl(),
      });
      if (!order.paymentUrl) {
        Alert.alert("Chưa tạo được thanh toán", "Cổng thanh toán chưa trả về đường dẫn thanh toán. Vui lòng thử lại.");
        return;
      }

      const nextPendingOrder = {
        id: order.id,
        courseId: order.courseId,
        profileId: profile.id,
        orderCode: order.orderCode,
        providerRef: order.providerRef,
      };
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
          {course.scheduleItems.length > 0 ? (
            <View style={styles.metaItem}>
              <GameIcon name="clock" size={16} />
              <Text style={[styles.metaText, { color: c.mutedForeground }]}>{course.scheduleItems.length} buổi</Text>
            </View>
          ) : null}
        </View>
        {course.requiredFullTests > 0 ? (
          <View style={styles.metaItem}>
            <GameIcon name="check" size={16} />
            <Text style={[styles.metaText, { color: c.mutedForeground }]}>Cam kết {course.requiredFullTests} bài thi trong {course.commitmentWindowDays} ngày</Text>
          </View>
        ) : null}

        <View style={styles.actionRow}>
          {enrolled ? (
            course.livestreamUrl ? (
              <DepthButton size="lg" fullWidth onPress={() => { void openLivestream(course.livestreamUrl); }}>
                Vào Meet
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
            <HapticTouchable
              scalePress
              activeOpacity={0.92}
              onPress={() => router.push(`/(app)/courses/${courseId}/booking` as never)}
              style={[
                styles.bookingButton,
                { backgroundColor: c.primaryTint, borderColor: c.primary + "66", borderBottomColor: c.primary + "66" },
              ]}
            >
              <GameIcon name="graduation" size={18} />
              <Text style={[styles.bookingButtonText, { color: c.primaryDark }]}>Đặt lịch 1-1 với giảng viên</Text>
            </HapticTouchable>
          </View>
        )}
      </DepthCard>

      {commitment && commitment.phase !== "not_enrolled" ? <CommitmentCard commitment={commitment} /> : null}

      {course.description && (
        <DepthCard style={styles.descCard}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Mô tả</Text>
          <Text style={[styles.descText, { color: c.mutedForeground }]}>{course.description}</Text>
        </DepthCard>
      )}

      {course.scheduleItems.length > 0 && (
        <ScheduleCard items={course.scheduleItems} />
      )}

      {course.teacher ? <TeacherCard teacher={course.teacher} /> : null}

      <CommitmentsCard />

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

function ScheduleCard({ items }: { items: CourseScheduleItem[] }) {
  const c = useThemeColors();
  const sortedItems = [...items].sort((a, b) => a.date.localeCompare(b.date));
  const now = Date.now();

  return (
    <DepthCard style={styles.scheduleCard}>
      <View style={styles.scheduleHeader}>
        <Text style={[styles.sectionEyebrow, { color: c.mutedForeground }]}>Lịch học chi tiết</Text>
        <Text style={[styles.scheduleCount, { color: c.subtle }]}>{items.length} buổi</Text>
      </View>
      <View style={styles.agendaList}>
        {sortedItems.map((item) => (
          <ScheduleAgendaItem key={item.id} item={item} now={now} />
        ))}
      </View>
    </DepthCard>
  );
}

function CommitmentCard({ commitment }: { commitment: CommitmentStatus }) {
  const c = useThemeColors();
  if (!commitment || commitment.phase === "not_enrolled") return null;

  const met = commitment.phase === "met";
  const violated = commitment.phase === "violated";
  const total = Math.max(1, commitment.required);
  const pct = Math.min(100, Math.round((commitment.completed / total) * 100));
  const daysLeft = commitment.deadlineAt ? diffDays(commitment.deadlineAt) : null;
  const urgent = daysLeft !== null && daysLeft <= 2 && daysLeft >= 0 && !met;
  const statusText = met ? "Hoàn thành" : violated ? "Đã quá hạn" : urgent ? "Sắp hết hạn" : "Đang thực hiện";
  const statusColor = met ? c.primary : violated ? c.destructive : urgent ? c.warning : c.info;
  const remaining = Math.max(1, commitment.required - commitment.completed);

  return (
    <DepthCard style={styles.disciplineCard}>
      <View style={styles.disciplineTopRow}>
        <View>
          <Text style={[styles.sectionEyebrow, { color: c.mutedForeground }]}>Cam kết kỷ luật</Text>
          <Text style={[styles.disciplineTitle, { color: c.foreground }]}>
            {commitment.completed}/{commitment.required} bài thi full-test
          </Text>
        </View>
        <View style={[styles.disciplineStatus, { backgroundColor: statusColor + "18", borderColor: statusColor + "66" }]}>
          <Text style={[styles.disciplineStatusText, { color: statusColor }]}>{statusText}</Text>
        </View>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: c.muted }]}>
        <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: statusColor }]} />
      </View>
      {commitment.deadlineAt ? (
        <Text style={[styles.deadlineText, { color: violated ? c.destructive : urgent ? c.warning : c.subtle }]}>
          Hạn chót: {formatDate(commitment.deadlineAt)}{!met && !violated && daysLeft !== null ? ` (còn ${Math.max(0, daysLeft)} ngày)` : ""}
        </Text>
      ) : null}
      <Text style={[styles.disciplineBody, { color: c.foreground }]}>
        {met
          ? "Bạn đã hoàn thành cam kết — tiếp tục luyện đề để giữ phong độ."
          : violated
            ? `Cam kết đã vi phạm — bạn chưa hoàn thành đủ ${commitment.required} bài full-test trong hạn. Liên hệ giáo viên để được hỗ trợ.`
            : `Bạn cần hoàn thành ${remaining} bài full-test còn lại${daysLeft !== null && daysLeft >= 0 ? ` trong ${daysLeft} ngày tới` : ""}.`}
      </Text>
    </DepthCard>
  );
}

function ScheduleAgendaItem({ item, now }: { item: CourseScheduleItem; now: number }) {
  const c = useThemeColors();
  const cellTime = new Date(item.date).getTime();
  const today = isSameDay(cellTime, now);
  const past = !today && cellTime < now;
  const date = new Date(item.date);
  const status = today ? "Hôm nay" : past ? "Đã qua" : "Sắp tới";

  return (
    <View
      style={[
        styles.agendaItem,
        {
          borderColor: today ? c.primary : c.border,
          backgroundColor: today ? c.primaryTint : c.surface,
          opacity: past ? 0.75 : 1,
        },
      ]}
    >
      <View style={[styles.dateBlock, { backgroundColor: past ? c.muted : c.primaryTint }]}>
        <Text style={[styles.dateDay, { color: past ? c.subtle : c.primary }]}>{pad(date.getDate())}</Text>
        <Text style={[styles.dateMonth, { color: past ? c.subtle : c.primary }]}>Th{date.getMonth() + 1}</Text>
      </View>
      <View style={styles.agendaCopy}>
        <View style={styles.agendaTopRow}>
          <Text style={[styles.agendaSession, { color: past ? c.subtle : c.primary }]}>Buổi {pad(item.sessionNumber)}</Text>
          <Text style={[styles.agendaStatus, { color: today ? c.primaryDark : c.subtle }]}>{status}</Text>
        </View>
        <Text style={[styles.agendaTime, { color: c.foreground }]}>{fmtTime(item.startTime)}–{fmtTime(item.endTime)}</Text>
        <Text style={[styles.agendaTopic, { color: c.mutedForeground }]}>{item.topic}</Text>
      </View>
    </View>
  );
}

function TeacherCard({ teacher }: { teacher: CourseTeacher }) {
  const c = useThemeColors();

  return (
    <DepthCard style={styles.infoCard}>
      <Text style={[styles.sectionEyebrow, { color: c.mutedForeground }]}>Giáo viên phụ trách</Text>
      <View style={styles.teacherRow}>
        <View style={[styles.teacherAvatar, { backgroundColor: c.primaryTint }]}>
          <Text style={[styles.teacherInitials, { color: c.primary }]}>{getInitials(teacher.fullName)}</Text>
        </View>
        <View style={styles.teacherCopy}>
          <Text style={[styles.teacherName, { color: c.foreground }]}>{teacher.fullName}</Text>
          {teacher.title ? <Text style={[styles.teacherTitle, { color: c.foreground }]}>{teacher.title}</Text> : null}
          {teacher.bio ? <Text style={[styles.teacherBio, { color: c.mutedForeground }]}>{teacher.bio}</Text> : null}
        </View>
      </View>
    </DepthCard>
  );
}

function CommitmentsCard() {
  const c = useThemeColors();

  return (
    <DepthCard style={styles.infoCard}>
      <Text style={[styles.sectionEyebrow, { color: c.mutedForeground }]}>Cam kết từ Luyện Thi VSTEP</Text>
      <View style={styles.commitmentList}>
        {COURSE_COMMITMENTS.map((item) => (
          <View key={item} style={styles.commitmentItem}>
            <View style={[styles.commitmentIcon, { backgroundColor: c.primaryTint }]}>
              <Text style={[styles.commitmentCheck, { color: c.primary }]}>✓</Text>
            </View>
            <Text style={[styles.commitmentText, { color: c.foreground }]}>{item}</Text>
          </View>
        ))}
      </View>
    </DepthCard>
  );
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function fmtTime(time: string): string {
  return time.slice(0, 5);
}

function isSameDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

function diffDays(iso: string): number {
  const end = new Date(iso);
  const start = new Date();
  end.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - start.getTime()) / 86_400_000);
}

function createCourseReturnUrl(): string {
  const configured = process.env.EXPO_PUBLIC_PAYOS_RETURN_URL?.trim();
  if (configured) return configured;
  return DEFAULT_PAYOS_RETURN_URL;
}

function getPaymentReturnIds(pendingOrder: PendingCourseOrder, order: EnrollmentOrder): string[] {
  const ids = [order.providerRef, pendingOrder.providerRef, order.orderCode, pendingOrder.orderCode]
    .filter((id): id is number | string => typeof id === "number" || (typeof id === "string" && id.length > 0))
    .map(String);
  return [...new Set(ids)];
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
  bookingButton: {
    width: "100%",
    minHeight: 48,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.button,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  bookingButtonText: { fontSize: fontSize.sm, fontFamily: fontFamily.extraBold, textAlign: "center" },
  enrolledMsg: { fontSize: fontSize.sm, fontFamily: fontFamily.bold, textAlign: "center" },
  disciplineCard: { padding: spacing.lg, gap: spacing.md, marginBottom: spacing.base },
  disciplineTopRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md },
  disciplineTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold, marginTop: 2 },
  disciplineStatus: { borderWidth: 1, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  disciplineStatusText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  progressTrack: { height: 10, borderRadius: radius.full, overflow: "hidden" },
  progressFill: { height: 10, borderRadius: radius.full },
  deadlineText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  disciplineBody: { fontSize: fontSize.sm, lineHeight: 20 },
  descCard: { padding: spacing.lg, gap: spacing.sm, marginBottom: spacing.base },
  descText: { fontSize: fontSize.sm, lineHeight: 22 },
  sectionTitle: { fontSize: fontSize.base, fontFamily: fontFamily.bold, marginBottom: spacing.sm },
  scheduleCard: { padding: spacing.lg, gap: spacing.sm, marginBottom: spacing.base },
  scheduleHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  sectionEyebrow: { fontSize: fontSize.xs, fontFamily: fontFamily.bold, textTransform: "uppercase", letterSpacing: 0.6 },
  scheduleCount: { fontSize: fontSize.xs },
  agendaList: { gap: spacing.sm },
  agendaItem: { flexDirection: "row", gap: spacing.md, borderWidth: 2, borderRadius: radius.lg, padding: spacing.md },
  dateBlock: { width: 52, height: 52, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  dateDay: { fontSize: fontSize.lg, fontFamily: fontFamily.extraBold, lineHeight: 22 },
  dateMonth: { fontSize: 10, fontFamily: fontFamily.bold, textTransform: "uppercase" },
  agendaCopy: { flex: 1, minWidth: 0, gap: 3 },
  agendaTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  agendaSession: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold, textTransform: "uppercase" },
  agendaStatus: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  agendaTime: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  agendaTopic: { fontSize: fontSize.sm, lineHeight: 20 },
  scheduleItem: { paddingVertical: spacing.sm, borderBottomWidth: 1 },
  scheduleTime: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  timeText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  timeSub: { fontSize: fontSize.xs },
  topicText: { fontSize: fontSize.xs, marginTop: 4 },
  commitCard: { padding: spacing.lg, gap: spacing.sm, marginBottom: spacing.base },
  commitRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.xs },
  commitLabel: { fontSize: fontSize.sm },
  commitValue: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  infoCard: { padding: spacing.lg, gap: spacing.md, marginBottom: spacing.base },
  teacherRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  teacherAvatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  teacherInitials: { fontSize: fontSize.base, fontFamily: fontFamily.extraBold },
  teacherCopy: { flex: 1, minWidth: 0, gap: 4 },
  teacherName: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
  teacherTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  teacherBio: { fontSize: fontSize.sm, lineHeight: 20 },
  commitmentList: { gap: spacing.md },
  commitmentItem: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  commitmentIcon: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", marginTop: 1 },
  commitmentCheck: { fontSize: fontSize.sm, fontFamily: fontFamily.extraBold },
  commitmentText: { flex: 1, fontSize: fontSize.sm, lineHeight: 20 },
});
