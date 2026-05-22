import { StyleSheet, Text, View } from "react-native";
import { HapticTouchable } from "@/components/HapticTouchable";
import { GameIcon } from "@/components/GameIcon";
import { useWalletBalance } from "@/features/wallet/queries";
import { fontSize, fontFamily, radius, spacing, useThemeColors } from "@/theme";

interface CoinButtonProps {
  onPress?: () => void;
}

export function CoinButton({ onPress }: CoinButtonProps) {
  const c = useThemeColors();
  const { data } = useWalletBalance();
  const coins = data?.balance ?? 0;

  return (
    <HapticTouchable
      style={[styles.container, { backgroundColor: c.coinTint }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconWrap}>
        <GameIcon name="coin" size={18} />
      </View>
      <Text style={[styles.text, { color: c.coinDark }]}>{coins}</Text>
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
    borderRadius: radius.full,
  },
  iconWrap: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bold,
    lineHeight: 18,
  },
});
