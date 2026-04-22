// 3D Depth Button — Duolingo press effect, synced with frontend-v3 .btn-primary
import { useRef, useState, type ReactNode } from "react";
import { Animated, Pressable, StyleSheet, Text, type ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";
import { fontSize, fontFamily, radius, spacing, useThemeColors } from "@/theme";

type Variant = "primary" | "secondary" | "destructive" | "coin" | "info";
type Size = "sm" | "md" | "lg";

interface DepthButtonProps {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function DepthButton({
  children,
  variant = "primary",
  size = "md",
  onPress,
  disabled = false,
  style,
  fullWidth = false,
}: DepthButtonProps) {
  const c = useThemeColors();
  const translateY = useRef(new Animated.Value(0)).current;
  const [pressed, setPressed] = useState(false);
  const { bg, shadow, text } = getVariantColors(variant, c);
  const sizeStyle = SIZE_MAP[size];

  function handlePressIn() {
    setPressed(true);
    Animated.timing(translateY, { toValue: 4, duration: 60, useNativeDriver: true }).start();
  }

  function handlePressOut() {
    setPressed(false);
    Animated.timing(translateY, { toValue: 0, duration: 100, useNativeDriver: true }).start();
  }

  function handlePress() {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    onPress?.();
  }

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={fullWidth ? { width: "100%" } : undefined}
    >
      <Animated.View
        style={[
          styles.button,
          sizeStyle,
          {
            backgroundColor: bg,
            borderColor: bg,
            borderBottomWidth: pressed ? 0 : 4,
            borderBottomColor: shadow,
            opacity: disabled ? 0.5 : 1,
            transform: [{ translateY }],
          },
          fullWidth && { width: "100%" },
          style,
        ]}
      >
        {typeof children === "string" ? (
          <Text style={[styles.text, { color: text, fontSize: sizeStyle.fontSize }]}>
            {children.toUpperCase()}
          </Text>
        ) : (
          children
        )}
      </Animated.View>
    </Pressable>
  );
}

function getVariantColors(variant: Variant, c: ReturnType<typeof useThemeColors>) {
  switch (variant) {
    case "secondary":
      return { bg: c.surface, shadow: "#CACACA", text: c.foreground };
    case "destructive":
      return { bg: c.destructive, shadow: "#B71C1C", text: "#FFFFFF" };
    case "coin":
      return { bg: c.coin, shadow: c.coinDark, text: "#FFFFFF" };
    case "info":
      return { bg: c.info, shadow: "#0E7ABF", text: "#FFFFFF" };
    default:
      return { bg: c.primary, shadow: c.primaryDark, text: c.primaryForeground };
  }
}

const SIZE_MAP = {
  sm: { height: 36, paddingHorizontal: spacing.base, fontSize: fontSize.xs, borderRadius: radius.button },
  md: { height: 44, paddingHorizontal: spacing.xl, fontSize: fontSize.sm, borderRadius: radius.button },
  lg: { height: 52, paddingHorizontal: spacing["2xl"], fontSize: fontSize.base, borderRadius: radius.button },
} as const;

const styles = StyleSheet.create({
  button: {
    borderWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  text: {
    fontFamily: fontFamily.bold,
    letterSpacing: 0.5,
  },
});
