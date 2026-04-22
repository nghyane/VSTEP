// 3D Depth Card — Duolingo signature card, synced with frontend-v3 .card
import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { radius, spacing, useThemeColors } from "@/theme";

type Variant = "neutral" | "primary" | "success" | "destructive" | "skill";

interface DepthCardProps {
  children: ReactNode;
  variant?: Variant;
  skillColor?: string;
  padding?: number;
  style?: ViewStyle;
}

export function DepthCard({
  children,
  variant = "neutral",
  skillColor,
  padding = spacing.lg,
  style,
}: DepthCardProps) {
  const c = useThemeColors();
  const { borderTop, borderBottom, bg } = getColors(variant, skillColor, c);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: bg, borderColor: borderTop, borderBottomColor: borderBottom, padding },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function getColors(variant: Variant, skillColor: string | undefined, c: ReturnType<typeof useThemeColors>) {
  switch (variant) {
    case "primary":
    case "success":
      return { borderTop: c.primary + "40", borderBottom: c.primaryDark, bg: c.primaryTint };
    case "destructive":
      return { borderTop: c.destructive + "40", borderBottom: c.destructive, bg: c.destructiveTint };
    case "skill": {
      const sc = skillColor ?? c.primary;
      return { borderTop: sc + "40", borderBottom: sc, bg: sc + "18" };
    }
    default:
      return { borderTop: "#E5E5E5", borderBottom: "#CACACA", bg: c.card };
  }
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.lg,
  },
});
