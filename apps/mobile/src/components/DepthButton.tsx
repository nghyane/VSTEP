// 3D Depth Button — Duolingo press effect (RFC 0002)
// Active: translateY + border-bottom shrinks → "pressed in" illusion
import { useRef, type ReactNode } from "react";
import { Animated, Pressable, StyleSheet, Text, type ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";
import { fontSize, fontFamily, radius, spacing, useThemeColors } from "@/theme";

type Variant = "primary" | "secondary" | "success" | "destructive" | "coin";
type Size = "sm" | "md" | "lg";

interface DepthButtonProps {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export function DepthButton({
  children,
  variant = "primary",
  size = "md",
  onPress,
  disabled = false,
  style,
}: DepthButtonProps) {
  const c = useThemeColors();
  const translateY = useRef(new Animated.Value(0)).current;
  const { bg, borderTop, borderBottom, text } = getVariantColors(variant, c);
  const sizeStyle = SIZE_MAP[size];

  function handlePressIn() {
    Animated.timing(translateY, { toValue: 3, duration: 50, useNativeDriver: true }).start();
  }

  function handlePressOut() {
    Animated.timing(translateY, { toValue: 0, duration: 100, useNativeDriver: true }).start();
  }

  function handlePress() {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  }

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View
        style={[
          styles.button,
          sizeStyle,
          {
            backgroundColor: bg,
            borderColor: borderTop,
            borderBottomColor: borderBottom,
            opacity: disabled ? 0.5 : 1,
            transform: [{ translateY }],
          },
          style,
        ]}
      >
        {typeof children === "string" ? (
          <Text style={[styles.text, { color: text, fontSize: sizeStyle.fontSize }]}>{children}</Text>
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
      return { bg: c.card, borderTop: c.depthBorderLight, borderBottom: c.depthBorderDark, text: c.foreground };
    case "success":
      return { bg: c.success, borderTop: "#16A34A", borderBottom: "#0D7A3A", text: c.successForeground };
    case "destructive":
      return { bg: c.destructive, borderTop: "#C62828", borderBottom: "#8E1C1C", text: c.destructiveForeground };
    case "coin":
      return { bg: c.coin, borderTop: c.coinDark, borderBottom: "#92400E", text: "#FFFFFF" };
    default:
      return { bg: c.primary, borderTop: "#1D4ED8", borderBottom: "#1E3A8A", text: c.primaryForeground };
  }
}

const SIZE_MAP = {
  sm: { height: 36, paddingHorizontal: spacing.base, fontSize: fontSize.xs },
  md: { height: 44, paddingHorizontal: spacing.xl, fontSize: fontSize.sm },
  lg: { height: 52, paddingHorizontal: spacing["2xl"], fontSize: fontSize.base },
} as const;

const styles = StyleSheet.create({
  button: {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  text: {
    fontFamily: fontFamily.bold,
  },
});
