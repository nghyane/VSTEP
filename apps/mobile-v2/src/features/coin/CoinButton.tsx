import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { BrandIcon } from "@/components/BrandIcon";
import { HapticTouchable } from "@/components/HapticTouchable";
import { useWalletBalance } from "@/features/wallet/queries";
import { TopUpSheet } from "@/features/wallet/TopUpSheet";
import { TopUpSuccessPopup } from "@/features/wallet/TopUpSuccessPopup";
import { fontSize, fontFamily, radius, spacing, useThemeColors } from "@/theme";

export function CoinButton() {
  const c = useThemeColors();
  const [topUpVisible, setTopUpVisible] = useState(false);
  const [success, setSuccess] = useState<{ coins: number; balance: number } | null>(null);
  const { data } = useWalletBalance();
  const coins = data?.balance ?? 0;

  return (
    <>
      <HapticTouchable
        style={[styles.container, { backgroundColor: c.coinTint }]}
        onPress={() => setTopUpVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.iconWrap}>
          <BrandIcon name="coin" size={18} />
        </View>
        <Text style={[styles.text, { color: c.coinDark }]}>{coins}</Text>
      </HapticTouchable>
      <TopUpSheet
        visible={topUpVisible}
        onClose={() => setTopUpVisible(false)}
        onSuccess={(coinsAdded, balance) => setSuccess({ coins: coinsAdded, balance })}
      />
      <TopUpSuccessPopup
        visible={success !== null}
        coinsAdded={success?.coins ?? 0}
        newBalance={success?.balance ?? 0}
        onClose={() => setSuccess(null)}
      />
    </>
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
