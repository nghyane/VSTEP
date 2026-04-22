// 3D Depth Button — Duolingo press effect
// Active: translateY(3px) + border-bottom shrinks → "pressed in" illusion
// Synced with frontend-v3 .btn-primary { box-shadow: 0 4px 0 primary-dark }
import { useRef, type ReactNode } from "react";
import { Animated, Pressable, StyleSheet, Text, type ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";
import { fontSize, fontFamily, radius, spacing, useThemeColors } from "@/theme";

type Variant = "primary" | "secondary" | "destructive" | "coin";
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
  const { bg, shadow, text } = getVariantColors(variant, c);
  const sizeStyle = SIZE_MAP[size];

  function handlePressIn() {
    Animated.timing(translateY, { toValue: 4, duration: 60, useNativeDriver: true }).start();
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
      style={fullWidth ? { width: "100%" } : undefined}
    >
      <Animated.View
        style={[
          styles.button,
          sizeStyle,
          {
            backgroundColor: bg,
            // 3D effect: top border = bg color (invisible), bottom border = shadow color
            borderColor: bg,
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
    default: // primary — green
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
    borderBottomWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  text: {
    fontFamily: fontFamily.bold,
    letterSpacing: 0.3,
  },
});
