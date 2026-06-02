import { useEffect, useRef, useState } from "react";
import { Animated, Modal, StyleSheet, Text, View } from "react-native";
import { BrandIcon } from "@/components/BrandIcon";
import { GameIcon } from "@/components/GameIcon";
import { DepthButton } from "@/components/DepthButton";
import { useWelcomeGift, dismissWelcomeGift, type GiftKind } from "@/features/onboarding/welcome-gift-store";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

const COUNT_DURATION_MS = 1200;
const COIN_COUNT = 12;

function copyFor(kind: GiftKind, streakDays: number | null) {
  if (kind === "streak-chest") {
    const days = streakDays ?? 0;
    return {
      eyebrow: `Mốc ${days} ngày streak`,
      title: "Tuyệt vời! Bạn vừa mở rương lớn",
      body: `Phần thưởng cho ${days} ngày học liên tục. Giữ vững phong độ!`,
      cta: "Tiếp tục học",
    };
  }
  return {
    eyebrow: "Chào mừng đến VSTEP",
    title: "Quà khởi đầu của bạn",
    body: "Dùng xu để mở khóa gợi ý, mua đề thi và các tính năng luyện tập nâng cao.",
    cta: "Bắt đầu học",
  };
}

export function WelcomeGiftModal() {
  const { amount, kind, streakDays } = useWelcomeGift();
  const c = useThemeColors();
  const [displayed, setDisplayed] = useState(0);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const coinAnims = useRef(
    Array.from({ length: COIN_COUNT }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      scale: new Animated.Value(0.4),
    })),
  ).current;

  useEffect(() => {
    if (amount === null) {
      setDisplayed(0);
      scaleAnim.setValue(0);
      coinAnims.forEach((a) => { a.opacity.setValue(0); a.scale.setValue(0.4); });
      return;
    }

    // Pop-in card
    Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }).start();

    // Coin burst
    const burstDelay = 300;
    coinAnims.forEach((a, i) => {
      const angle = (i / COIN_COUNT) * 2 * Math.PI;
      const dist = 60 + (i % 3) * 20;
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(a.opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(a.scale, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(a.translateX, { toValue: Math.cos(angle) * dist, duration: 600, useNativeDriver: true }),
          Animated.timing(a.translateY, { toValue: Math.sin(angle) * dist, duration: 600, useNativeDriver: true }),
        ]).start(() => {
          Animated.timing(a.opacity, { toValue: 0, duration: 400, useNativeDriver: true }).start();
        });
      }, burstDelay + i * 40);
    });

    // Count-up
    const start = Date.now();
    const interval = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / COUNT_DURATION_MS);
      const eased = 1 - (1 - t) ** 3;
      setDisplayed(Math.round(amount * eased));
      if (t >= 1) clearInterval(interval);
    }, 16);

    return () => clearInterval(interval);
  }, [amount, coinAnims, scaleAnim]);

  if (amount === null) return null;

  const copy = copyFor(kind, streakDays);

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={s.overlay}>
        <Animated.View style={[s.card, { backgroundColor: c.surface, transform: [{ scale: scaleAnim }] }]}>
          <Text style={[s.eyebrow, { color: c.primary }]}>{copy.eyebrow}</Text>
          <Text style={[s.title, { color: c.foreground }]}>{copy.title}</Text>

          <View style={s.chestWrap}>
            {coinAnims.map((a, i) => (
              <Animated.View
                key={`coin-${i}`}
                style={[s.burstCoin, { opacity: a.opacity, transform: [{ translateX: a.translateX }, { translateY: a.translateY }, { scale: a.scale }] }]}
              >
                <BrandIcon name="coin" size={i % 3 === 0 ? 20 : 16} />
              </Animated.View>
            ))}
            <GameIcon name="chest" size={100} />
          </View>

          <View style={s.amountRow}>
            <BrandIcon name="coin" size={32} />
            <Text style={[s.amountText, { color: c.foreground }]}>+{displayed}</Text>
          </View>

          <Text style={[s.body, { color: c.mutedForeground }]}>{copy.body}</Text>

          <DepthButton onPress={dismissWelcomeGift} fullWidth>
            {copy.cta}
          </DepthButton>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: spacing.xl },
  card: { width: "100%", maxWidth: 360, borderRadius: radius["2xl"], padding: spacing.xl, alignItems: "center", gap: spacing.md },
  eyebrow: { fontSize: fontSize.xs, fontFamily: fontFamily.bold, textTransform: "uppercase", letterSpacing: 1 },
  title: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold, textAlign: "center" },
  chestWrap: { width: 160, height: 160, alignItems: "center", justifyContent: "center", marginVertical: spacing.md },
  burstCoin: { position: "absolute" },
  amountRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  amountText: { fontSize: 36, fontFamily: fontFamily.extraBold },
  body: { fontSize: fontSize.sm, textAlign: "center", lineHeight: 20 },
});
