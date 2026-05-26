// TopUpSuccessPopup — celebration modal after successful topup purchase
// Reuses burst animation pattern from PromoRedeemSuccessPopup.
import { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { DepthButton } from "@/components/DepthButton";
import { GameIcon } from "@/components/GameIcon";
import { fontFamily, fontSize, radius, spacing, useThemeColors } from "@/theme";

interface Props {
  visible: boolean;
  coinsAdded: number;
  newBalance: number;
  onClose: () => void;
}

const BURST_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
const COIN_SCATTER = [30, 90, 150, 210, 270, 330];

export function TopUpSuccessPopup({ visible, coinsAdded, newBalance, onClose }: Props) {
  const c = useThemeColors();
  const popScale = useRef(new Animated.Value(0.85)).current;
  const popOpacity = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0)).current;
  const coinSpin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      popScale.setValue(0.85);
      popOpacity.setValue(0);
      burst.setValue(0);
      badgeScale.setValue(0);
      coinSpin.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.spring(popScale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
      Animated.timing(popOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
    Animated.timing(burst, { toValue: 1, duration: 1200, delay: 120, useNativeDriver: true }).start();
    Animated.spring(badgeScale, { toValue: 1, tension: 100, friction: 6, delay: 320, useNativeDriver: true }).start();
    Animated.timing(coinSpin, { toValue: 1, duration: 700, delay: 100, useNativeDriver: true }).start();
  }, [visible, popScale, popOpacity, burst, badgeScale, coinSpin]);

  const spin = coinSpin.interpolate({ inputRange: [0, 0.5, 1], outputRange: ["0deg", "15deg", "0deg"] });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: c.card, borderColor: c.border, opacity: popOpacity, transform: [{ scale: popScale }] },
          ]}
        >
          <Pressable onPress={() => undefined}>
            <View style={[styles.header, { backgroundColor: c.coinTint }]}>
              <Text style={[styles.eyebrow, { color: c.primaryDark }]}>NẠP XU THÀNH CÔNG</Text>
              <Text style={[styles.title, { color: c.foreground }]}>Ting ting!</Text>
              <Text style={[styles.sub, { color: c.subtle }]}>Xu đã sẵn sàng — chiến đề thôi nào.</Text>
            </View>

            <View style={styles.coinArea}>
              <CoinBurst burst={burst} c={c} />
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <GameIcon name="coin" size={100} />
              </Animated.View>
              <Animated.View
                style={[
                  styles.badge,
                  { backgroundColor: c.coin, borderBottomColor: c.coinDark, transform: [{ rotate: "12deg" }, { scale: badgeScale }] },
                ]}
              >
                <Text style={[styles.badgeText, { color: c.coinDark }]}>+{formatNumber(coinsAdded)}</Text>
              </Animated.View>
            </View>

            <View style={styles.footer}>
              <View style={[styles.balanceRow, { backgroundColor: c.background, borderColor: c.border }]}>
                <GameIcon name="coin" size={20} />
                <Text style={[styles.balanceLabel, { color: c.subtle }]}>Số dư</Text>
                <Text style={[styles.balanceValue, { color: c.foreground }]}>{formatNumber(newBalance)} xu</Text>
              </View>
              <DepthButton variant="primary" fullWidth onPress={onClose}>
                Học thôi nào!
              </DepthButton>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

function CoinBurst({ burst, c }: { burst: Animated.Value; c: ReturnType<typeof useThemeColors> }) {
  const { width } = useWindowDimensions();
  const dist = Math.min(width * 0.28, 110);
  const coinDist = Math.min(width * 0.2, 80);
  const palette = [c.coin, c.primary, c.info, c.warning, c.coinDark, c.primaryDark];

  return (
    <>
      {BURST_ANGLES.map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const tx = burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(rad) * dist] });
        const ty = burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(rad) * dist] });
        const opacity = burst.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 1, 0] });
        return (
          <Animated.View
            key={`spark-${angle}`}
            style={[styles.spark, { backgroundColor: palette[i % palette.length], opacity, transform: [{ translateX: tx }, { translateY: ty }] }]}
          />
        );
      })}
      {COIN_SCATTER.map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const tx = burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(rad) * coinDist] });
        const ty = burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(rad) * coinDist] });
        const opacity = burst.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1, 0] });
        return (
          <Animated.View key={`coin-${angle}`} style={[styles.coinDot, { opacity, transform: [{ translateX: tx }, { translateY: ty }] }]}>
            <GameIcon name="coin" size={18} />
          </Animated.View>
        );
      })}
    </>
  );
}

function formatNumber(n: number): string {
  return n.toLocaleString("vi-VN");
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: spacing.xl },
  card: { width: "100%", maxWidth: 400, borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, overflow: "hidden" },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.md, alignItems: "center", gap: spacing.xs },
  eyebrow: { fontSize: 10, fontFamily: fontFamily.extraBold, letterSpacing: 1.5 },
  title: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  sub: { fontSize: fontSize.sm, textAlign: "center" },
  coinArea: { height: 180, alignItems: "center", justifyContent: "center" },
  spark: { position: "absolute", width: 10, height: 10, borderRadius: 5 },
  coinDot: { position: "absolute" },
  badge: { position: "absolute", top: 8, right: 24, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 999, borderBottomWidth: 3 },
  badgeText: { fontSize: fontSize.lg, fontFamily: fontFamily.extraBold },
  footer: { padding: spacing.xl, gap: spacing.md },
  balanceRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radius.md, borderWidth: 2, borderStyle: "dashed" },
  balanceLabel: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  balanceValue: { fontSize: fontSize.base, fontFamily: fontFamily.extraBold },
});
