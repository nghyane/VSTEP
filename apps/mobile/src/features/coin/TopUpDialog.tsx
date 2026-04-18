// TopUpDialog — xu purchase modal (aligned with frontend-v2 TopUpDialog)
import { Modal, StyleSheet, Text, View } from "react-native";
import { GameIcon } from "@/components/GameIcon";
import { DepthButton } from "@/components/DepthButton";
import { HapticTouchable } from "@/components/HapticTouchable";
import { refundCoins, useCoins } from "@/features/coin/coin-store";
import { fontSize, fontFamily, radius, spacing, useThemeColors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";

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
    // Mock purchase — instant credit
    refundCoins(coins);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: c.card, borderColor: c.depthBorderLight, borderBottomColor: c.depthBorderDark }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: c.border }]}>
            <View style={styles.headerLeft}>
              <GameIcon name="coin" size={24} />
              <Text style={[styles.title, { color: c.foreground }]}>Nạp xu</Text>
            </View>
            <HapticTouchable onPress={onClose}>
              <Ionicons name="close" size={24} color={c.mutedForeground} />
            </HapticTouchable>
          </View>

          {/* Current balance */}
          <View style={[styles.balanceRow, { backgroundColor: c.muted }]}>
            <Text style={[styles.balanceLabel, { color: c.mutedForeground }]}>Số dư hiện tại</Text>
            <Text style={[styles.balanceValue, { color: c.coin }]}>{currentCoins} xu</Text>
          </View>

          {/* Packs */}
          <View style={styles.packs}>
            {PACKS.map((pack) => (
              <HapticTouchable
                key={pack.coins}
                style={[styles.pack, { borderColor: pack.popular ? c.coin : c.depthBorderLight, borderBottomColor: pack.popular ? c.coinDark : c.depthBorderDark }]}
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

          {/* Footer */}
          <DepthButton variant="coin" size="lg" onPress={onClose}>Đóng</DepthButton>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  dialog: { borderTopLeftRadius: radius["2xl"], borderTopRightRadius: radius["2xl"], borderWidth: 2, borderBottomWidth: 0, padding: spacing.xl },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: spacing.base, borderBottomWidth: 1 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  title: { fontSize: fontSize.xl, fontFamily: fontFamily.bold },
  balanceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.md, borderRadius: radius.lg, marginTop: spacing.base },
  balanceLabel: { fontSize: fontSize.sm },
  balanceValue: { fontSize: fontSize.lg, fontFamily: fontFamily.bold },
  packs: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginVertical: spacing.lg },
  pack: { width: "47%", alignItems: "center", padding: spacing.base, borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, gap: spacing.xs },
  packCoins: { fontSize: fontSize.lg, fontFamily: fontFamily.bold },
  packPrice: { fontSize: fontSize.sm },
  badge: { position: "absolute", top: -8, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  badgeText: { color: "#FFF", fontSize: fontSize.xs, fontFamily: fontFamily.bold },
});
