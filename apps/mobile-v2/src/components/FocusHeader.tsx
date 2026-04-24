import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HapticTouchable } from "./HapticTouchable";
import { spacing, fontSize, fontFamily } from "@/theme";
import type { ThemeColors } from "@/theme";

interface FocusHeaderProps {
  current: number;
  total: number;
  accentColor: string;
  onClose: () => void;
  c: ThemeColors;
}

export function FocusHeader({ current, total, accentColor, onClose, c }: FocusHeaderProps) {
  const pct = total > 0 ? (current / total) * 100 : 0;

  return (
    <View style={[s.root, { borderBottomColor: c.borderLight }]}>
      <HapticTouchable onPress={onClose} style={s.closeBtn}>
        <Ionicons name="close" size={22} color={c.foreground} />
      </HapticTouchable>

      <View style={[s.track, { backgroundColor: c.muted }]}>
        <View style={[s.fill, { backgroundColor: accentColor, width: `${pct}%` }]} />
      </View>

      <Text style={[s.count, { color: c.subtle }]}>
        {current}/{total}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
  },
  closeBtn: { padding: spacing.xs },
  track: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 3,
  },
  count: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.bold,
    minWidth: 36,
    textAlign: "right",
  },
});
