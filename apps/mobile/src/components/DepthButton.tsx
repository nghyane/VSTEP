// DepthButton — V3 Duolingo button (box-shadow bottom simulated via border-b)
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

export function DepthButton({ children, variant = "primary", size = "md", onPress, disabled = false, style }: DepthButtonProps) {
  const c = useThemeColors();
  const translateY = useRef(new Animated.Value(0)).current;
  const { bg, shadow, text } = getVariantColors(variant, c);
  const sizeStyle = SIZE_MAP[size];

  function handlePressIn() {
    Animated.timing(translateY, { toValue: 2, duration: 50, useNativeDriver: true }).start();
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
    <Pressable onPress={handlePress} onPressIn={handlePressIn} onPressOut={handlePressOut} disabled={disabled}>
      <Animated.View
        style={[
          styles.button,
          sizeStyle,
          { backgroundColor: bg, borderBottomColor: shadow, opacity: disabled ? 0.5 : 1, transform: [{ translateY }] },
          style,
        ]}
      >
        {typeof children === "string" ? (
          <Text style={[styles.text, { color: text, fontSize: sizeStyle.fontSize }]}>{children}</Text>
        ) : children}
      </Animated.View>
    </Pressable>
  );
}

function getVariantColors(variant: Variant, c: ReturnType<typeof useThemeColors>) {
  switch (variant) {
    case "secondary":
      return { bg: c.surface, shadow: c.border, text: c.foreground };
    case "success":
      return { bg: c.success, shadow: "#3D8C00", text: "#FFFFFF" };
    case "destructive":
      return { bg: c.destructive, shadow: "#B71C1C", text: "#FFFFFF" };
    case "coin":
      return { bg: c.coin, shadow: c.coinDark, text: "#FFFFFF" };
    default:
      return { bg: c.primary, shadow: c.primaryDark, text: c.primaryForeground };
  }
}

const SIZE_MAP = {
  sm: { height: 36, paddingHorizontal: spacing.base, fontSize: fontSize.xs },
  md: { height: 44, paddingHorizontal: spacing.xl, fontSize: fontSize.sm },
  lg: { height: 52, paddingHorizontal: spacing["2xl"], fontSize: fontSize.base },
} as const;

const styles = StyleSheet.create({
  button: {
    borderBottomWidth: 4,
    borderRadius: radius.button,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  text: {
    fontFamily: fontFamily.bold,
    textTransform: "uppercase",
    letterSpacing: -0.2,
  },
});
