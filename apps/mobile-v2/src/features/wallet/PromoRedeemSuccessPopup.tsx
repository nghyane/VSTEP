// Mobile parity với FE v3 `PromoRedeemSuccessPopup`:
// mascot bob + confetti burst + coin badge pop-in + new-balance card.
import { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { DepthButton } from "@/components/DepthButton";
import { GameIcon } from "@/components/GameIcon";
import { Mascot } from "@/components/Mascot";
import { fontFamily, fontSize, radius, spacing, useThemeColors } from "@/theme";

interface Props {
  visible: boolean;
  coinsAdded: number;
  newBalance: number;
  onClose: () => void;
}

const CONFETTI_ANGLES = [15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345];
const COIN_ANGLES = [0, 60, 120, 180, 240, 300];

export function PromoRedeemSuccessPopup({ visible, coinsAdded, newBalance, onClose }: Props) {
  const c = useThemeColors();
  const popScale = useRef(new Animated.Value(0.85)).current;
  const popOpacity = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      popScale.setValue(0.85);
      popOpacity.setValue(0);
      burst.setValue(0);
      badgeScale.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.spring(popScale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
      Animated.timing(popOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
    Animated.timing(burst, { toValue: 1, duration: 1200, useNativeDriver: true, delay: 120 }).start();
    Animated.spring(badgeScale, {
      toValue: 1,
      tension: 100,
      friction: 6,
      delay: 320,
      useNativeDriver: true,
    }).start();
  }, [visible, popScale, popOpacity, burst, badgeScale]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: c.card,
              borderColor: c.border,
              opacity: popOpacity,
              transform: [{ scale: popScale }],
            },
          ]}
        >
          <Pressable onPress={() => undefined}>
            <View style={[styles.header, { backgroundColor: c.coinTint }]}>
              <Text style={[styles.eyebrow, { color: c.primaryDark }]}>ĐỔI MÃ THÀNH CÔNG</Text>
              <Text style={[styles.title, { color: c.foreground }]}>Chúc mừng bạn!</Text>
              <Text style={[styles.subtitle, { color: c.subtle }]}>
                Lạc gửi xu cho bạn rồi nè — chiến đề thôi nào!
              </Text>
            </View>

            <View style={styles.mascotArea}>
              <BurstLayer burst={burst} c={c} />
              <Mascot name="happy" size={150} animation="bounce" />
              <Animated.View
                style={[
                  styles.coinBadge,
                  {
                    backgroundColor: c.coin,
                    borderBottomColor: c.coinDark,
                    transform: [{ rotate: "12deg" }, { scale: badgeScale }],
                  },
                ]}
              >
                <Text style={[styles.coinBadgeText, { color: c.coinDark }]}>
                  +{formatNumber(coinsAdded)}
                </Text>
              </Animated.View>
            </View>

            <View style={styles.footer}>
              <View style={[styles.balanceRow, { backgroundColor: c.background, borderColor: c.border }]}>
                <GameIcon name="coin" size={20} />
                <Text style={[styles.balanceLabel, { color: c.subtle }]}>Số dư</Text>
                <Text style={[styles.balanceValue, { color: c.foreground }]}>
                  {formatNumber(newBalance)} xu
                </Text>
              </View>

              <DepthButton variant="primary" fullWidth onPress={onClose}>
                Tuyệt vời!
              </DepthButton>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

function BurstLayer({
  burst,
  c,
}: {
  burst: Animated.Value;
  c: ReturnType<typeof useThemeColors>;
}) {
  const { width } = useWindowDimensions();
  // Distance keeps confetti inside the popup card (max card width ~380).
  const burstDist = Math.min(width * 0.32, 130);
  const coinDist = Math.min(width * 0.24, 96);
  const palette = [c.primary, c.coin, c.info, c.warning, c.destructive, c.primaryDark];

  return (
    <>
      {CONFETTI_ANGLES.map((angle, i) => {
        const radian = (angle * Math.PI) / 180;
        const dx = Math.cos(radian) * burstDist;
        const dy = Math.sin(radian) * burstDist;
        const tx = burst.interpolate({ inputRange: [0, 1], outputRange: [0, dx] });
        const ty = burst.interpolate({ inputRange: [0, 1], outputRange: [0, dy] });
        const opacity = burst.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 1, 0] });
        return (
          <Animated.View
            key={`confetti-${angle}`}
            style={[
              styles.confetti,
              {
                backgroundColor: palette[i % palette.length],
                opacity,
                transform: [{ translateX: tx }, { translateY: ty }],
              },
            ]}
          />
        );
      })}
      {COIN_ANGLES.map((angle) => {
        const radian = (angle * Math.PI) / 180;
        const dx = Math.cos(radian) * coinDist;
        const dy = Math.sin(radian) * coinDist;
        const tx = burst.interpolate({ inputRange: [0, 1], outputRange: [0, dx] });
        const ty = burst.interpolate({ inputRange: [0, 1], outputRange: [0, dy] });
        const opacity = burst.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1, 0] });
        return (
          <Animated.View
            key={`coin-${angle}`}
            style={[
              styles.coinDot,
              { opacity, transform: [{ translateX: tx }, { translateY: ty }] },
            ]}
          >
            <GameIcon name="coin" size={20} />
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
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    alignItems: "center",
    gap: spacing.xs,
  },
  eyebrow: { fontSize: 10, fontFamily: fontFamily.extraBold, letterSpacing: 1.5 },
  title: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  subtitle: { fontSize: fontSize.sm, fontFamily: fontFamily.medium, textAlign: "center" },
  mascotArea: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  confetti: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  coinDot: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  coinBadge: {
    position: "absolute",
    top: 10,
    right: 24,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderBottomWidth: 3,
  },
  coinBadgeText: { fontSize: fontSize.lg, fontFamily: fontFamily.extraBold },
  footer: { padding: spacing.xl, gap: spacing.md },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 2,
    borderStyle: "dashed",
  },
  balanceLabel: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  balanceValue: { fontSize: fontSize.base, fontFamily: fontFamily.extraBold },
});
