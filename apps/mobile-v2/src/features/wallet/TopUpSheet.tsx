// TopUpSheet — BottomSheet to select a topup package and purchase
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";

import { BottomSheet } from "@/components/BottomSheet";
import { DepthButton } from "@/components/DepthButton";
import { GameIcon } from "@/components/GameIcon";
import { HapticTouchable } from "@/components/HapticTouchable";
import { useTopupPackages, useWalletBalance, walletBalanceQuery } from "@/features/wallet/queries";
import { syncCoins } from "@/features/coin/coin-store";
import { api } from "@/lib/api";
import type { TopupPackage, TopupOrder } from "@/features/wallet/types";
import { fontFamily, fontSize, radius, spacing, useThemeColors } from "@/theme";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: (coins: number, balance: number) => void;
}

export function TopUpSheet({ visible, onClose, onSuccess }: Props) {
  const c = useThemeColors();
  const queryClient = useQueryClient();
  const { data, isLoading } = useTopupPackages();
  const { data: balanceData } = useWalletBalance();
  const packages = useMemo(() => data ?? [], [data]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [buying, setBuying] = useState(false);

  const currentBalance = balanceData?.balance ?? 0;

  useEffect(() => {
    if (packages.length > 0 && !selectedId) {
      const mid = Math.floor(packages.length / 2);
      setSelectedId(packages[mid]?.id ?? packages[0]?.id ?? null);
    }
  }, [packages, selectedId]);

  const selected = packages.find((p) => p.id === selectedId) ?? null;

  async function handleBuy() {
    if (!selected || buying) return;
    setBuying(true);
    try {
      const order = await api.post<TopupOrder>("/api/v1/wallet/topup", {
        packageId: selected.id,
        paymentProvider: "mock",
      });
      await api.post<TopupOrder>(`/api/v1/wallet/topup/${order.id}/confirm`);
      // Invalidate balance query so CoinButton + wallet screen refetch
      void queryClient.invalidateQueries({ queryKey: walletBalanceQuery.queryKey });
      void queryClient.invalidateQueries({ queryKey: ["wallet", "transactions"] });
      const newBalance = currentBalance + selected.totalCoins;
      syncCoins(newBalance);
      onClose();
      // Show success popup after sheet close animation
      setTimeout(() => onSuccess(selected.totalCoins, newBalance), 250);
    } catch {
      // Global error handler shows toast
    } finally {
      setBuying(false);
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <GameIcon name="coin" size={40} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: c.foreground }]}>Nạp xu</Text>
            <Text style={[styles.subtitle, { color: c.subtle }]}>
              Mua một lần, dùng đến khi đạt mục tiêu.
            </Text>
          </View>
        </View>

        <View style={styles.benefits}>
          <BenefitRow icon="target" text="Luyện tập & thi thử không giới hạn" c={c} />
          <BenefitRow icon="pencil" text="Chấm điểm + nhận xét AI chi tiết" c={c} />
          <BenefitRow icon="lightning" text="Tặng thêm xu theo streak học tập" c={c} />
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

        {selected ? (
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
          Xu không bao giờ hết hạn. Liên hệ fanpage nếu cần hỗ trợ.
        </Text>
      </ScrollView>
    </BottomSheet>
  );
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
        <GameIcon name="coin" size={20} />
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
