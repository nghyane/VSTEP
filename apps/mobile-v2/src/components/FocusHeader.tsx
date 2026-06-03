import { Animated, StyleSheet, Text, View } from "react-native";
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
  topInset?: number;
}

export function FocusHeader({ current, total, accentColor, onClose, c, topInset = 0 }: FocusHeaderProps) {
  const pct = total > 0 ? (current / total) * 100 : 0;

  return (
    <View style={[s.root, { borderBottomColor: c.borderLight, paddingTop: topInset + spacing.sm }]}>
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

interface TtsBarProps {
  playing: boolean;
  onToggle: () => void;
  accentColor: string;
  shadowColor?: string;
  c: ThemeColors;
  fillAnim: Animated.Value;
}

export function TtsBar({
  playing, onToggle, accentColor, shadowColor = accentColor, c, fillAnim,
}: TtsBarProps) {
  return (
    <View style={[ttsStyles.card, { backgroundColor: c.card, borderColor: c.border }]}>
      <HapticTouchable
        onPress={onToggle}
        style={[ttsStyles.playBtn, { backgroundColor: accentColor, borderColor: accentColor, borderBottomColor: shadowColor }]}
      >
        <Ionicons
          name={playing ? "stop" : "play"}
          size={20}
          color={c.primaryForeground}
        />
      </HapticTouchable>
      <View style={{ flex: 1 }}>
        <View style={[ttsStyles.track, { backgroundColor: c.muted }]}>
          <Animated.View
            style={[
              ttsStyles.fillAnim,
              {
                backgroundColor: accentColor,
                width: fillAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
        <View style={ttsStyles.row}>
          {playing ? <Text style={[ttsStyles.label, { color: c.subtle }]}>Đang đọc...</Text> : null}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
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

const ttsStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: 16,
    padding: spacing.md,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderBottomWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  fillAnim: {
    height: "100%",
    borderRadius: 3,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 11,
    fontFamily: fontFamily.medium,
  },
});
