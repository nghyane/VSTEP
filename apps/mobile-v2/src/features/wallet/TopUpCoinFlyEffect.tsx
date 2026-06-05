import { useEffect, useRef } from "react";
import { Animated, Modal, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { BrandIcon } from "@/components/BrandIcon";
import { fontFamily, fontSize, spacing, useThemeColors } from "@/theme";

interface TargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  visible: boolean;
  coinsAdded: number;
  target: TargetRect | null;
  onDone: () => void;
}

const TRAIL = [0, 120, 240];

export function TopUpCoinFlyEffect({ visible, coinsAdded, target, onDone }: Props) {
  const c = useThemeColors();
  const { width, height } = useWindowDimensions();
  const appear = useRef(new Animated.Value(0)).current;
  const fly = useRef(new Animated.Value(0)).current;
  const label = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      appear.setValue(0);
      fly.setValue(0);
      label.setValue(0);
      return;
    }

    appear.setValue(0);
    fly.setValue(0);
    label.setValue(0);

    Animated.sequence([
      Animated.parallel([
        Animated.spring(appear, { toValue: 1, tension: 90, friction: 6, useNativeDriver: true }),
        Animated.timing(label, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]),
      Animated.delay(260),
      Animated.parallel([
        Animated.timing(fly, { toValue: 1, duration: 820, useNativeDriver: true }),
        Animated.timing(label, { toValue: 0, duration: 260, useNativeDriver: true }),
      ]),
    ]).start(({ finished }) => {
      if (finished) setTimeout(onDone, 180);
    });
  }, [appear, fly, label, onDone, visible]);

  if (!visible) return null;

  const startX = width / 2 - 36;
  const startY = height * 0.58;
  const endX = target ? target.x + target.width / 2 - 18 : width - 54;
  const endY = target ? target.y + target.height / 2 - 18 : 48;
  const translateX = fly.interpolate({ inputRange: [0, 1], outputRange: [0, endX - startX] });
  const translateY = fly.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0, -height * 0.22, endY - startY] });
  const scale = Animated.multiply(
    appear,
    fly.interpolate({ inputRange: [0, 0.72, 1], outputRange: [1, 0.72, 0.38] }),
  );
  const rotate = fly.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "720deg"] });

  return (
    <Modal visible transparent animationType="none">
      <View style={styles.overlay} pointerEvents="none">
        {TRAIL.map((delay, index) => {
          const trailProgress = fly.interpolate({
            inputRange: [0, 0.2 + index * 0.08, 1],
            outputRange: [0, 0, 1],
            extrapolate: "clamp",
          });
          const opacity = fly.interpolate({
            inputRange: [0, 0.25 + index * 0.08, 0.86, 1],
            outputRange: [0, 0.9, 0.45, 0],
            extrapolate: "clamp",
          });
          const trailX = trailProgress.interpolate({ inputRange: [0, 1], outputRange: [0, endX - startX] });
          const trailY = trailProgress.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0, -height * 0.2, endY - startY] });
          return (
            <Animated.View
              key={delay}
              style={[
                styles.trailCoin,
                {
                  left: startX + 20 - index * 8,
                  top: startY + 22 + index * 10,
                  opacity,
                  transform: [{ translateX: trailX }, { translateY: trailY }, { scale: 0.45 - index * 0.06 }],
                },
              ]}
            >
              <BrandIcon name="coin" size={34} />
            </Animated.View>
          );
        })}

        <Animated.View
          style={[
            styles.coin,
            {
              left: startX,
              top: startY,
              transform: [{ translateX }, { translateY }, { rotate }, { scale }],
            },
          ]}
        >
          <BrandIcon name="coin" size={72} />
        </Animated.View>

        <Animated.View
          style={[
            styles.label,
            {
              backgroundColor: c.coin,
              borderBottomColor: c.coinDark,
              left: startX - 6,
              top: startY - 44,
              opacity: label,
              transform: [{ scale: appear }],
            },
          ]}
        >
          <Text style={[styles.labelText, { color: c.coinDark }]}>+{formatNumber(coinsAdded)} xu</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

function formatNumber(value: number): string {
  return value.toLocaleString("vi-VN");
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  coin: {
    position: "absolute",
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  trailCoin: {
    position: "absolute",
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    position: "absolute",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderBottomWidth: 3,
  },
  labelText: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.extraBold,
  },
});
