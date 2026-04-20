// TopUpDialog — xu purchase sheet (calls wallet API)
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { BottomSheet } from "@/components/BottomSheet";
import { GameIcon } from "@/components/GameIcon";
import { DepthButton } from "@/components/DepthButton";
import { HapticTouchable } from "@/components/HapticTouchable";
import { topup, topupPackagesQuery, useInvalidateWallet, useWalletBalance } from "@/features/wallet/queries";
import { fontSize, fontFamily, radius, spacing, useThemeColors } from "@/theme";

interface TopUpDialogProps {
  visible: boolean;
  onClose: () => void;
}

// Fallback packages when API not available
const FALLBACK_PACKAGES = [
  { id: "p1", coins: 50, price_vnd: 19000, label: "19.000đ", is_popular: false },
  { id: "p2", coins: 150, price_vnd: 49000, label: "49.000đ", is_popular: true },
  { id: "p3", coins: 350, price_vnd: 99000, label: "99.000đ", is_popular: false },
  { id: "p4", coins: 800, price_vnd: 199000, label: "199.000đ", is_popular: false },
];

export function TopUpDialog({ visible, onClose }: TopUpDialogProps) {
  const c = useThemeColors();
  const balance = useWalletBalance();
  const invalidate = useInvalidateWallet();
  const { data: packagesRes } = useQuery(topupPackagesQuery);
  const packages = packagesRes?.data ?? FALLBACK_PACKAGES;
  const [loading, setLoading] = useState(false);

  async function handleBuy(pkgId: string) {
    setLoading(true);
    try {
      await topup(pkgId);
      invalidate();
      onClose();
    } catch {
      Alert.alert("Lỗi", "Không thể nạp xu. Thử lại sau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={[styles.content, { backgroundColor: c.surface }]}>
        <View style={styles.header}>
          <GameIcon name="coin" size={24} />
          <Text style={[styles.title, { color: c.foreground }]}>Nạp xu</Text>
        </View>

        <View style={[styles.balanceRow, { backgroundColor: c.background }]}>
          <Text style={[styles.balanceLabel, { color: c.subtle }]}>Số dư hiện tại</Text>
          <Text style={[styles.balanceValue, { color: c.coin }]}>{balance} xu</Text>
        </View>

        <View style={styles.packs}>
          {packages.map((pack) => (
            <HapticTouchable
              key={pack.id}
              style={[styles.pack, { borderColor: pack.is_popular ? c.coin : c.border, borderBottomColor: pack.is_popular ? c.coinDark : c.depthBorderDark }]}
              onPress={() => handleBuy(pack.id)}
              activeOpacity={0.7}
              disabled={loading}
            >
              {pack.is_popular && <View style={[styles.badge, { backgroundColor: c.coin }]}><Text style={styles.badgeText}>Phổ biến</Text></View>}
              <GameIcon name="coin" size={28} />
              <Text style={[styles.packCoins, { color: c.foreground }]}>{pack.coins} xu</Text>
              <Text style={[styles.packPrice, { color: c.subtle }]}>{pack.label ?? `${(pack.price_vnd / 1000).toFixed(0)}.000đ`}</Text>
            </HapticTouchable>
          ))}
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing["2xl"] },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.base },
  title: { fontSize: fontSize.xl, fontFamily: fontFamily.bold },
  balanceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.md, borderRadius: radius.lg },
  balanceLabel: { fontSize: fontSize.sm },
  balanceValue: { fontSize: fontSize.lg, fontFamily: fontFamily.bold },
  packs: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.lg },
  pack: { width: "47%", alignItems: "center", padding: spacing.base, borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, gap: spacing.xs },
  packCoins: { fontSize: fontSize.lg, fontFamily: fontFamily.bold },
  packPrice: { fontSize: fontSize.sm },
  badge: { position: "absolute", top: -8, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  badgeText: { color: "#FFF", fontSize: fontSize.xs, fontFamily: fontFamily.bold },
});
