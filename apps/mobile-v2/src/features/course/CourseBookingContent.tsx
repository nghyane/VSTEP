import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { LoadingScreen } from "@/components/LoadingScreen";
import { BookingCommitmentGate } from "@/features/course/BookingCommitmentGate";
import { BookingSlotList } from "@/features/course/BookingSlotList";
import { BookingTeacherCard } from "@/features/course/BookingTeacherCard";
import { BOOKING_COIN_COST_FALLBACK, useBookingPage, useBookSlot } from "@/features/course/queries";
import type { BookingSlot } from "@/features/course/types";
import { useWalletBalance } from "@/features/wallet/queries";
import { formatNumber, formatTime, formatWeekdayDate } from "@/lib/utils";
import { fontFamily, fontSize, spacing, useThemeColors } from "@/theme";

export function CourseBookingContent({ courseId }: { courseId: string }) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data, isLoading } = useBookingPage(courseId);
  const { data: wallet } = useWalletBalance();
  const bookSlot = useBookSlot();

  if (isLoading || !data) return <LoadingScreen />;

  const locked = data.commitment.phase !== "met";
  const reachedLimit = data.myBookingsCount >= data.maxBookingsPerStudent;
  const balance = wallet?.balance ?? null;
  const coinCost = data.bookingCoinCost ?? BOOKING_COIN_COST_FALLBACK;
  const insufficient = balance !== null && balance < coinCost;

  function handleSelect(slot: BookingSlot) {
    if (slot.status === "booked_me") return showBookedSlot(slot);
    if (locked || reachedLimit || slot.status !== "available") return;
    confirmBooking(slot);
  }

  function confirmBooking(slot: BookingSlot) {
    Alert.alert("Xác nhận đặt lịch", `${formatWeekdayDate(slot.startsAt)} lúc ${formatTime(slot.startsAt)}. Phí: ${coinCost} xu.`, [
      { text: "Hủy", style: "cancel" },
      { text: insufficient ? "Nạp xu" : "Đặt lịch", onPress: () => (insufficient ? router.push("/(app)/topup" as never) : book(slot)) },
    ]);
  }

  function book(slot: BookingSlot) {
    bookSlot.mutate(
      { courseId, slotId: slot.id },
      { onSuccess: () => Alert.alert("Đặt lịch thành công", "Lịch hẹn đã được xác nhận. Link meeting sẽ hiển thị trong slot đã đặt.") },
    );
  }

  function showBookedSlot(slot: BookingSlot) {
    Alert.alert("Lịch đã đặt", slot.meetUrl ? `${formatTime(slot.startsAt)} · ${slot.meetUrl}` : `${formatTime(slot.startsAt)} · Link meeting đang được cập nhật.`);
  }

  return (
    <ScrollView style={[styles.root, { backgroundColor: c.background }]} contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing["3xl"] }]}>
      <View style={styles.header}>
        <DepthButton variant="secondary" size="sm" onPress={() => router.back()}>← Quay lại</DepthButton>
        <Text style={[styles.title, { color: c.foreground }]}>Đặt lịch 1-1</Text>
      </View>
      <BookingTeacherCard teacher={data.teacher} myBookingsCount={data.myBookingsCount} />
      <BookingCommitmentGate commitment={data.commitment} />
      {reachedLimit && !locked && <LimitCard count={data.maxBookingsPerStudent} />}
      <DepthCard style={styles.walletCard}>
        <Text style={[styles.walletLabel, { color: c.subtle }]}>Số dư ví</Text>
        <Text style={[styles.walletValue, { color: insufficient ? c.destructive : c.foreground }]}>{balance === null ? "Đang tải" : `${formatNumber(balance)} xu`}</Text>
      </DepthCard>
      <Text style={[styles.sectionTitle, { color: c.foreground }]}>Lịch trống</Text>
      <BookingSlotList slots={data.slots} locked={locked || reachedLimit || bookSlot.isPending} onSelect={handleSelect} />
    </ScrollView>
  );
}

function LimitCard({ count }: { count: number }) {
  const c = useThemeColors();
  return (
    <DepthCard variant="success" style={styles.limitCard}>
      <Text style={[styles.limitText, { color: c.primaryDark }]}>Bạn đã dùng hết {count} buổi học 1-1 cho khóa này.</Text>
    </DepthCard>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.xl },
  header: { gap: spacing.md, marginBottom: spacing.base, alignItems: "flex-start" },
  title: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  walletCard: { gap: spacing.xs, marginBottom: spacing.base },
  walletLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold, textTransform: "uppercase", letterSpacing: 0.8 },
  walletValue: { fontSize: fontSize.lg, fontFamily: fontFamily.extraBold },
  sectionTitle: { fontSize: fontSize.base, fontFamily: fontFamily.extraBold, marginBottom: spacing.sm },
  limitCard: { marginBottom: spacing.base },
  limitText: { fontSize: fontSize.sm, fontFamily: fontFamily.extraBold, lineHeight: 20 },
});
