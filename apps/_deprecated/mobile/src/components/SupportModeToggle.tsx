import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HapticTouchable } from "./HapticTouchable";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

interface Props {
  enabled: boolean;
  onToggle: (value: boolean) => void;
}

export function SupportModeToggle({ enabled, onToggle }: Props) {
  const c = useThemeColors();

  return (
    <HapticTouchable
      style={[
        styles.container,
        {
          borderColor: enabled ? c.primary + "4D" : c.border,
          backgroundColor: enabled ? c.primary + "0D" : "transparent",
        },
      ]}
      onPress={() => onToggle(!enabled)}
      activeOpacity={0.7}
    >
      <Ionicons name="bulb-outline" size={14} color={enabled ? c.primary : c.subtle} />
      <Text
        style={[
          styles.label,
          { color: enabled ? c.primary : c.subtle },
        ]}
      >
        {enabled ? "Hỗ trợ: Bật" : "Hỗ trợ: Tắt"}
      </Text>
    </HapticTouchable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  label: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.medium,
  },
});
