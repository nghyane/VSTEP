// TopUpDialog — xu purchase sheet (aligned with frontend-v2 TopUpDialog)
import { StyleSheet, Text, View } from "react-native";
import { BottomSheet } from "@/components/BottomSheet";
import { GameIcon } from "@/components/GameIcon";
import { DepthButton } from "@/components/DepthButton";
import { HapticTouchable } from "@/components/HapticTouchable";
import { refundCoins, useCoins } from "@/features/coin/coin-store";
import { fontSize, fontFamily, radius, spacing, useThemeColors } from "@/theme";

interface TopUpDialogProps {
  visible: boolean;
  onClose: () => void;
}

const PACKS = [
  { coins: 50, price: "19.000đ", popular: false },
  { coins: 150, price: "49.000đ", popular: true },
  { coins: 350, price: "99.000đ", popular: false },
  { coins: 800, price: "199.000đ", popular: false },
] as const;

export function TopUpDialog({ visible, onClose }: TopUpDialogProps) {
  const c = useThemeColors();
  const currentCoins = useCoins();

  function handleBuy(coins: number) {
    refundCoins(coins);
    onClose();
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={[styles.content, { backgroundColor: c.card }]}>
        {/* Header */}
        <View style={styles.header}>
          <GameIcon name="coin" size={24} />
          <Text style={[styles.title, { color: c.foreground }]}>Nạp xu</Text>
        </View>

        {/* Balance */}
        <View style={[styles.balanceRow, { backgroundColor: c.muted }]}>
          <Text style={[styles.balanceLabel, { color: c.mutedForeground }]}>Số dư hiện tại</Text>
          <Text style={[styles.balanceValue, { color: c.coin }]}>{currentCoins} xu</Text>
        </View>

        {/* Packs */}
        <View style={styles.packs}>
          {PACKS.map((pack) => (
            <HapticTouchable
              key={pack.coins}
              style={[styles.pack, { borderColor: pack.popular ? c.coin : "#E5E5E5", borderBottomColor: pack.popular ? c.coinDark : "#CACACA" }]}
              onPress={() => handleBuy(pack.coins)}
              activeOpacity={0.7}
            >
              {pack.popular && <View style={[styles.badge, { backgroundColor: c.coin }]}><Text style={styles.badgeText}>Phổ biến</Text></View>}
              <GameIcon name="coin" size={28} />
              <Text style={[styles.packCoins, { color: c.foreground }]}>{pack.coins} xu</Text>
              <Text style={[styles.packPrice, { color: c.mutedForeground }]}>{pack.price}</Text>
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
