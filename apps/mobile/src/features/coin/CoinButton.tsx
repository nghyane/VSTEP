// CoinButton — topbar coin display (reads from API wallet balance)
import { StyleSheet, Text } from "react-native";
import { HapticTouchable } from "@/components/HapticTouchable";
import { GameIcon } from "@/components/GameIcon";
import { useWalletBalance } from "@/features/wallet/queries";
import { fontSize, fontFamily, radius, spacing, useThemeColors } from "@/theme";

interface CoinButtonProps {
  onPress?: () => void;
}

export function CoinButton({ onPress }: CoinButtonProps) {
  const c = useThemeColors();
  const balance = useWalletBalance();

  return (
    <HapticTouchable style={[styles.container, { backgroundColor: c.coinTint }]} onPress={onPress} activeOpacity={0.7}>
      <GameIcon name="coin" size={20} />
      <Text style={[styles.text, { color: c.coinDark }]}>{balance}</Text>
    </HapticTouchable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  text: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bold,
  },
});
