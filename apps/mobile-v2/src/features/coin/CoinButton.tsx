import { useCallback, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { BrandIcon } from "@/components/BrandIcon";
import { HapticTouchable } from "@/components/HapticTouchable";
import { useWalletBalance } from "@/features/wallet/queries";
import { TopUpCoinFlyEffect } from "@/features/wallet/TopUpCoinFlyEffect";
import { TopUpSheet } from "@/features/wallet/TopUpSheet";
import { TopUpSuccessPopup } from "@/features/wallet/TopUpSuccessPopup";
import { fontSize, fontFamily, radius, spacing, useThemeColors } from "@/theme";

interface WalletTarget {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function CoinButton() {
  const c = useThemeColors();
  const walletRef = useRef<View>(null);
  const [topUpVisible, setTopUpVisible] = useState(false);
  const [flight, setFlight] = useState<{ coins: number; balance: number; target: WalletTarget | null } | null>(null);
  const [success, setSuccess] = useState<{ coins: number; balance: number } | null>(null);
  const { data } = useWalletBalance();
  const coins = data?.balance ?? 0;

  const handleTopUpSuccess = useCallback((coinsAdded: number, balance: number) => {
    const fallback = () => setFlight({ coins: coinsAdded, balance, target: null });
    if (!walletRef.current) {
      fallback();
      return;
    }

    walletRef.current.measureInWindow((x, y, width, height) => {
      setFlight({ coins: coinsAdded, balance, target: { x, y, width, height } });
    });
  }, []);

  const handleFlightDone = useCallback(() => {
    if (!flight) return;
    setSuccess({ coins: flight.coins, balance: flight.balance });
    setFlight(null);
  }, [flight]);

  return (
    <>
      <View ref={walletRef} collapsable={false}>
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
      </View>
      <TopUpSheet
        visible={topUpVisible}
        onClose={() => setTopUpVisible(false)}
        onSuccess={handleTopUpSuccess}
      />
      <TopUpCoinFlyEffect
        visible={flight !== null}
        coinsAdded={flight?.coins ?? 0}
        target={flight?.target ?? null}
        onDone={handleFlightDone}
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
