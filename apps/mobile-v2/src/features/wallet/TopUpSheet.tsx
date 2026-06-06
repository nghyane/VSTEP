// TopUpSheet — BottomSheet to select a topup package and purchase
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, AppState, Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";

import { BottomSheet } from "@/components/BottomSheet";
import { BrandIcon } from "@/components/BrandIcon";
import { DepthButton } from "@/components/DepthButton";
import { GameIcon } from "@/components/GameIcon";
import { HapticTouchable } from "@/components/HapticTouchable";
import { syncWalletBalanceCache, useTopupPackages, useWalletBalance } from "@/features/wallet/queries";
import { useAuth } from "@/hooks/use-auth";
import { useAppConfig } from "@/hooks/use-exams";
import { api, getApiErrorMessage } from "@/lib/api";
import type { TopupPackage, TopupOrder, WalletBalance } from "@/features/wallet/types";
import { fontFamily, fontSize, radius, spacing, useThemeColors } from "@/theme";

const PENDING_TOPUP_ORDER_KEY = "wallet.pendingTopupOrder";
const DEFAULT_PAYOS_RETURN_URL = "https://vstepgo.com/payos/mobile-return";

interface PendingTopupOrder {
  id: string;
  coins: number;
  orderCode?: number | null;
  providerRef?: string | null;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: (coins: number, balance: number) => void;
}

export function TopUpSheet({ visible, onClose, onSuccess }: Props) {
  const c = useThemeColors();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { data, isLoading } = useTopupPackages();
  const { data: balanceData } = useWalletBalance();
  const { data: configData } = useAppConfig();
  const packages = useMemo(() => data ?? [], [data]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [buying, setBuying] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<PendingTopupOrder | null>(null);
  const checkingPaymentRef = useRef(false);
  const restoredPendingRef = useRef(false);

  const balance = balanceData?.balance ?? 0;
  const pricing = configData?.pricing ?? null;
  const zaloPhone = configData?.support?.zaloPhone?.replace(/\D/g, "") ?? "";

  useEffect(() => {
    if (packages.length > 0 && !selectedId) {
      const mid = Math.floor(packages.length / 2);
      setSelectedId(packages[mid]?.id ?? packages[0]?.id ?? null);
    }
  }, [packages, selectedId]);

  const selected = packages.find((p) => p.id === selectedId) ?? null;

  const setChecking = useCallback((next: boolean) => {
    checkingPaymentRef.current = next;
    setCheckingPayment(next);
  }, []);

  const checkOrderPayment = useCallback(async (orderToCheck: PendingTopupOrder, notifyPending: boolean) => {
    if (checkingPaymentRef.current) return;
    setChecking(true);
    try {
      let order = await api.get<TopupOrder>(`/api/v1/wallet/topup/${orderToCheck.id}/status`);
      if (order.status === "pending") {
        for (const paymentReturnId of getPaymentReturnIds(orderToCheck, order)) {
          order = await reportTopupPaymentReturn(paymentReturnId).catch(() => order);
          if (order.status !== "pending") break;
        }
      }
      if (order.status === "paid") {
        const balance = await api.get<WalletBalance>("/api/v1/wallet/balance");
        syncWalletBalanceCache(queryClient, balance.balance, balance.lastTransactionAt);
        void queryClient.invalidateQueries({ queryKey: ["wallet"] });
        await clearPendingTopupOrder();
        setPendingOrder(null);
        onClose();
        setTimeout(() => onSuccess(order.coinsToCredit || orderToCheck.coins, balance.balance), 250);
        return;
      }

      if (order.status === "failed" || order.status === "cancelled" || order.status === "expired") {
        await clearPendingTopupOrder();
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
  }, [onClose, onSuccess, queryClient, setChecking]);

  const checkPendingPayment = useCallback(async () => {
    if (!pendingOrder) return;
    await checkOrderPayment(pendingOrder, true);
  }, [checkOrderPayment, pendingOrder]);

  useEffect(() => {
    if (restoredPendingRef.current) return;
    restoredPendingRef.current = true;
    let mounted = true;
    loadPendingTopupOrder().then((order) => {
      if (!mounted || !order) return;
      setPendingOrder(order);
      void checkOrderPayment(order, false);
    }).catch(() => undefined);
    return () => { mounted = false; };
  }, [checkOrderPayment]);

  useEffect(() => {
    if (!pendingOrder) return;
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") void checkOrderPayment(pendingOrder, false);
    });
    return () => subscription.remove();
  }, [checkOrderPayment, pendingOrder]);

  async function handleBuy() {
    if (!selected || buying) return;
    if (!profile) {
      Alert.alert("Chưa chọn hồ sơ", "Vui lòng chọn hồ sơ học trước khi nạp xu.");
      return;
    }
    setBuying(true);
    try {
      const order = await api.post<TopupOrder>("/api/v1/wallet/topup", {
        packageId: selected.id,
        paymentProvider: "payos",
        returnUrl: createTopupReturnUrl(),
        cancelUrl: createTopupReturnUrl(),
      });

      if (!order.paymentUrl) {
        Alert.alert("Chưa tạo được thanh toán", "Cổng thanh toán chưa trả về đường dẫn thanh toán. Vui lòng thử lại.");
        return;
      }

      const nextPendingOrder = {
        id: order.id,
        coins: order.coinsToCredit || selected.totalCoins,
        orderCode: order.orderCode,
        providerRef: order.providerRef,
      };
      await savePendingTopupOrder(nextPendingOrder);
      setPendingOrder(nextPendingOrder);
      await Linking.openURL(order.paymentUrl);
      onClose();
    } catch (error) {
      Alert.alert("Không thể nạp xu", getApiErrorMessage(error));
    } finally {
      setBuying(false);
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <BrandIcon name="coin" size={40} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: c.foreground }]}>Nạp xu</Text>
            <Text style={[styles.subtitle, { color: c.subtle }]}>
              Mua một lần, dùng đến khi đạt mục tiêu.
            </Text>
          </View>
        </View>

        <View style={styles.benefits}>
          <BenefitRow icon="target" text={`Số dư hiện tại: ${formatNumber(balance)} xu`} c={c} />
          <BenefitRow icon="target" text={`Full-test: ${coinCostLabel(pricing?.exam.fullTestCostCoins, "lượt")}`} c={c} />
          <BenefitRow icon="target" text={`Thi từng kỹ năng: ${coinCostLabel(pricing?.exam.customPerSkillCoins, "kỹ năng")}`} c={c} />
          <BenefitRow icon="pencil" text={`Nhận xét AI: ${pricing?.practice?.feedbackCostCoins === 0 ? "đang miễn phí" : coinCostLabel(pricing?.practice?.feedbackCostCoins, "lần")}`} c={c} />
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={c.primary} style={{ marginVertical: spacing.xl }} />
        ) : packages.length === 0 ? (
          <Text style={[styles.emptyText, { color: c.subtle }]}>Không có gói nạp nào.</Text>
        ) : (
          <View style={styles.grid}>
            {packages.map((pack) => (
              <PackCard
                key={pack.id}
                pack={pack}
                selected={selectedId === pack.id}
                onSelect={() => setSelectedId(pack.id)}
              />
            ))}
          </View>
        )}

        {pendingOrder ? (
          <View style={[styles.pendingCard, { backgroundColor: c.infoTint, borderColor: c.info }]}>
            <Text style={[styles.pendingTitle, { color: c.foreground }]}>Đã mở cổng thanh toán</Text>
            <Text style={[styles.pendingText, { color: c.subtle }]}>Sau khi thanh toán xong, quay lại app để số dư được cập nhật tự động.</Text>
            <DepthButton variant="primary" fullWidth onPress={checkPendingPayment} disabled={checkingPayment}>
              {checkingPayment ? "Đang kiểm tra..." : "Kiểm tra thanh toán"}
            </DepthButton>
          </View>
        ) : selected ? (
          <DepthButton
            variant="coin"
            fullWidth
            onPress={handleBuy}
            disabled={buying}
          >
            {buying
              ? "Đang xử lý..."
              : `Nạp ${formatNumber(selected.totalCoins)} xu · ${formatVnd(selected.amountVnd)}`}
          </DepthButton>
        ) : null}

        <Text style={[styles.footerNote, { color: c.subtle }]}>
          {zaloPhone ? `Xu không hết hạn. Cần hỗ trợ? Zalo ${formatPhone(zaloPhone)}.` : "Xu không hết hạn. Cần hỗ trợ? Liên hệ đội ngũ VSTEP Go."}
        </Text>
      </ScrollView>
    </BottomSheet>
  );
}

