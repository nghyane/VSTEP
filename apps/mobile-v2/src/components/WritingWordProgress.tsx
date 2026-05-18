// WritingWordProgress — horizontal bar visualizing word count vs min/max range.
// Mirrors apps/frontend-v3/src/features/practice/components/WritingWordProgress.tsx
// Behavior:
// - Bar fill width = pct of max (clamped at 100%).
// - Min marker line drawn at min/max ratio so the user can see the lower bound.
// - Fill color: success when in range, destructive when over, skill-writing/50 otherwise.
import { StyleSheet, Text, View } from "react-native";

import { fontFamily, fontSize, radius, spacing, useThemeColors } from "@/theme";

interface Props {
  count: number;
  min: number;
  max: number;
}

export function WritingWordProgress({ count, min, max }: Props) {
  const c = useThemeColors();
  const pct = max > 0 ? Math.min(100, (count / max) * 100) : 0;
  const inRange = count >= min && count <= max;
  const over = count > max;
  const minPct = max > 0 ? (min / max) * 100 : 0;

  const fillColor = over ? c.destructive : inRange ? c.success : c.skillWriting + "80";
  const textColor = over ? c.destructive : inRange ? c.success : c.subtle;

  return (
    <View style={s.row}>
      <View style={[s.track, { backgroundColor: c.muted }]}>
        <View style={[s.fill, { width: `${pct}%`, backgroundColor: fillColor }]} />
        <View style={[s.minMarker, { left: `${minPct}%`, backgroundColor: c.border }]} />
      </View>
      <Text style={[s.count, { color: textColor }]}>
        {count} / {min}–{max}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  track: {
    flex: 1,
    height: 8,
    borderRadius: radius.full,
    overflow: "hidden",
    position: "relative",
  },
  fill: { height: "100%", borderRadius: radius.full },
  minMarker: { position: "absolute", top: 0, bottom: 0, width: 1, zIndex: 1 },
  count: { fontSize: fontSize.xs, fontFamily: fontFamily.bold, minWidth: 68, textAlign: "right" },
});
