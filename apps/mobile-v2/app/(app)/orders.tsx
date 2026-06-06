import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { HapticTouchable } from "@/components/HapticTouchable";
import { useOrderHistory } from "@/features/orders/queries";
import type { OrderHistoryItem, OrderHistoryStatus } from "@/features/orders/types";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

const STATUS_LABEL: Record<OrderHistoryStatus, string> = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  failed: "Thất bại",
  cancelled: "Đã hủy",
  expired: "Hết hạn",
};

export default function OrdersScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useOrderHistory(page);
  const orders = data?.data ?? [];
  const meta = data?.meta ?? null;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: c.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing["3xl"] }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <HapticTouchable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: c.surfaceTint, borderColor: c.border }]}>
          <Ionicons name="arrow-back" size={20} color={c.foreground} />
        </HapticTouchable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: c.subtle }]}>THANH TOÁN</Text>
          <Text style={[styles.title, { color: c.foreground }]}>Lịch sử đơn hàng</Text>
          <Text style={[styles.subtitle, { color: c.mutedForeground }]}>Theo dõi đơn nạp xu và mua khóa học của hồ sơ hiện tại.</Text>
        </View>
      </View>

      <DepthCard style={styles.listCard}>
        {isLoading ? (
          <View style={styles.centerBlock}>
            <ActivityIndicator color={c.primary} />
            <Text style={[styles.emptyText, { color: c.subtle }]}>Đang tải đơn hàng...</Text>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.centerBlock}>
            <Ionicons name="receipt-outline" size={36} color={c.subtle} />
            <Text style={[styles.emptyTitle, { color: c.foreground }]}>Chưa có đơn hàng</Text>
            <Text style={[styles.emptyText, { color: c.subtle }]}>Khi bạn nạp xu hoặc mua khóa học, lịch sử sẽ xuất hiện ở đây.</Text>
          </View>
        ) : (
          <View style={styles.orderList}>
            {orders.map((order) => <OrderCard key={`${order.type}:${order.id}`} order={order} />)}
          </View>
        )}
      </DepthCard>

      {meta && meta.lastPage > 1 ? (
        <View style={styles.pagerRow}>
          <Text style={[styles.pageText, { color: c.subtle }]}>Trang {meta.currentPage}/{meta.lastPage} · {meta.total} đơn</Text>
          <View style={styles.pagerButtons}>
            <DepthButton variant="secondary" size="sm" disabled={meta.currentPage <= 1 || isFetching} onPress={() => setPage((value) => Math.max(1, value - 1))}>
              Trước
            </DepthButton>
            <DepthButton variant="secondary" size="sm" disabled={meta.currentPage >= meta.lastPage || isFetching} onPress={() => setPage((value) => value + 1)}>
              Sau
            </DepthButton>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

function OrderCard({ order }: { order: OrderHistoryItem }) {
  const c = useThemeColors();
  const isTopup = order.type === "topup";
  const statusColor = statusTone(order.status, c);
  return (
    <View style={[styles.orderCard, { borderColor: c.borderLight, backgroundColor: c.surface }]}>
      <View style={[styles.orderIcon, { backgroundColor: isTopup ? c.warningTint : c.primaryTint, borderColor: isTopup ? c.warning : c.primary }]}>
        <Ionicons name={isTopup ? "wallet" : "school"} size={22} color={isTopup ? c.warning : c.primary} />
      </View>
      <View style={styles.orderMain}>
        <View style={styles.orderTitleRow}>
          <Text style={[styles.orderTitle, { color: c.foreground }]} numberOfLines={2}>{order.itemName}</Text>
          <Text style={[styles.statusBadge, { color: statusColor, borderColor: statusColor }]}>{STATUS_LABEL[order.status]}</Text>
        </View>
        <Text style={[styles.orderMeta, { color: c.subtle }]}>{order.typeLabel} · Mã đơn {order.orderCode ?? order.id.slice(0, 8)} · {formatDate(order.createdAt)}</Text>
        {isTopup && order.coinsToCredit !== null ? (
          <Text style={[styles.coinText, { color: c.primaryDark }]}>+{order.coinsToCredit.toLocaleString("vi-VN")} xu</Text>
        ) : null}
        <View style={styles.amountRow}>
          <Text style={[styles.providerText, { color: c.subtle }]}>{order.paymentProvider}</Text>
          <Text style={[styles.amountText, { color: c.foreground }]}>{formatVnd(order.amountVnd)}</Text>
        </View>
      </View>
    </View>
  );
}

function statusTone(status: OrderHistoryStatus, c: ReturnType<typeof useThemeColors>): string {
  switch (status) {
    case "paid": return c.success;
    case "pending": return c.warning;
    case "failed": return c.destructive;
    default: return c.subtle;
  }
}

function formatVnd(value: number): string {
  return `${value.toLocaleString("vi-VN")}đ`;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, gap: spacing.lg },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  backButton: { width: 40, height: 40, borderRadius: radius.md, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  eyebrow: { fontSize: 10, fontFamily: fontFamily.extraBold, letterSpacing: 1.2 },
  title: { marginTop: spacing.xs, fontSize: fontSize.xl, fontFamily: fontFamily.extraBold },
  subtitle: { marginTop: spacing.xs, fontSize: fontSize.sm, lineHeight: 20, fontFamily: fontFamily.medium },
  listCard: { padding: spacing.md },
  centerBlock: { minHeight: 180, alignItems: "center", justifyContent: "center", gap: spacing.sm, padding: spacing.lg },
  emptyTitle: { fontSize: fontSize.base, fontFamily: fontFamily.extraBold },
  emptyText: { textAlign: "center", fontSize: fontSize.sm, lineHeight: 20 },
  orderList: { gap: spacing.md },
  orderCard: { flexDirection: "row", gap: spacing.md, borderWidth: 1, borderRadius: radius.xl, padding: spacing.md },
  orderIcon: { width: 46, height: 46, borderRadius: radius.lg, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  orderMain: { flex: 1, minWidth: 0, gap: spacing.xs },
  orderTitleRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  orderTitle: { flex: 1, fontSize: fontSize.sm, lineHeight: 20, fontFamily: fontFamily.extraBold },
  statusBadge: { overflow: "hidden", borderWidth: 1, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2, fontSize: 10, fontFamily: fontFamily.extraBold },
  orderMeta: { fontSize: fontSize.xs, lineHeight: 18, fontFamily: fontFamily.bold },
  coinText: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  amountRow: { marginTop: spacing.xs, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.md },
  providerText: { fontSize: 10, fontFamily: fontFamily.extraBold, textTransform: "uppercase" },
  amountText: { fontSize: fontSize.base, fontFamily: fontFamily.extraBold },
  pagerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  pageText: { flex: 1, fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  pagerButtons: { flexDirection: "row", gap: spacing.sm },
});