function createTopupReturnUrl(): string {
  const configured = process.env.EXPO_PUBLIC_PAYOS_RETURN_URL?.trim();
  return appendPaymentReturnParams(normalizePayosReturnUrl(configured || DEFAULT_PAYOS_RETURN_URL), { flow: "topup" });
}

function appendPaymentReturnParams(baseUrl: string, params: Record<string, string>): string {
  const url = new URL(baseUrl);
  url.searchParams.set("client", "mobile");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url.toString();
}

function normalizePayosReturnUrl(baseUrl: string): string {
  const url = new URL(baseUrl);
  if (url.pathname === "/wallet") url.pathname = "/payos/mobile-return";
  return url.toString();
}

function reportTopupPaymentReturn(paymentLinkId: string): Promise<TopupOrder> {
  return api.post<TopupOrder>("/api/v1/wallet/topup/payment-return", { id: paymentLinkId });
}

function getPaymentReturnIds(pendingOrder: PendingTopupOrder, order: TopupOrder): string[] {
  const ids = [order.orderCode, pendingOrder.orderCode, order.providerRef, pendingOrder.providerRef]
    .filter((id): id is number | string => typeof id === "number" || (typeof id === "string" && id.length > 0))
    .map(String);
  return [...new Set(ids)];
}

function isPendingTopupOrder(value: unknown): value is PendingTopupOrder {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === "string" && typeof record.coins === "number";
}

async function loadPendingTopupOrder(): Promise<PendingTopupOrder | null> {
  const raw = await SecureStore.getItemAsync(PENDING_TOPUP_ORDER_KEY);
  if (!raw) return null;
  const parsed = JSON.parse(raw) as unknown;
  return isPendingTopupOrder(parsed) ? parsed : null;
}

async function savePendingTopupOrder(order: PendingTopupOrder): Promise<void> {
  await SecureStore.setItemAsync(PENDING_TOPUP_ORDER_KEY, JSON.stringify(order));
}

async function clearPendingTopupOrder(): Promise<void> {
  await SecureStore.deleteItemAsync(PENDING_TOPUP_ORDER_KEY);
}

function PackCard({ pack, selected, onSelect }: { pack: TopupPackage; selected: boolean; onSelect: () => void }) {
  const c = useThemeColors();
  const highlight = pack.bonusCoins > 0 && pack.bonusCoins >= 100;
  const pricePerCoin = Math.round(pack.amountVnd / pack.totalCoins);
  const savingsPct = pack.bonusCoins > 0 ? Math.max(0, Math.round(((300 - pricePerCoin) / 300) * 100)) : 0;

  return (
    <HapticTouchable
      style={[
        styles.packCard,
        {
          backgroundColor: c.surface,
          borderColor: selected ? c.coin : c.border,
          borderBottomColor: selected ? c.coinDark : c.border,
        },
        selected && styles.packCardSelected,
      ]}
      onPress={onSelect}
      activeOpacity={0.85}
    >
      {highlight ? (
        <View style={[styles.bestBadge, { backgroundColor: c.primary }]}>
          <GameIcon name="trophy" size={10} />
          <Text style={styles.bestBadgeText}>Best value</Text>
        </View>
      ) : null}
      <Text style={[styles.packLabel, { color: c.subtle }]}>{pack.label}</Text>
      <View style={styles.packCoinRow}>
        <BrandIcon name="coin" size={20} />
        <Text style={[styles.packCoins, { color: c.foreground }]}>{formatNumber(pack.totalCoins)}</Text>
        <Text style={[styles.packUnit, { color: c.subtle }]}>xu</Text>
      </View>
      <Text style={[styles.packPrice, { color: c.foreground }]}>{formatVnd(pack.amountVnd)}</Text>
      {savingsPct > 0 ? (
        <View style={[styles.savingsBadge, { backgroundColor: c.primaryTint }]}>
          <Text style={[styles.savingsText, { color: c.primaryDark }]}>
            +{formatNumber(pack.bonusCoins)} xu · tiết kiệm {savingsPct}%
          </Text>
        </View>
      ) : (
        <Text style={[styles.perCoin, { color: c.subtle }]}>{formatNumber(pricePerCoin)}đ / xu</Text>
      )}
    </HapticTouchable>
  );
}

function BenefitRow({ icon, text, c }: { icon: "target" | "pencil" | "lightning"; text: string; c: ReturnType<typeof useThemeColors> }) {
  return (
    <View style={styles.benefitRow}>
      <View style={[styles.benefitIcon, { backgroundColor: c.primaryTint }]}>
        <GameIcon name={icon} size={16} />
      </View>
      <Text style={[styles.benefitText, { color: c.foreground }]}>{text}</Text>
    </View>
  );
}

function formatNumber(n: number): string {
  return n.toLocaleString("vi-VN");
}

function formatVnd(n: number): string {
  return n.toLocaleString("vi-VN") + "đ";
}

function coinCostLabel(cost: number | null | undefined, unit: string): string {
  return typeof cost === "number" ? `${formatNumber(cost)} xu / ${unit}` : "theo cấu hình hiện tại";
}

function formatPhone(phone: string): string {
  if (phone.length === 10) return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
  return phone;
}

const styles = StyleSheet.create({
  scroll: { maxHeight: 520 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing["2xl"], gap: spacing.lg },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  title: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold },
  subtitle: { fontSize: fontSize.xs, marginTop: 2 },
  benefits: { gap: spacing.sm },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  benefitIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  benefitText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold, flex: 1 },
  emptyText: { fontSize: fontSize.sm, textAlign: "center", paddingVertical: spacing.xl },
  pendingCard: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  pendingTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.extraBold },
  pendingText: { fontSize: fontSize.xs, fontFamily: fontFamily.medium, lineHeight: 18 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  packCard: {
    width: "48%",
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 4,
  },
  packCardSelected: { shadowColor: "#FFC800", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  bestBadge: { position: "absolute", top: -8, left: spacing.sm, flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  bestBadgeText: { color: "#FFF", fontSize: 9, fontFamily: fontFamily.extraBold, textTransform: "uppercase", letterSpacing: 0.5 },
  packLabel: { fontSize: 10, fontFamily: fontFamily.extraBold, textTransform: "uppercase", letterSpacing: 0.8 },
  packCoinRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  packCoins: { fontSize: fontSize.lg, fontFamily: fontFamily.extraBold },
  packUnit: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  packPrice: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
  savingsBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, alignSelf: "flex-start" },
  savingsText: { fontSize: 10, fontFamily: fontFamily.extraBold },
  perCoin: { fontSize: 10, fontFamily: fontFamily.bold },
  footerNote: { fontSize: fontSize.xs, textAlign: "center" },
});
